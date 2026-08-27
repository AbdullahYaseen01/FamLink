import { Image, List } from "lucide-react";
import {
  PhotoUploadField,
  QuestionBlock,
  TextAreaField,
} from "../../OnboardingKit/fields";
import { QUESTIONS } from "../onboardingConfig";

export default function Step6FinalNotes({ values, patch }) {
  return (
    <>
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
        description="Add a photo to make your profile feel more personal."
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
