import Step1ShareNeeds from "./Step1ShareNeeds";
import Step2Children from "./Step2Children";
import Step3ScheduleCare from "./Step3ScheduleCare";
import Step4Preferences from "./Step4Preferences";
import Step5LocationDetails from "./Step5LocationDetails";
import Step6FinalNotes from "./Step6FinalNotes";

/* Indexed by step number so the container renders by lookup rather than a
 * six-arm switch. */
export const STEP_COMPONENTS = {
  1: Step1ShareNeeds,
  2: Step2Children,
  3: Step3ScheduleCare,
  4: Step4Preferences,
  5: Step5LocationDetails,
  6: Step6FinalNotes,
};
