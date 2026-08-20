import { Activity, Calendar, Clock, FileText, Home } from "lucide-react";
import { DayScheduleField, OptionPills, QuestionBlock } from "../../OnboardingKit/fields";
import { EXCLUSIVE, OPTIONS } from "../onboardingConfig";

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
        label="What days and times do you need care?"
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
        label="How flexible are you with scheduling?"
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
        label="Child-related responsibilities"
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
        label="Daily routines or activities to include"
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
        label="Household add-ons"
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
