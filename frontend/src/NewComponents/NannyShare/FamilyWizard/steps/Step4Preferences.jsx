import { CheckCircle, CheckSquare, Globe, Heart, Home, MessageSquare } from "lucide-react";
import {
  MultiSelectWithOther,
  OptionPills,
  QuestionBlock,
} from "../../OnboardingKit/fields";
import { EXCLUSIVE, OPTIONS, QUESTIONS } from "../onboardingConfig";

/*
 * Step 4 — Q13 hosting, Q14 pets, Q15 parenting style, Q16 nanny languages,
 * Q17 house rules.
 *
 * Q16 is the first place the app has ever collected preferred nanny languages
 * from a family, so it gets its own schema field rather than relying on
 * nannyProfile's strict:false.
 */
export default function Step4Preferences({ values, patch, errors }) {
  return (
    <>
      <QuestionBlock
        qKey="q13"
        icon={Home}
        label={QUESTIONS.q13.label}
        required
        error={errors.q13}
      >
        <OptionPills
          options={OPTIONS.q13}
          value={values.hostingPreference}
          onChange={(next) => patch({ hostingPreference: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q14"
        icon={Heart}
        label={QUESTIONS.q14.label}
        required
        error={errors.q14}
      >
        <MultiSelectWithOther
          options={OPTIONS.q14}
          exclusive={EXCLUSIVE.q14}
          value={values.pets}
          specifyValue={values.petsSpecify}
          onChange={(next) => patch({ pets: next })}
          onSpecifyChange={(next) => patch({ petsSpecify: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q14b"
        icon={CheckCircle}
        label={QUESTIONS.q14b.label}
        required
        error={errors.q14b}
      >
        <OptionPills
          options={OPTIONS.q14b}
          value={values.okayWithPets}
          onChange={(next) => patch({ okayWithPets: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q15"
        icon={Globe}
        label={QUESTIONS.q15.label}
        optional
      >
        <MultiSelectWithOther
          options={OPTIONS.q15}
          exclusive={EXCLUSIVE.q15}
          value={values.parentingStyle}
          specifyValue={values.parentingStyleSpecify}
          onChange={(next) => patch({ parentingStyle: next })}
          onSpecifyChange={(next) => patch({ parentingStyleSpecify: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q16"
        icon={MessageSquare}
        label={QUESTIONS.q16.label}
        optional
      >
        <MultiSelectWithOther
          options={OPTIONS.q16}
          exclusive={EXCLUSIVE.q16}
          value={values.preferredNannyLanguages}
          specifyValue={values.preferredNannyLanguagesSpecify}
          onChange={(next) => patch({ preferredNannyLanguages: next })}
          onSpecifyChange={(next) =>
            patch({ preferredNannyLanguagesSpecify: next })
          }
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q17"
        icon={CheckSquare}
        label={QUESTIONS.q17.label}
        optional
        divider={false}
      >
        <MultiSelectWithOther
          options={OPTIONS.q17}
          exclusive={EXCLUSIVE.q17}
          value={values.houseRules}
          specifyValue={values.houseRulesSpecify}
          onChange={(next) => patch({ houseRules: next })}
          onSpecifyChange={(next) => patch({ houseRulesSpecify: next })}
        />
      </QuestionBlock>
    </>
  );
}
