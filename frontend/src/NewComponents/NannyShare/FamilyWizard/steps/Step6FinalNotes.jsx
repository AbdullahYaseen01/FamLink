import { Image, List } from "lucide-react";
import { PhotoUploadField, QuestionBlock, TextAreaField } from "../fields";

/*
 * Step 6 — Q22 free-text notes, Q23 profile photo. Both optional, so
 * Complete Profile never blocks on this step.
 *
 * Q22 lives only here. The spec also lists it under Step 5, but the mockup's
 * step-5 panel ends at Q21 and this is the panel that renders the textarea.
 */
export default function Step6FinalNotes({ values, patch }) {
  return (
    <>
      <QuestionBlock
        qKey="q22"
        icon={List}
        label="Anything else another family should know?"
        optional
      >
        <TextAreaField
          value={values.openNotes}
          onChange={(next) => patch({ openNotes: next })}
          placeholder="Add any additional notes here..."
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q23"
        icon={Image}
        label="Add a profile photo"
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
