import { Activity, Calendar, Home, MapPin, UserPlus } from "lucide-react";
import {
  ChildrenAgesField,
  DateField,
  OptionPills,
  QuestionBlock,
} from "../../OnboardingKit/fields";
import { OPTIONS, QUESTIONS } from "../onboardingConfig";

/*
 * Step 2 — Q8 how many additional children can join and their ages, Q9 where
 * care happens, Q10 start date, Q11 schedule flexibility, Q12 distance.
 *
 * Q8's rows are the SECOND children-age list in this questionnaire, pointed at
 * their own state keys. Step 1's are the children already in her care; these are
 * the ones who would join. Same component, different children — and these also
 * feed preferredAges, the only numeric age signal the flow has.
 */
export default function Step2ShareDetails({ values, patch, errors }) {
  return (
    <>
      <QuestionBlock
        qKey="q8"
        icon={UserPlus}
        label={QUESTIONS.q8.label}
        required
        error={errors.q8}
      >
        <OptionPills
          options={OPTIONS.q8}
          value={values.openToChildren ? String(values.openToChildren) : ""}
          onChange={(next) => {
            const count = Number(next) || 0;
            patch({
              openToChildren: count,
              /* Resize with the count in the same patch, for the same reason
                 Step 1 does: rows past `count` stop rendering but would stay in
                 state, and openToChildrenAges feeds preferredAges. */
              openToChildrenRows: Array.from(
                { length: count },
                (_, i) =>
                  values.openToChildrenRows?.[i] || { age: "", unit: "months" },
              ),
            });
          }}
        />
        <ChildrenAgesField
          count={values.openToChildren}
          value={values.openToChildrenRows}
          onChange={(next) => patch({ openToChildrenRows: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q9"
        icon={Home}
        label={QUESTIONS.q9.label}
        required
        error={errors.q9}
      >
        <OptionPills
          options={OPTIONS.q9}
          value={values.whereCare}
          onChange={(next) => patch({ whereCare: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q10"
        icon={Calendar}
        label={QUESTIONS.q10.label}
        required
        error={errors.q10}
      >
        <DateField
          value={values.startAvailability}
          onChange={(next) => patch({ startAvailability: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q11"
        icon={Activity}
        label={QUESTIONS.q11.label}
        required
        error={errors.q11}
      >
        <OptionPills
          options={OPTIONS.q11}
          value={values.flexibility}
          onChange={(next) => patch({ flexibility: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q12"
        icon={MapPin}
        label={QUESTIONS.q12.label}
        required
        error={errors.q12}
        divider={false}
      >
        <OptionPills
          options={OPTIONS.q12}
          value={values.matchDistance}
          onChange={(next) => patch({ matchDistance: next })}
        />
      </QuestionBlock>
    </>
  );
}
