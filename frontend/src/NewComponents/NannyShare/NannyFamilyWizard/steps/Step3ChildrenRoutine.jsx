import { Clock, FileText, Heart, Home } from "lucide-react";
import {
  OptionPills,
  QuestionBlock,
  TagInputField,
  TextAreaField,
} from "../../OnboardingKit/fields";
import { CONDITIONAL, OPTIONS, QUESTIONS } from "../onboardingConfig";

/*
 * Step 3 — Q13 age fit, Q14 school/daycare with its conditional field, Q15
 * allergies, Q16 typical day, Q17 routines. Only Q13 and Q14 are required.
 */
export default function Step3ChildrenRoutine({ values, patch, errors }) {
  const showSchool = values.schoolDaycare === CONDITIONAL.q14;

  return (
    <>
      <QuestionBlock
        qKey="q13"
        icon={Heart}
        label={QUESTIONS.q13.label}
        required
        error={errors.q13}
      >
        <OptionPills
          options={OPTIONS.q13}
          value={values.matchFit}
          onChange={(next) => patch({ matchFit: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q14"
        icon={Home}
        label={QUESTIONS.q14.label}
        required
        error={errors.q14}
      >
        <OptionPills
          options={OPTIONS.q14}
          value={values.schoolDaycare}
          onChange={(next) =>
            patch({
              schoolDaycare: next,
              /* Switching to "No" clears the school name as well as hiding it.
                 The mockup only toggles visibility, which would let a stale
                 childrenSchools the user can no longer see reach Mongo. */
              ...(next === CONDITIONAL.q14 ? {} : { childrenSchools: [] }),
            })
          }
        />
        {showSchool && (
          <div className="mt-2.5">
            <TagInputField
              value={values.childrenSchools}
              onChange={(next) => patch({ childrenSchools: next })}
              placeholder={QUESTIONS.q14.placeholder}
            />
          </div>
        )}
      </QuestionBlock>

      <QuestionBlock
        qKey="q15"
        icon={Heart}
        label={QUESTIONS.q15.label}
        optional
      >
        <TagInputField
          value={values.allergies}
          onChange={(next) => patch({ allergies: next })}
          placeholder={QUESTIONS.q15.placeholder}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q16"
        icon={Clock}
        label={QUESTIONS.q16.label}
        optional
      >
        <TextAreaField
          value={values.typicalDay}
          onChange={(next) => patch({ typicalDay: next })}
          placeholder={QUESTIONS.q16.placeholder}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q17"
        icon={FileText}
        label={QUESTIONS.q17.label}
        optional
        divider={false}
      >
        <TextAreaField
          value={values.routinesPreferences}
          onChange={(next) => patch({ routinesPreferences: next })}
          placeholder={QUESTIONS.q17.placeholder}
        />
      </QuestionBlock>
    </>
  );
}
