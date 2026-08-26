import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";

import { fireToastMessage } from "../../../toastContainer";
import { setNannyProfileCompleted } from "../../../Components/Redux/authSlice";
import { nannyshareProfileThunk } from "../../../Components/Redux/nannyShareSlice";

import { scrollToFirstError } from "../OnboardingKit/fields";
import { Card, CardFooter, CompleteScreen, ProgressRail } from "../OnboardingKit/shell";
import { REQUIRED_BY_STEP, STEPS, TOTAL_STEPS } from "./onboardingConfig";
import { buildProfileFields, buildProfileFormData } from "./onboardingPayload";
import { isAnswered, rateIsUsable, validateStep } from "./onboardingValidation";
import { STEP_COMPONENTS } from "./steps";

/*
 * The nanny "with a family, looking for a share" wizard: five steps, Q1-Q27, one
 * container.
 *
 * Replaces LookingForFamily/Screen4.jsx and the eight CompleteProfile/Step*.jsx
 * it routed to. That container had the same per-step antd Form + formRef
 * plumbing and toast-only validation as its sibling, plus two problems of its
 * own: it substituted the FAMILY budget component for its own step 5 and stored
 * the answer as hourlyBudget, so no nanny who came through it has ever had a
 * budget.sharedRate for the browse filter to read; and hasFamily: true was never
 * written, so these profiles were invisible to their own browse filter. Both are
 * fixed in onboardingPayload.js.
 */

/*
 * Keyed by schema field name wherever possible, so the payload builder is close
 * to a passthrough. The exceptions are named for what they are: childCountChoice
 * holds Q2's pill string ("3+" does not survive a round trip through a Number),
 * openToChildrenRows holds Q8's raw {age, unit} rows, communicationChoice is the
 * single answer that becomes a one-element array, and photoFile/photoPreviewUrl
 * never reach the document.
 */
const INITIAL_VALUES = {
  // Step 1 — current setup
  forWho: "",
  childCountChoice: "",
  numberOfChildren: 0,
  children: [],
  agesCare: [],
  careExperience: "",
  currentSchedule: "",
  joinTiming: "",
  together: "",
  // Step 2 — share details
  openToChildren: 0,
  openToChildrenRows: [],
  whereCare: "",
  startAvailability: "",
  flexibility: "",
  matchDistance: "",
  // Step 3 — children & routine
  matchFit: "",
  schoolDaycare: "",
  childrenSchools: [],
  allergies: [],
  typicalDay: "",
  routinesPreferences: "",
  // Step 4 — expectations
  expectations: "",
  sharedRate: "",
  soloRate: "",
  communicationChoice: "",
  matchMattersMost: "",
  languages: [],
  languagesSpecify: "",
  // Step 5 — home & profile
  hasPets: "",
  petTypes: [],
  petTypesSpecify: "",
  okayWithPets: "",
  openNotes: "",
  certifications: [],
  certificationsSpecify: "",
  bio: "",
  photoFile: null,
  photoPreviewUrl: "",
};

/* No props: this wizard is reached only through /dashboard/complete-profile, so
 * there is no logged-out path, no Google-Sheet submit and no record id. */
export default function NannyFamilyOnboardingWizard() {
  const dispatch = useDispatch();
  const [step, setStep] = useState(1);
  const [completed, setCompleted] = useState(() => new Set());
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState({});
  const [values, setValues] = useState(INITIAL_VALUES);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const patch = useCallback((partial) => {
    setValues((prev) => ({ ...prev, ...partial }));
  }, []);

  /*
   * The photo preview is an object URL, not a data URL. The mockup reads the
   * file with FileReader.readAsDataURL, which parks a multi-MB base64 string in
   * state and re-renders the whole card on it.
   *
   * Owning the URL here rather than in PhotoUploadField means one place revokes
   * it — on replace, on remove, and on unmount.
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
   * Clear an error as soon as its question is answered, rather than making the
   * user press Continue again to find out they fixed it. This is what the mockup
   * does — selectOpt() ends by removing the block's .error class.
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

    /* budget.sharedRate.{min,max} is the only nanny rate path the browse filter
       reads, so a profile that stored an unparseable one would be excluded from
       every narrowed search. This flow has never written it at all — it stored
       the family's hourlyBudget instead — so getting it wrong here would leave
       the bug in place. Bounce back to the question rather than saving it. */
    if (!rateIsUsable(fields.budget)) {
      setErrors({ q19: "Please reselect your shared-care rate." });
      setStep(4);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await dispatch(
        nannyshareProfileThunk(buildProfileFormData(values)),
      ).unwrap();
      dispatch(setNannyProfileCompleted());

      /* The answers saved but the photo did not. Worth saying out loud, and it is
         the one message that must survive the redirect below — the alternative is
         landing on a dashboard that implies the picture is on the profile when it
         never uploaded. Not thrown: the questionnaire is genuinely done, and the
         photo can be added from Edit Profile. */
      if (result?.data?.photoWarning) {
        fireToastMessage({
          type: "error",
          message:
            "Your answers were saved, but the photo could not be uploaded. You can add it from Edit Profile.",
        });
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
    /* No TopBar: this renders inside /dashboard/complete-profile, which already
       supplies the public Header. Rendering one here would stack two. */
    <div className={`min-h-screen Livvic text-[#001243] ${done ? "famwiz-page is-complete" : "bg-[#F4F6FB]"}`}>
      <ProgressRail
        steps={STEPS}
        currentStep={step}
        completedSteps={completed}
        done={done}
        onStepClick={goToStep}
      />

      <main className="max-w-[640px] mx-auto px-6 pt-8 pb-20 max-[600px]:px-3 max-[600px]:pt-5 max-[600px]:pb-10">
        {done ? (
          <Card key="done">
            <CompleteScreen />
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
              isSubmitting={isSubmitting}
            />
          </Card>
        )}
      </main>
    </div>
  );
}
