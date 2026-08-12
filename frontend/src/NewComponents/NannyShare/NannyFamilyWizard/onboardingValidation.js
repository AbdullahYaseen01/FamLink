import { ERROR_MESSAGES, REQUIRED_BY_STEP } from "./onboardingConfig";

/*
 * Per-step validation. Returns an errors object keyed by question, empty when
 * the step passes.
 *
 * The base rules and their copy come from the mockup's validateStep(), with the
 * question it fails to check (q19) added — see REQUIRED_BY_STEP. One extra
 * completeness check is layered on that the mockup has no equivalent for,
 * because the retired flow shipped without it and bad data reached Mongo.
 *
 * The mockup's checkRequired() also declares a 'text' branch. It is dead — no
 * entry in its checks map ever uses it — so it is not ported.
 */

/* Was this question answered at all? Keyed by question so the shape of each
 * answer is stated once. */
const ANSWERED = {
  q1: (v) => Boolean(v.forWho),
  q2: (v) => Number(v.numberOfChildren) > 0,
  q3: (v) => (v.agesCare || []).length > 0,
  q5: (v) => Boolean(v.currentSchedule),
  q6: (v) => Boolean(v.joinTiming),
  q7: (v) => Boolean(v.together),
  q8: (v) => Number(v.openToChildren) > 0,
  q9: (v) => Boolean(v.whereCare),
  q10: (v) => Boolean(v.startAvailability),
  q11: (v) => Boolean(v.flexibility),
  q12: (v) => Boolean(v.matchDistance),
  q13: (v) => Boolean(v.matchFit),
  q14: (v) => Boolean(v.schoolDaycare),
  /*
   * Both groups, not either. The mockup's checkRequired tests
   * `block.querySelector('.opt.selected')` across the whole block, so picking a
   * shared rate and no solo rate would pass — and the block is two questions
   * wearing one label.
   *
   * Answeredness rather than a completeness check on Continue (which is where
   * the child-age checks below live) because this question has exactly one error
   * string. There is no second message to swap in, so holding the error until
   * both are picked is simply the truth, and it clears the moment it stops being
   * true.
   */
  q19: (v) => Boolean(v.sharedRate) && Boolean(v.soloRate),
  q20: (v) => Boolean(v.communicationChoice),
  q23: (v) => Boolean(v.hasPets),
  q24: (v) => Boolean(v.okayWithPets),
  /* .trim(), matching the mockup's own `bio` check type in the sibling flow — a
     textarea of spaces is not a bio. */
  qBio: (v) => Boolean((v.bio || "").trim()),
};

/*
 * Is this question answered at all, ignoring the completeness checks below?
 *
 * The container uses this to drop an error the moment its question is answered,
 * which is what the mockup does: selectOpt() ends by removing the block's .error
 * class rather than waiting for the next Continue.
 *
 * Deliberately the answeredness test only. The extra checks report a question
 * that is answered but incomplete — "now enter an age for every child" — and
 * firing those mid-edit would replace one red message with another while the
 * user is still filling the question in. They stay on Continue.
 *
 * An unknown key returns false so it is never auto-cleared: the submit-time rate
 * guard sets its own error, and that must survive until resubmit.
 */
export function isAnswered(key, values) {
  return Boolean(ANSWERED[key]?.(values));
}

/*
 * Q2 and Q8 extra: every rendered age row needs a real age.
 *
 * Without this the payload's toChildrenAges() silently drops the blank rows, so
 * a nanny who picked 3 children and filled two would be stored as having two.
 * The mockup renders the rows and never checks them at all.
 *
 * One factory rather than two near-identical functions, because the two lists
 * differ only in which pair of state keys they read — and Q8's rows also feed
 * preferredAges, so a blank one there costs the profile its only numeric age
 * signal as well as a row.
 */
function childAgeError(countKey, rowsKey) {
  return (values) => {
    const count = Number(values[countKey]) || 0;
    if (!count) return "";

    const rows = values[rowsKey] || [];
    for (let i = 0; i < count; i += 1) {
      const age = parseFloat(rows[i]?.age);
      if (Number.isNaN(age) || age <= 0) {
        return "Please enter an age greater than 0 for every child.";
      }
    }
    return "";
  };
}

const EXTRA_CHECKS = {
  q2: childAgeError("numberOfChildren", "children"),
  q8: childAgeError("openToChildren", "openToChildrenRows"),
};

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
