import { Clock, FileText, Heart, Home } from "lucide-react";
import {
  OptionPills,
  QuestionBlock,
  TextAreaField,
  TextField,
} from "../../OnboardingKit/fields";
import { CONDITIONAL, OPTIONS } from "../onboardingConfig";

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
        label="What type of child would be the best fit?"
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
        label="Do the children currently attend school or daycare?"
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
              ...(next === CONDITIONAL.q14 ? {} : { childrenSchools: "" }),
            })
          }
        />
        {showSchool && (
          <div className="mt-2.5">
            <TextField
              value={values.childrenSchools}
              onChange={(next) => patch({ childrenSchools: next })}
              placeholder="Which school or daycare do they attend? (optional)"
            />
          </div>
        )}
      </QuestionBlock>

      <QuestionBlock
        qKey="q15"
        icon={Heart}
        label="Any allergies or health considerations?"
        optional
      >
        <TextField
          value={values.allergies}
          onChange={(next) => patch({ allergies: next })}
          placeholder="e.g. Peanut allergy, asthma, medication needs..."
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q16"
        icon={Clock}
        label="What does a typical day look like?"
        optional
      >
        <TextAreaField
          value={values.typicalDay}
          onChange={(next) => patch({ typicalDay: next })}
          placeholder="Include meals, naps, school, outdoor time, activities, or anything else that is part of the children's routine."
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q17"
        icon={FileText}
        label="Any important routines or preferences?"
        optional
        divider={false}
      >
        <TextAreaField
          value={values.routinesPreferences}
          onChange={(next) => patch({ routinesPreferences: next })}
          placeholder="e.g. Nap at 1pm, no screen time before 3pm, outdoor play every afternoon..."
        />
      </QuestionBlock>
    </>
  );
}
