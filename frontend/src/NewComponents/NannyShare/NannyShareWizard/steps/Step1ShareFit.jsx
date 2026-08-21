import { Briefcase, Heart, Home, User, Users } from "lucide-react";
import { OptionPills, QuestionBlock } from "../../OnboardingKit/fields";
import { OPTIONS, QUESTIONS } from "../onboardingConfig";

/*
 * Step 1 — Q1 share experience, Q2 multi-family comfort, qExperience years of
 * experience, Q3 capacity, Q4 preferred ages, Q5 hosting arrangement.
 *
 * qExperience sits beside the other two experience questions rather than at the
 * end: it is the first thing a family reads on a card, and the block is where the
 * flow already establishes "how much have you done this".
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
        label={QUESTIONS.q1.label}
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
        label={QUESTIONS.q2.label}
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
        qKey="qExperience"
        icon={Briefcase}
        label={QUESTIONS.qExperience.label}
        required
        error={errors.qExperience}
      >
        <OptionPills
          options={OPTIONS.qExperience}
          value={values.careExperience}
          onChange={(next) => patch({ careExperience: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q3"
        icon={Users}
        label={QUESTIONS.q3.label}
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
        label={QUESTIONS.q4.label}
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
        label={QUESTIONS.q5.label}
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
