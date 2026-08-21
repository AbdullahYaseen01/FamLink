import {
  DollarSign,
  Image,
  List,
  MapPin,
  MessageSquare,
  Users,
} from "lucide-react";
import {
  MultiSelectWithOther,
  OptionPills,
  PhotoUploadField,
  QuestionBlock,
  TextAreaField,
  TextField,
} from "../../OnboardingKit/fields";
import BudgetPills from "../BudgetPills";
import {
  BUDGET_OPTIONS,
  EXCLUSIVE,
  NEAR_WORKPLACE,
  OPTIONS,
  QUESTIONS,
} from "../onboardingConfig";

/*
 * Step 5 — Q18 location, Q19 budget, Q20 communication, Q21 backup care, plus
 * Q22 open note and Q23 photo.
 *
 * Q22/Q23 were a step 6 of their own, which is how the mockup panels were laid
 * out. That step held nothing required (REQUIRED_BY_STEP had no entry for it), so
 * it was a whole screen the Continue button could never block on. The flow is
 * specified at five steps, and merging the two optional questions in here is the
 * merge that costs nothing — the spec already listed Q22 under step 5 as well.
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
          exclusive={EXCLUSIVE.q20}
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
      >
        <MultiSelectWithOther
          options={OPTIONS.q21}
          exclusive={EXCLUSIVE.q21}
          value={values.backupCare}
          specifyValue={values.backupCareSpecify}
          onChange={(next) => patch({ backupCare: next })}
          onSpecifyChange={(next) => patch({ backupCareSpecify: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q22"
        icon={List}
        label={QUESTIONS.q22.label}
        optional
      >
        <TextAreaField
          value={values.openNotes}
          onChange={(next) => patch({ openNotes: next })}
          placeholder={QUESTIONS.q22.placeholder}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q23"
        icon={Image}
        label={QUESTIONS.q23.label}
        optional
        divider={false}
      >
        <PhotoUploadField
          previewUrl={values.photoPreviewUrl}
          onSelect={(file) => patch({ photoFile: file })}
          onRemove={() => patch({ photoFile: null })}
        />
      </QuestionBlock>
    </>
  );
}
