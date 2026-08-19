import Step1ShareFit from "./Step1ShareFit";
import Step2Availability from "./Step2Availability";
import Step3RoleDetails from "./Step3RoleDetails";
import Step4RateSkills from "./Step4RateSkills";
import Step5Profile from "./Step5Profile";

/* Indexed by step number so the container renders by lookup rather than a
 * five-arm switch. */
export const STEP_COMPONENTS = {
  1: Step1ShareFit,
  2: Step2Availability,
  3: Step3RoleDetails,
  4: Step4RateSkills,
  5: Step5Profile,
};
