import { Heart, Home, User, Users } from "lucide-react";
import { OptionPills, QuestionBlock } from "../../OnboardingKit/fields";
import { OPTIONS } from "../onboardingConfig";

/*
 * Step 1 — Q1 share experience, Q2 multi-family comfort, Q3 capacity,
 * Q4 preferred ages, Q5 hosting arrangement.
 *
 * Every step takes the same three props and holds no state of its own. That is
 * the fix for the retired flow losing answers: those steps each owned an antd
 * Form instance hoisted through jobFormRef, the container kept a separate plain
 * formValues object beside it, and Back simply decremented currentStep without
 * re-seeding anything. With state living only in the container, Back is free.
 */
export default function Step1ShareFit({ values, patch, errors }) {
  return (
    <>
      <QuestionBlock
        qKey="q1"
        icon={Users}
        label="Have you worked in a nanny share before?"
        required
        error={errors.q1}
      >
        <OptionPills
          options={OPTIONS.q1}
          value={values.shareExperience}
          onChange={(next) => patch({ shareExperience: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q2"
        icon={User}
        label="Are you comfortable caring for children from multiple families?"
        required
        error={errors.q2}
      >
        <OptionPills
          options={OPTIONS.q2}
          value={values.multiFamilyComfort}
          onChange={(next) => patch({ multiFamilyComfort: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q3"
        icon={Users}
        label="How many children are you most comfortable caring for?"
        required
        error={errors.q3}
      >
        <OptionPills
          options={OPTIONS.q3}
          value={values.childrenCapacity}
          onChange={(next) => patch({ childrenCapacity: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q4"
        icon={Heart}
        label="What ages do you prefer to work with?"
        required
        error={errors.q4}
      >
        {/* The labels are stored raw and converted to {label, min, max} in the
            payload — these strings are the keys of AGE_RANGES. */}
        <OptionPills
          options={OPTIONS.q4}
          value={values.preferredAgeLabels}
          onChange={(next) => patch({ preferredAgeLabels: next })}
          multi
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q5"
        icon={Home}
        label="What type of hosting arrangement are you comfortable with?"
        required
        error={errors.q5}
        divider={false}
      >
        <OptionPills
          options={OPTIONS.q5}
          value={values.workSetup}
          onChange={(next) => patch({ workSetup: next })}
        />
      </QuestionBlock>
    </>
  );
}
