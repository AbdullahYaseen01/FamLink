import { CheckSquare, Heart, Home } from "lucide-react";
import {
  ChildrenAgesField,
  MultiSelectWithOther,
  OptionPills,
  QuestionBlock,
  TextField,
} from "../../OnboardingKit/fields";
import { EXCLUSIVE, OPTIONS } from "../onboardingConfig";

/*
 * Step 2 — Q5 child count and ages, Q6 schools, Q7 allergies.
 */
export default function Step2Children({ values, patch, errors }) {
  return (
    <>
      <QuestionBlock
        qKey="q5"
        icon={CheckSquare}
        label="How many children need care?"
        required
        error={errors.q5}
      >
        <OptionPills
          options={OPTIONS.q5}
          value={values.numberOfChildren ? String(values.numberOfChildren) : ""}
          onChange={(next) => {
            const count = Number(next);
            patch({
              numberOfChildren: count,
              /* Resize the rows with the count, in the same patch.
                 ChildrenAgesField renders only `count` of them, so lowering the
                 count used to hide the extra rows while leaving their answers in
                 state — a family who picked 3, filled them in, then went back to
                 1 still submitted three childrenAges against numberOfChildren: 1.
                 Both are queried, so the two disagreeing is a real matching bug,
                 not just stale UI. */
              children: Array.from(
                { length: count },
                (_, i) => values.children?.[i] || { age: "", unit: "months" },
              ),
            });
          }}
        />
        {/* The age rows live inside Q5's block, as in the mockup, so a missing
            age reddens the same question that asked for the count. */}
        <ChildrenAgesField
          count={values.numberOfChildren}
          value={values.children}
          onChange={(next) => patch({ children: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q6"
        icon={Home}
        label="Which school(s) do they attend?"
        optional
      >
        <TextField
          value={values.childrenSchools}
          onChange={(next) => patch({ childrenSchools: next })}
          placeholder="e.g. Piedmont Elementary, Montclair Nursery School"
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q7"
        icon={Heart}
        label="Any allergies or health considerations?"
        required
        error={errors.q7}
        divider={false}
      >
        <MultiSelectWithOther
          options={OPTIONS.q7}
          exclusive={EXCLUSIVE.q7}
          value={values.allergiesHealth}
          specifyValue={values.allergiesHealthSpecify}
          onChange={(next) => patch({ allergiesHealth: next })}
          onSpecifyChange={(next) => patch({ allergiesHealthSpecify: next })}
        />
      </QuestionBlock>
    </>
  );
}
