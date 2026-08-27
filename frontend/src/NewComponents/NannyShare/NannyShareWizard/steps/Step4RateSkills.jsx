import {
  CheckCircle,
  DollarSign,
  FileText,
  MessageSquare,
  Star,
} from "lucide-react";
import {
  MultiSelectWithOther,
  QuestionBlock,
  SharedRateCards,
  SoloRateRangeField,
  TagInputField,
} from "../../OnboardingKit/fields";
import { OPTIONS, QUESTIONS, RATE_OPTIONS } from "../onboardingConfig";

/*
 * Step 4 — Q12 rates, Q13 languages, Q14 certifications, Q15 extra training,
 * Q16 special skills. Only Q12 is required.
 */
export default function Step4RateSkills({ values, patch, errors }) {
  return (
    <>
      {/* Both rate groups share one block and one error message, matching the
          mockup's qb-12. The 18px gap is the two .rate-sections' collapsed
          margins. */}
      <QuestionBlock
        qKey="q12"
        icon={DollarSign}
        label={QUESTIONS.q12.label}
        required
        error={errors.q12}
        description="This helps families understand your rate and find the right match."
      >
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-[11px] Livvic-Bold uppercase tracking-[0.8px] text-[#001243] mb-2">
              {QUESTIONS.q12.sharedLabel}
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
              {QUESTIONS.q12.soloLabel}
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
        qKey="q13"
        icon={MessageSquare}
        label={QUESTIONS.q13.label}
        optional
      >
        <MultiSelectWithOther
          options={OPTIONS.q13}
          value={values.languages}
          specifyValue={values.languagesSpecify}
          onChange={(next) => patch({ languages: next })}
          onSpecifyChange={(next) => patch({ languagesSpecify: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q14"
        icon={CheckCircle}
        label={QUESTIONS.q14.label}
        optional
      >
        <TagInputField
          value={values.certifications}
          onChange={(next) => patch({ certifications: next })}
          placeholder={QUESTIONS.q14.placeholder}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q15"
        icon={FileText}
        label={QUESTIONS.q15.label}
        optional
      >
        <TagInputField
          value={values.customCertifications}
          onChange={(next) => patch({ customCertifications: next })}
          placeholder={QUESTIONS.q15.placeholder}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q16"
        icon={Star}
        label={QUESTIONS.q16.label}
        optional
        divider={false}
      >
        <TagInputField
          value={values.skills}
          onChange={(next) => patch({ skills: next })}
          placeholder={QUESTIONS.q16.placeholder}
        />
      </QuestionBlock>
    </>
  );
}
