import Step1CurrentSetup from "./Step1CurrentSetup";
import Step2ShareDetails from "./Step2ShareDetails";
import Step3ChildrenRoutine from "./Step3ChildrenRoutine";
import Step4Expectations from "./Step4Expectations";
import Step5HomeProfile from "./Step5HomeProfile";

/* Indexed by step number so the container renders by lookup rather than a
 * five-arm switch. */
export const STEP_COMPONENTS = {
  1: Step1CurrentSetup,
  2: Step2ShareDetails,
  3: Step3ChildrenRoutine,
  4: Step4Expectations,
  5: Step5HomeProfile,
};
