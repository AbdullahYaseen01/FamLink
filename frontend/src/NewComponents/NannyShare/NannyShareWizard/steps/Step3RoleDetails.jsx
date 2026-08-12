import { CheckSquare, Clock, Home } from "lucide-react";
import { OptionPills, QuestionBlock } from "../../OnboardingKit/fields";
import { OPTIONS } from "../onboardingConfig";

/*
 * Step 3 — Q8 responsibilities, Q9 household help, Q10 transportation,
 * Q11 background check.
 */
export default function Step3RoleDetails({ values, patch, errors }) {
  return (
    <>
      <QuestionBlock
        qKey="q8"
        icon={CheckSquare}
        label="What would your role typically include?"
        required
        error={errors.q8}
      >
        <OptionPills
          options={OPTIONS.q8}
          value={values.responsibilities}
          onChange={(next) => patch({ responsibilities: next })}
          multi
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q9"
        icon={Home}
        label="Are you open to helping with household tasks?"
        required
        error={errors.q9}
      >
        <OptionPills
          options={OPTIONS.q9}
          value={values.householdHelp}
          onChange={(next) => patch({ householdHelp: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q10"
        icon={Clock}
        label="Do you have your own reliable transportation?"
        required
        error={errors.q10}
      >
        <OptionPills
          options={OPTIONS.q10}
          value={values.hasTransport}
          onChange={(next) => patch({ hasTransport: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q11"
        icon={CheckSquare}
        label="Are you open to undergoing a background check?"
        required
        error={errors.q11}
        divider={false}
      >
        <OptionPills
          options={OPTIONS.q11}
          value={values.backgroundCheck}
          onChange={(next) => patch({ backgroundCheck: next })}
        />
      </QuestionBlock>
    </>
  );
}
