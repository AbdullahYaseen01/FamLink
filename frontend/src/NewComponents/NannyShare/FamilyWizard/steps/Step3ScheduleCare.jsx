import { Activity, Calendar, Clock, FileText, Home } from "lucide-react";
import {
  DayScheduleField,
  MultiSelectWithOther,
  OptionPills,
  QuestionBlock,
  TagInputField,
} from "../../OnboardingKit/fields";
import { OPTIONS, QUESTIONS } from "../onboardingConfig";

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
        <MultiSelectWithOther
          options={OPTIONS.q10}
          value={values.childResponsibilities}
          specifyValue={values.childResponsibilitiesSpecify}
          onChange={(next) => patch({ childResponsibilities: next })}
          onSpecifyChange={(next) => patch({ childResponsibilitiesSpecify: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q11"
        icon={FileText}
        label={QUESTIONS.q11.label}
        optional
      >
        <TagInputField
          value={values.dailyRoutine}
          onChange={(next) => patch({ dailyRoutine: next })}
          placeholder={QUESTIONS.q11.placeholder}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q12"
        icon={Home}
        label={QUESTIONS.q12.label}
        optional
        divider={false}
      >
        <p className="mb-2 text-[12.5px] Livvic-SemiBold text-[#001243]">
          {QUESTIONS.q12a.label}
        </p>
        <OptionPills
          options={OPTIONS.q12a}
          value={values.householdHelpFor}
          onChange={(next) => patch({ householdHelpFor: next })}
        />
        <div className="mt-3">
          <p className="mb-2 text-[12.5px] Livvic-SemiBold text-[#001243]">
            {QUESTIONS.q12b.label}
          </p>
          <MultiSelectWithOther
            options={OPTIONS.q12}
            value={values.householdAddOns}
            specifyValue={values.householdAddOnsSpecify}
            onChange={(next) => patch({ householdAddOns: next })}
            onSpecifyChange={(next) => patch({ householdAddOnsSpecify: next })}
          />
        </div>
      </QuestionBlock>
    </>
  );
}
