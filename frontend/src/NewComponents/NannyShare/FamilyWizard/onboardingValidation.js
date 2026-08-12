import { DAYS } from "./fields/schedule";
import { ERROR_MESSAGES, REQUIRED_BY_STEP } from "./onboardingConfig";

/*
 * Per-step validation. Returns an errors object keyed by question, empty when
 * the step passes.
 *
 * The base rules and their copy come from the mockup's validateStep(). Two extra
 * checks are layered on that the mockup has no equivalent for -- both exist
 * because the retired flow shipped without them and bad data reached Mongo.
 */

/* Was this question answered at all? Keyed by question so the shape of each
 * answer is stated once. */
const ANSWERED = {
  q1: (v) => Boolean(v.shareTypeChoice),
  q2: (v) => Boolean(v.hasNannyChoice),
  q3: (v) => Boolean(v.nannyshareStart),
  q4: (v) => Boolean(v.urgency),
  q5: (v) => Number(v.numberOfChildren) > 0,
  q7: (v) => (v.allergiesHealth || []).length > 0,
  q8: (v) => DAYS.some((day) => v.specificDays?.[day]?.checked),
  q9: (v) => Boolean(v.flexibility),
  q10: (v) => (v.childResponsibilities || []).length > 0,
  q13: (v) => Boolean(v.hostingPreference),
  q14: (v) => (v.pets || []).length > 0,
  q18: (v) => (v.shareLocation || []).length > 0,
  q19: (v) => Boolean(v.hourlyRateLabel),
  q20: (v) => (v.communicationPreference || []).length > 0,
};

/*
 * Is this question answered at all, ignoring the completeness checks below?
 *
 * The container uses this to drop an error the moment its question is answered,
 * which is what the mockup does: selectOpt() and toggleDay() both end by
 * removing the block's .error class rather than waiting for the next Continue.
 *
 * Deliberately the answeredness test only. The extra checks report a question
 * that is answered but incomplete — "now enter an age for every child" — and
 * firing those mid-edit would replace one red message with another while the
 * user is still filling the question in. They stay on Continue.
 *
 * An unknown key returns false so it is never auto-cleared: the submit-time
 * budget guard sets its own error, and that must survive until resubmit.
 */
export function isAnswered(key, values) {
  return Boolean(ANSWERED[key]?.(values));
}

/*
 * Q5 extra: every rendered age row needs a real age.
 *
 * Without this the payload's toChildrenAges() silently drops the blank rows, so
 * a family who picked 3 children and filled two ages would be stored as having
 * two. resolveChildrenAges in the old flow guarded this with a toast and an
 * empty return; surfacing it on the question is the point of the redesign.
 */
function childAgeError(values) {
  const count = Number(values.numberOfChildren) || 0;
  if (!count) return "";

  const rows = values.children || [];
  for (let i = 0; i < count; i += 1) {
    const age = parseFloat(rows[i]?.age);
    if (Number.isNaN(age) || age <= 0) {
      return "Please enter an age greater than 0 for every child.";
    }
  }
  return "";
}

/*
 * Q8 extra: a day that is on needs both times, and they have to make sense.
 *
 * The mockup checks only that some day is selected, which would let a checked
 * day through with no hours at all. The retired FullTime.jsx collected the
 * offending day names into one message; keeping that, but as the question's own
 * error rather than a toast.
 */
function scheduleError(values) {
  const schedule = values.specificDays || {};
  const active = DAYS.filter((day) => schedule[day]?.checked);
  if (!active.length) return "";

  const missing = active.filter(
    (day) => !schedule[day].start || !schedule[day].end,
  );
  if (missing.length) {
    return `Please add a start and end time for ${missing.join(", ")}.`;
  }

  const inverted = active.filter(
    (day) => schedule[day].end <= schedule[day].start,
  );
  if (inverted.length) {
    return `End time must be after start time for ${inverted.join(", ")}.`;
  }

  return "";
}

const EXTRA_CHECKS = { q5: childAgeError, q8: scheduleError };

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

/*
 * Blocks submit when the chosen budget cannot be parsed into usable numbers.
 *
 * hourlyBudget.minShare is what the browse filter compares against, so an
 * unparseable label would store a profile that no search can ever match. The
 * retired FullTime.jsx had the same guard at its final step.
 */
export function budgetIsUsable(hourlyBudget) {
  return Boolean(hourlyBudget?.min && hourlyBudget?.minShare);
}
