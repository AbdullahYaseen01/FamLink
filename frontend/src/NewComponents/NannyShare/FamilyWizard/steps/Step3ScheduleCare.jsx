import { Activity, Calendar, Clock, FileText, Home } from "lucide-react";
import { DayScheduleField, OptionPills, QuestionBlock } from "../../OnboardingKit/fields";
import { EXCLUSIVE, OPTIONS, QUESTIONS } from "../onboardingConfig";

/*
 * Step 3 — Q8 days and times, Q9 flexibility, Q10 child responsibilities,
 * Q11 daily routines, Q12 household add-ons.
 */
export default function Step3ScheduleCare({ values, patch, errors }) {
  return (
    <>
      <QuestionBlock
        qKey="q8"
        icon={Calendar}
        label={QUESTIONS.q8.label}
        required
        error={errors.q8}
      >
        <DayScheduleField
          value={values.specificDays}
          onChange={(next) => patch({ specificDays: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q9"
        icon={Activity}
        label={QUESTIONS.q9.label}
        required
        error={errors.q9}
      >
        <OptionPills
          options={OPTIONS.q9}
          value={values.flexibility}
          onChange={(next) => patch({ flexibility: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q10"
        icon={Clock}
        label={QUESTIONS.q10.label}
        required
        error={errors.q10}
      >
        <OptionPills
          options={OPTIONS.q10}
          value={values.childResponsibilities}
          onChange={(next) => patch({ childResponsibilities: next })}
          multi
          exclusive={EXCLUSIVE.q10}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q11"
        icon={FileText}
        label={QUESTIONS.q11.label}
        optional
      >
        <OptionPills
          options={OPTIONS.q11}
          value={values.dailyRoutine}
          onChange={(next) => patch({ dailyRoutine: next })}
          multi
          exclusive={EXCLUSIVE.q11}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q12"
        icon={Home}
        label={QUESTIONS.q12.label}
        optional
        divider={false}
      >
        <OptionPills
          options={OPTIONS.q12}
          value={values.householdAddOns}
          onChange={(next) => patch({ householdAddOns: next })}
          multi
          exclusive={EXCLUSIVE.q12}
        />
      </QuestionBlock>
    </>
  );
}
