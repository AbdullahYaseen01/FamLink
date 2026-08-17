import { DollarSign, MapPin, MessageSquare, Users } from "lucide-react";
import {
  BudgetPills,
  OptionPills,
  QuestionBlock,
  TextField,
} from "../fields";
import { BUDGET_OPTIONS, NEAR_WORKPLACE, OPTIONS } from "../onboardingConfig";
import MultiWithOther from "./MultiWithOther";

/*
 * Step 5 — Q18 location, Q19 budget, Q20 communication, Q21 backup care.
 *
 * Q22 is NOT here. The spec lists it under both Step 5 and Step 6, but the
 * mockup's step-5 panel ends at Q21 and only step 6 renders the textarea.
 */
export default function Step5LocationDetails({ values, patch, errors }) {
  const showWorkplace = values.shareLocation?.includes(NEAR_WORKPLACE);

  return (
    <>
      <QuestionBlock
        qKey="q18"
        icon={MapPin}
        label="Where are you open to having the share take place?"
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
              placeholder="Work location or nearest major intersection"
            />
          </div>
        )}
      </QuestionBlock>

      <QuestionBlock
        qKey="q19"
        icon={DollarSign}
        label="Hourly budget for a nanny share"
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
        label="Preferred communication with another family"
        required
        error={errors.q20}
      >
        <MultiWithOther
          qKey="q20"
          value={values.communicationPreference}
          specifyValue={values.communicationSpecify}
          onChange={(next) => patch({ communicationPreference: next })}
          onSpecifyChange={(next) => patch({ communicationSpecify: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q21"
        icon={Users}
        label="Backup care if nanny is unavailable"
        optional
        divider={false}
      >
        <MultiWithOther
          qKey="q21"
          value={values.backupCare}
          specifyValue={values.backupCareSpecify}
          onChange={(next) => patch({ backupCare: next })}
          onSpecifyChange={(next) => patch({ backupCareSpecify: next })}
        />
      </QuestionBlock>
    </>
  );
}
