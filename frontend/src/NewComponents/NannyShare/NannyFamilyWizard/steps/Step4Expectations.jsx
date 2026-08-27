import { DollarSign, MessageSquare, Star } from "lucide-react";
import {
  MultiSelectWithOther,
  OptionPills,
  QuestionBlock,
  SharedRateCards,
  SoloRateRangeField,
  TextAreaField,
} from "../../OnboardingKit/fields";
import { OPTIONS, QUESTIONS, RATE_OPTIONS } from "../onboardingConfig";

/*
 * Step 4 — Q18 expectations, Q19 rates, Q20 communication, Q21 what matters in a
 * match, Q22 languages. Q19 and Q20 are required.
 *
 * Q19 is the override: the mockup's validateStep checks only qb-20 on this step,
 * even though the rate block carries a `*` and ships its own error string.
 */
export default function Step4Expectations({ values, patch, errors }) {
  return (
    <>
      <QuestionBlock
        qKey="q18"
        icon={MessageSquare}
        label={QUESTIONS.q18.label}
        optional
      >
        <TextAreaField
          value={values.expectations}
          onChange={(next) => patch({ expectations: next })}
          placeholder={QUESTIONS.q18.placeholder}
        />
      </QuestionBlock>

      {/* Both rate groups share one block and one error message, matching the
          mockup's qb-19. The 18px gap is the two .rate-sections' margins. */}
      <QuestionBlock
        qKey="q19"
        icon={DollarSign}
        label={QUESTIONS.q19.label}
        required
        error={errors.q19}
        description="This helps families understand your rate and find the right match."
      >
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-[11px] Livvic-Bold uppercase tracking-[0.8px] text-[#001243] mb-2">
              {QUESTIONS.q19.sharedLabel}
            </p>
            <p className="text-[11px] Livvic-Medium text-[#9CA3AF] leading-[1.4] mb-2.5">
              Your total hourly rate when caring for both families' children.
            </p>
            <SharedRateCards
              options={RATE_OPTIONS.shared}
              value={values.sharedRate}
              onChange={(next) => patch({ sharedRate: next })}
            />
          </div>
          <div className="h-px bg-[#E8ECF4]" />
          <div>
            <p className="text-[11px] Livvic-Bold uppercase tracking-[0.8px] text-[#001243] mb-2">
              {QUESTIONS.q19.soloLabel}
            </p>
            <p className="text-[11px] Livvic-Medium text-[#9CA3AF] leading-[1.4] mb-2.5">
              Your hourly rate when caring for only one family's children.
            </p>
            <SoloRateRangeField
              value={values.soloRate}
              onChange={(next) => patch({ soloRate: next })}
            />
          </div>
        </div>
      </QuestionBlock>

      <QuestionBlock
        qKey="q20"
        icon={MessageSquare}
        label={QUESTIONS.q20.label}
        required
        error={errors.q20}
      >
        {/* Single-select here, stored as a one-element communicationPreference
            array in the payload — the schema path is [String] because the family
            questionnaire asks the same question as a multi-select. */}
        <OptionPills
          options={OPTIONS.q20}
          value={values.communicationChoice}
          onChange={(next) => patch({ communicationChoice: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q21"
        icon={Star}
        label={QUESTIONS.q21.label}
        optional
      >
        <TextAreaField
          value={values.matchMattersMost}
          onChange={(next) => patch({ matchMattersMost: next })}
          placeholder={QUESTIONS.q21.placeholder}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q22"
        icon={MessageSquare}
        label={QUESTIONS.q22.label}
        optional
        divider={false}
      >
        <MultiSelectWithOther
          options={OPTIONS.q22}
          value={values.languages}
          specifyValue={values.languagesSpecify}
          onChange={(next) => patch({ languages: next })}
          onSpecifyChange={(next) => patch({ languagesSpecify: next })}
        />
      </QuestionBlock>
    </>
  );
}
