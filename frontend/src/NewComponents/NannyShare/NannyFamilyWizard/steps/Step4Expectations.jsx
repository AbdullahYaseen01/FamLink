import { DollarSign, MessageSquare, Star } from "lucide-react";
import {
  MultiSelectWithOther,
  OptionPills,
  QuestionBlock,
  RateGroupField,
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
      >
        <div className="flex flex-col gap-[18px]">
          <RateGroupField
            label={QUESTIONS.q19.sharedLabel}
            sub="When caring for children from both families at the same time"
            options={RATE_OPTIONS.shared}
            value={values.sharedRate}
            onChange={(next) => patch({ sharedRate: next })}
          />
          <RateGroupField
            label={QUESTIONS.q19.soloLabel}
            sub="When caring for only one family's children"
            options={RATE_OPTIONS.solo}
            value={values.soloRate}
            onChange={(next) => patch({ soloRate: next })}
          />
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
