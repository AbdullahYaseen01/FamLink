import { CheckSquare, Heart, Home } from "lucide-react";
import {
  ChildrenAgesField,
  OptionPills,
  QuestionBlock,
  TextField,
} from "../fields";
import { OPTIONS } from "../onboardingConfig";
import MultiWithOther from "./MultiWithOther";

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
          onChange={(next) => patch({ numberOfChildren: Number(next) })}
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
        <MultiWithOther
          qKey="q7"
          value={values.allergiesHealth}
          specifyValue={values.allergiesHealthSpecify}
          onChange={(next) => patch({ allergiesHealth: next })}
          onSpecifyChange={(next) => patch({ allergiesHealthSpecify: next })}
        />
      </QuestionBlock>
    </>
  );
}
