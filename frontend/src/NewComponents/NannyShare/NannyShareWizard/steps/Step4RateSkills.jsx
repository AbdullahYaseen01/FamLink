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
  RateGroupField,
  TextField,
} from "../../OnboardingKit/fields";
import { EXCLUSIVE, OPTIONS, QUESTIONS, RATE_OPTIONS } from "../onboardingConfig";

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
      >
        <div className="flex flex-col gap-[18px]">
          <RateGroupField
            label={QUESTIONS.q12.sharedLabel}
            sub="When caring for children from both families at the same time"
            options={RATE_OPTIONS.shared}
            value={values.sharedRate}
            onChange={(next) => patch({ sharedRate: next })}
          />
          <RateGroupField
            label={QUESTIONS.q12.soloLabel}
            sub="When caring for only one family's children"
            options={RATE_OPTIONS.solo}
            value={values.soloRate}
            onChange={(next) => patch({ soloRate: next })}
          />
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
        <MultiSelectWithOther
          options={OPTIONS.q14}
          exclusive={EXCLUSIVE.q14}
          value={values.certifications}
          specifyValue={values.certificationsSpecify}
          onChange={(next) => patch({ certifications: next })}
          onSpecifyChange={(next) => patch({ certificationsSpecify: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q15"
        icon={FileText}
        label={QUESTIONS.q15.label}
        optional
      >
        <TextField
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
        <TextField
          value={values.skills}
          onChange={(next) => patch({ skills: next })}
          placeholder={QUESTIONS.q16.placeholder}
        />
      </QuestionBlock>
    </>
  );
}
