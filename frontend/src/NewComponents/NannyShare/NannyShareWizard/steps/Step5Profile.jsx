import { Image, List } from "lucide-react";
import {
  PhotoUploadField,
  QuestionBlock,
  TextAreaField,
} from "../../OnboardingKit/fields";
import { QUESTIONS } from "../onboardingConfig";

/*
 * Step 5 — Q17 bio, Q18 profile photo. Both required, which is where this
 * departs from the mockup: its validateStep checks the bio and not the photo,
 * even though the photo carries a `*` and the spec says Required: Yes.
 */
export default function Step5Profile({ values, patch, errors }) {
  return (
    <>
      <QuestionBlock
        qKey="q17"
        icon={List}
        label={QUESTIONS.q17.label}
        required
        error={errors.q17}
      >
        <TextAreaField
          value={values.bio}
          onChange={(next) => patch({ bio: next })}
          placeholder={QUESTIONS.q17.placeholder}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q18"
        icon={Image}
        label={QUESTIONS.q18.label}
        required
        error={errors.q18}
        divider={false}
      >
        {/* Formats per this flow's mockup, which differs from the family's. */}
        <PhotoUploadField
          previewUrl={values.photoPreviewUrl}
          onSelect={(file) => patch({ photoFile: file })}
          onRemove={() => patch({ photoFile: null })}
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          hint="JPG, JPEG or PNG · Max 10MB"
        />
      </QuestionBlock>
    </>
  );
}
