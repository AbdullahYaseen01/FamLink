import {
  DollarSign,
  MapPin,
  MessageSquare,
  Users,
} from "lucide-react";
import {
  MultiSelectWithOther,
  OptionPills,
  QuestionBlock,
  TagInputField,
  TextField,
} from "../../OnboardingKit/fields";
import BudgetPills from "../BudgetPills";
import {
  BUDGET_OPTIONS,
  NEAR_WORKPLACE,
  OPTIONS,
  QUESTIONS,
} from "../onboardingConfig";

/*
 * Step 5 — Q18 location, Q19 budget, Q20 communication, Q21 backup care.
 * Q22 and Q23 live on step 6 (Final Notes), per the family spec.
 */
export default function Step5LocationDetails({ values, patch, errors }) {
  const showWorkplace = values.shareLocation?.includes(NEAR_WORKPLACE);

  return (
    <>
      <QuestionBlock
        qKey="q18"
        icon={MapPin}
        label={QUESTIONS.q18.label}
        required
        error={errors.q18}
      >
        <OptionPills
          options={OPTIONS.q18}
          value={values.shareLocation}
          onChange={(next) =>
            patch({
              shareLocation: next,
              /* Same reasoning as the "Other" fields: dropping the pill drops
                 the text, so an invisible work location cannot be submitted. */
              ...(next.includes(NEAR_WORKPLACE)
                ? {}
                : { specifyNearbyWorkplace: "" }),
            })
          }
          multi
        />
        {showWorkplace && (
          <div className="mt-3">
            <TextField
              value={values.specifyNearbyWorkplace}
              onChange={(next) => patch({ specifyNearbyWorkplace: next })}
              placeholder={QUESTIONS.q18.placeholder}
            />
          </div>
        )}
      </QuestionBlock>

      <QuestionBlock
        qKey="q19"
        icon={DollarSign}
        label={QUESTIONS.q19.label}
        required
        error={errors.q19}
      >
        <BudgetPills
          options={BUDGET_OPTIONS}
          value={values.hourlyRateLabel}
          onChange={(next) => patch({ hourlyRateLabel: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q20"
        icon={MessageSquare}
        label={QUESTIONS.q20.label}
        required
        error={errors.q20}
      >
        <MultiSelectWithOther
          options={OPTIONS.q20}
          value={values.communicationPreference}
          specifyValue={values.communicationSpecify}
          onChange={(next) => patch({ communicationPreference: next })}
          onSpecifyChange={(next) => patch({ communicationSpecify: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q21"
        icon={Users}
        label={QUESTIONS.q21.label}
        optional
        divider={false}
      >
        <TagInputField
          value={values.backupCare}
          onChange={(next) => patch({ backupCare: next })}
          placeholder={QUESTIONS.q21.placeholder}
        />
      </QuestionBlock>

    </>
  );
}
