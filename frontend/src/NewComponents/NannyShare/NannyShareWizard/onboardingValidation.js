import { DAYS, scheduleErrorMessage } from "../OnboardingKit/fields/schedule";
import { soloRangeIsUsable } from "../OnboardingKit/fields/rateOptions";
import { ERROR_MESSAGES, REQUIRED_BY_STEP } from "./onboardingConfig";

/*
 * Per-step validation. Returns an errors object keyed by question, empty when
 * the step passes.
 *
 * The base rules and their copy come from the mockup's validateStep(), with the
 * two questions it fails to check (Q12, Q18) added — see REQUIRED_BY_STEP. One
 * extra completeness check is layered on that the mockup has no equivalent for,
 * because the retired flow shipped without it and bad data reached Mongo.
 */

/* Was this question answered at all? Keyed by question so the shape of each
 * answer is stated once. */
const ANSWERED = {
  q1: (v) => Boolean(v.shareExperience),
  q2: (v) => Boolean(v.multiFamilyComfort),
  qExperience: (v) => Boolean(v.careExperience),
  q3: (v) => Boolean(v.childrenCapacity),
  q4: (v) => (v.preferredAgeLabels || []).length > 0,
  q5: (v) => Boolean(v.workSetup),
  q6: (v) => DAYS.some((day) => v.specificDays?.[day]?.checked),
  q7: (v) => Boolean(v.startAvailability),
  q8: (v) => (v.responsibilities || []).length > 0,
  q9: (v) => Boolean(v.householdHelp),
  q10: (v) => Boolean(v.hasTransport),
  q11: (v) => Boolean(v.backgroundCheck),
  /*
   * Both groups, not either. The mockup's checkRequired tests
   * `block.querySelector('.opt.selected')` across the whole block, so picking a
   * shared rate and no solo rate passes — and the block is two questions
   * wearing one label.
   *
   * Answeredness rather than a completeness check on Continue (which is where
   * the schedule check below lives) because this question has exactly one error
   * string. There is no second message to swap in, so holding the error until
   * both are picked is simply the truth, and it clears the moment it stops
   * being true.
   */
  q12: (v) => Boolean(v.sharedRate) && soloRangeIsUsable(v.soloRate),
  /* .trim(), matching the mockup's own `bio` check type — a textarea of spaces
     is not a bio. */
  q17: (v) => Boolean((v.bio || "").trim()),
  /* A File, not the preview URL: the URL is derived state and lags a tick
     behind the pick. */
  q18: (v) => Boolean(v.photoFile),
};

/*
 * Is this question answered at all, ignoring the completeness check below?
 *
 * The container uses this to drop an error the moment its question is answered,
 * which is what the mockup does: selectOpt() and toggleDay() both end by
 * removing the block's .error class rather than waiting for the next Continue.
 *
 * An unknown key returns false so it is never auto-cleared: the submit-time rate
 * guard sets its own error, and that must survive until resubmit.
 */
export function isAnswered(key, values) {
  return Boolean(ANSWERED[key]?.(values));
}

/*
 * Q6 extra: a day that is on needs both times, and they have to make sense.
 *
 * The mockup checks only that some day is selected, which would let a checked
 * day through with no hours at all. The retired Screen4.jsx collected the
 * offending day names into one toast; keeping that, but as the question's own
 * error.
 */
function scheduleError(values) {
  return scheduleErrorMessage(values.specificDays);
}

const EXTRA_CHECKS = { q6: scheduleError };

export function validateStep(step, values) {
  const errors = {};

  (REQUIRED_BY_STEP[step] || []).forEach((key) => {
    if (!ANSWERED[key]?.(values)) {
      errors[key] = ERROR_MESSAGES[key];
      return;
    }

    /* Answered, but possibly incomplete — only worth checking once we know
       something was selected. */
    const extra = EXTRA_CHECKS[key]?.(values);
    if (extra) errors[key] = extra;
  });

  return errors;
}

/* The submit-time rate guard lives beside the option list it validates, in the
 * kit, because both nanny questionnaires store the same shape and need it. */
export { rateIsUsable } from "../OnboardingKit/fields/rateOptions";
