import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useParams, useSearchParams } from "react-router-dom";

import { fireToastMessage } from "../../../toastContainer";
import { fetchWithTimeout } from "../../../Config/fetchWithTimeout";
import { setNannyProfileCompleted } from "../../../Components/Redux/authSlice";
import { nannyshareProfileThunk } from "../../../Components/Redux/nannyShareSlice";

import { emptySchedule, scrollToFirstError } from "../OnboardingKit/fields";
import { REQUIRED_BY_STEP, STEPS, TOTAL_STEPS } from "./onboardingConfig";
import {
  buildProfileFields,
  buildProfileFormData,
  buildSheetPayload,
} from "./onboardingPayload";
import { budgetIsUsable, isAnswered, validateStep } from "./onboardingValidation";
import { STEP_COMPONENTS } from "./steps";
import {
  Card,
  CardFooter,
  CompleteScreen,
  ProgressRail,
  TopBar,
} from "../OnboardingKit/shell";

/*
 * The family onboarding wizard: six steps, Q1-Q23, one container.
 *
 * Replaces the type fan-out (postANannyShare.jsx) and the five near-identical
 * ~900-line share-type containers it routed to. Share type is now Q1, a question
 * inside step 1, which is what made the fan-out unnecessary.
 *
 * All answers live here and the step components hold none. That is deliberate and
 * is what makes Back work: the retired steps each owned an antd Form hoisted
 * through a ref, and the container called resetFields() after every Continue,
 * then tried to re-seed from initialValues -- which ran on mount for some steps
 * and not at all for others, so going back lost answers.
 */

const INITIAL_VALUES = {
  // Step 1
  shareTypeChoice: "",
  otherShareTypeSpecify: "",
  hasNannyChoice: "",
  nannyshareStart: "",
  urgency: "",
  // Step 2
  numberOfChildren: 0,
  children: [],
  childrenSchools: "",
  allergiesHealth: [],
  allergiesHealthSpecify: "",
  // Step 3
  specificDays: emptySchedule(),
  flexibility: "",
  childResponsibilities: [],
  dailyRoutine: [],
  householdAddOns: [],
  // Step 4
  hostingPreference: "",
  pets: [],
  petsSpecify: "",
  parentingStyle: [],
  parentingStyleSpecify: "",
  preferredNannyLanguages: [],
  preferredNannyLanguagesSpecify: "",
  houseRules: [],
  houseRulesSpecify: "",
  // Step 5
  shareLocation: [],
  specifyNearbyWorkplace: "",
  hourlyRateLabel: "",
  communicationPreference: [],
  communicationSpecify: "",
  backupCare: [],
  backupCareSpecify: "",
  // Step 6
  openNotes: "",
  photoFile: null,
  photoPreviewUrl: "",
};

export default function FamilyOnboardingWizard({ login = true, recordId }) {
  const dispatch = useDispatch();
  /* No useNavigate: the spec is explicit that completion does not redirect, so
     the finished state renders in place and CompleteScreen carries the one CTA. */
  const { id: pathId } = useParams();
  const [searchParams] = useSearchParams();

  /*
   * The Sheet record id arrives three different ways, and reading only one of
   * them is a live bug today.
   *
   * nannyShare.js:450 emails the intake link as
   * .../nanny-share-questionnaire/${id} -- a PATH segment -- while
   * postANannyShare.jsx reads only searchParams.get("recordId"). So every
   * emailed logged-out submission currently arrives with a null id and the whole
   * Sheet write is skipped with nothing but a console.error. Reading all three
   * fixes it.
   */
  const sheetRecordId =
    recordId || pathId || searchParams.get("recordId") || "";

  const [step, setStep] = useState(1);
  const [completed, setCompleted] = useState(() => new Set());
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState({});
  const [values, setValues] = useState(INITIAL_VALUES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrefilling, setIsPrefilling] = useState(false);

  const patch = useCallback((partial) => {
    setValues((prev) => ({ ...prev, ...partial }));
  }, []);

  /*
   * The photo preview is an object URL, not a data URL. The mockup reads the file
   * with FileReader.readAsDataURL, which parks a multi-MB base64 string in state
   * and re-renders the whole card on it.
   *
   * Owning the URL here rather than in PhotoUploadField means one place revokes
   * it -- on replace, on remove, and on unmount.
   */
  const photoFile = values.photoFile;
  useEffect(() => {
    if (!photoFile) {
      setValues((prev) =>
        prev.photoPreviewUrl ? { ...prev, photoPreviewUrl: "" } : prev,
      );
      return undefined;
    }

    const url = URL.createObjectURL(photoFile);
    setValues((prev) => ({ ...prev, photoPreviewUrl: url }));
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  /*
   * Pre-seed from the Google Sheet record when we have one. Ported from
   * postANannyShare.jsx, with every read optional-chained: FullTime.jsx:594 does
   * a bare sheetUserData["Number of children"] and throws outright when the flow
   * is entered without router state.
   */
  const prefilledFor = useRef("");
  useEffect(() => {
    if (!sheetRecordId || prefilledFor.current === sheetRecordId) return;

    const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
    if (!scriptUrl) return;

    let cancelled = false;
    prefilledFor.current = sheetRecordId;

    (async () => {
      try {
        setIsPrefilling(true);
        const response = await fetchWithTimeout(
          `${scriptUrl}?recordId=${encodeURIComponent(sheetRecordId)}`,
        );
        const result = await response.json();
        if (cancelled || result?.status !== "success" || !result?.record) return;

        const record = result.record;
        const count = Number(record?.["Number of children"]) || 0;
        const hasNanny = record?.["Already have nanny"];

        setValues((prev) => ({
          ...prev,
          ...(count > 0 && !prev.numberOfChildren
            ? {
                numberOfChildren: count,
                children: Array.from({ length: count }, () => ({
                  age: "",
                  unit: "months",
                })),
              }
            : {}),
          ...(hasNanny && !prev.hasNannyChoice
            ? { hasNannyChoice: matchHasNanny(hasNanny) }
            : {}),
        }));
      } catch {
        /* A missing or slow Sheet must not block the questionnaire — the user can
           still answer everything by hand. */
      } finally {
        if (!cancelled) setIsPrefilling(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sheetRecordId]);

  /*
   * Clear an error as soon as its question is answered, rather than making the
   * user press Continue again to find out they fixed it. This is what the mockup
   * does -- selectOpt() and toggleDay() both end by removing the block's .error
   * class.
   *
   * Only ever removes, never adds: raising a new error while someone is still
   * working through the step would redden questions they have not reached yet.
   * Returning `prev` unchanged when nothing cleared keeps the identity stable so
   * this cannot loop.
   */
  useEffect(() => {
    setErrors((prev) => {
      const shown = Object.keys(prev);
      if (!shown.length) return prev;

      const stillFailing = shown.filter((key) => !isAnswered(key, values));
      if (stillFailing.length === shown.length) return prev;

      return Object.fromEntries(stillFailing.map((key) => [key, prev[key]]));
    });
  }, [values]);

  const requiredKeys = useMemo(() => REQUIRED_BY_STEP[step] || [], [step]);

  function goNext() {
    const stepErrors = validateStep(step, values);

    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      /* Defer to the paint that renders the error styling, or the browser
         scrolls to the block before it has grown its message. */
      requestAnimationFrame(() => scrollToFirstError(requiredKeys, stepErrors));
      return;
    }

    setErrors({});
    setCompleted((prev) => new Set(prev).add(step));

    if (step === TOTAL_STEPS) {
      submit();
      return;
    }

    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* Never validates and never clears state, so going back is always safe. */
  function goBack() {
    if (step === 1) return;
    setErrors({});
    setStep(step - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /*
   * Rail navigation, with the mockup's guard: anything already behind you is
   * reachable, and the next step only once the current one has been completed.
   */
  function goToStep(target) {
    if (done || target === step) return;
    if (target > step && !(target === step + 1 && completed.has(step))) return;
    setErrors({});
    setStep(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    const fields = buildProfileFields(values);

    if (!budgetIsUsable(fields.hourlyBudget)) {
      setErrors({ q19: "Please reselect your hourly budget." });
      setStep(5);
      return;
    }

    setIsSubmitting(true);

    try {
      if (login) {
        const result = await dispatch(
          nannyshareProfileThunk(buildProfileFormData(values)),
        ).unwrap();
        dispatch(setNannyProfileCompleted());

        /* The answers saved but the photo did not. Worth saying out loud: the
           alternative is a completion screen that implies the picture is on the
           profile when it never uploaded. Not thrown -- the questionnaire is
           genuinely done, and the photo can be added from Edit Profile. */
        if (result?.data?.photoWarning) {
          fireToastMessage({
            type: "error",
            message:
              "Your answers were saved, but the photo could not be uploaded. You can add it from Edit Profile.",
          });
        }
      } else {
        await submitToSheet(values, sheetRecordId);
      }

      setCompleted(new Set(STEPS.map((s) => s.n)));
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      fireToastMessage({
        type: "error",
        message:
          error?.message || "We could not save your profile. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const StepComponent = STEP_COMPONENTS[step];
  const activeStep = STEPS[step - 1];

  return (
    <div className="min-h-screen bg-[#F4F6FB] Livvic text-[#001243]">
      {/* Only the standalone questionnaire needs its own bar. Signed in, this
          renders inside the dashboard, which already supplies one: navbar1
          strips its links and profile menu on /dashboard/post-a-nannyShare and
          leaves a bare logo bar, and /dashboard/complete-profile renders the
          public Header instead. Rendering TopBar there would stack two. */}
      {!login && <TopBar />}

      <ProgressRail
        steps={STEPS}
        currentStep={step}
        completedSteps={completed}
        done={done}
        onStepClick={goToStep}
      />

      <main className="max-w-[640px] mx-auto px-6 pt-8 pb-20 max-[600px]:px-3 max-[600px]:pt-5 max-[600px]:pb-10">
        {/* Keyed on the step so React remounts the card and famwiz-fade-up
            replays; a persistent node keeps the class and never animates again. */}
        {done ? (
          <Card key="done">
            {/* Signed out, the one CTA is the Sheet→account conversion step the
                retired FinalSuccessModal carried. Signed in there is nothing to
                convert, so the kit's default dashboard CTA stands. */}
            <CompleteScreen
              {...(login
                ? {}
                : {
                    ctaLabel: "Set up my FamLink profile now",
                    ctaTo: sheetRecordId
                      ? `/hire?recordId=${encodeURIComponent(sheetRecordId)}`
                      : "/hire",
                  })}
            />
          </Card>
        ) : (
          <Card key={step} heading={activeStep.heading} sub={activeStep.sub}>
            <StepComponent values={values} patch={patch} errors={errors} />

            <CardFooter
              onBack={goBack}
              backDisabled={step === 1}
              currentStep={step}
              totalSteps={TOTAL_STEPS}
              isFinalStep={step === TOTAL_STEPS}
              onContinue={goNext}
              isSubmitting={isSubmitting || isPrefilling}
            />
          </Card>
        )}
      </main>
    </div>
  );
}

/*
 * The Sheet stores its own phrasing for "do you have a nanny", which is not the
 * wizard's option text. Match on the first word so either spelling seeds Q2.
 */
function matchHasNanny(sheetValue) {
  const first = String(sheetValue).trim().split(" ")[0].toLowerCase();
  if (first === "yes") return "Yes — we already have a nanny";
  if (first === "no") return "No — we are looking for a nanny";
  return "";
}

/*
 * Logged-out submit: urlencoded POST to the Google Apps Script.
 *
 * Keeps the retired flow's "env var missing" branch so local dev logs the
 * payload instead of dead-ending, and goes through fetchWithTimeout because that
 * endpoint can hang without ever responding -- which is what used to leave the
 * spinner stuck forever.
 */
async function submitToSheet(values, sheetRecordId) {
  if (!sheetRecordId) {
    throw new Error(
      "This questionnaire link is missing its record id. Please use the link from your email.",
    );
  }

  const payload = buildSheetPayload(values, sheetRecordId);
  const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

  if (!scriptUrl) {
    console.warn("VITE_GOOGLE_SCRIPT_URL is not set. Payload:", payload);
    return;
  }

  const response = await fetchWithTimeout(scriptUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(payload).toString(),
  });

  await response.text();
}
