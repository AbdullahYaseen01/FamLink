import { Image, List } from "lucide-react";
import {
  PhotoUploadField,
  QuestionBlock,
  TextAreaField,
} from "../../OnboardingKit/fields";

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
        label="Write a short bio"
        required
        error={errors.q17}
      >
        <TextAreaField
          value={values.bio}
          onChange={(next) => patch({ bio: next })}
          placeholder="Tell families about your childcare experience, the type of position you're looking for, and what you enjoy about working with children."
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q18"
        icon={Image}
        label="Add a profile photo"
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
