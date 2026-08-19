import { Award, CheckCircle, Heart, Image, List } from "lucide-react";
import {
  MultiSelectWithOther,
  OptionPills,
  PhotoUploadField,
  QuestionBlock,
  TextAreaField,
} from "../../OnboardingKit/fields";
import { CONDITIONAL, EXCLUSIVE, OPTIONS, QUESTIONS } from "../onboardingConfig";

/*
 * Step 5 — Q23 pets with its conditional multi group, Q24 comfort with the other
 * family's pets, Q25 open notes, Q26 certifications, the bio, Q27 photo.
 *
 * Two departures from the mockup:
 *
 * - The bio question is not in this flow's mockup or spec at all. It is added
 *   because `bio` is what the nanny cards, Search/ViewProfile and the public
 *   /share/:token page print as the blurb, so every nanny finishing this
 *   questionnaire would have shipped a blank one. Copy is the sibling nanny
 *   flow's Q17, transferred whole.
 * - The photo is Optional here. The sibling flow marks the same question
 *   required; each follows its own mockup.
 */
export default function Step5HomeProfile({ values, patch, errors }) {
  const showPetTypes = values.hasPets === CONDITIONAL.q23;

  return (
    <>
      <QuestionBlock
        qKey="q23"
        icon={Heart}
        label={QUESTIONS.q23.label}
        required
        error={errors.q23}
      >
        <OptionPills
          options={OPTIONS.q23}
          value={values.hasPets}
          onChange={(next) =>
            patch({
              hasPets: next,
              /* Switching to "No" clears the pet types AND the Other text, not
                 just the reveal. The mockup only hides them, which would let a
                 petTypes list the user can no longer see reach Mongo. */
              ...(next === CONDITIONAL.q23
                ? {}
                : { petTypes: [], petTypesSpecify: "" }),
            })
          }
        />
        {showPetTypes && (
          <div className="mt-2.5">
            {/* A nested multi-select with its own Other reveal — the group the
                mockup renders inside #pets-field. */}
            <MultiSelectWithOther
              options={OPTIONS.q23Pets}
              value={values.petTypes}
              specifyValue={values.petTypesSpecify}
              onChange={(next) => patch({ petTypes: next })}
              onSpecifyChange={(next) => patch({ petTypesSpecify: next })}
            />
          </div>
        )}
      </QuestionBlock>

      <QuestionBlock
        qKey="q24"
        icon={CheckCircle}
        label={QUESTIONS.q24.label}
        required
        error={errors.q24}
      >
        <OptionPills
          options={OPTIONS.q24}
          value={values.okayWithPets}
          onChange={(next) => patch({ okayWithPets: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q25"
        icon={List}
        label={QUESTIONS.q25.label}
        optional
      >
        <TextAreaField
          value={values.openNotes}
          onChange={(next) => patch({ openNotes: next })}
          placeholder={QUESTIONS.q25.placeholder}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q26"
        icon={Award}
        label={QUESTIONS.q26.label}
        optional
      >
        {/* A shorter list than the sibling flow's — no ECE, no TrustLine. Both
            store the answer in `certifications`; both specs ask for their own. */}
        <MultiSelectWithOther
          options={OPTIONS.q26}
          exclusive={EXCLUSIVE.q26}
          value={values.certifications}
          specifyValue={values.certificationsSpecify}
          onChange={(next) => patch({ certifications: next })}
          onSpecifyChange={(next) => patch({ certificationsSpecify: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="qBio"
        icon={List}
        label={QUESTIONS.qBio.label}
        required
        error={errors.qBio}
      >
        <TextAreaField
          value={values.bio}
          onChange={(next) => patch({ bio: next })}
          placeholder={QUESTIONS.qBio.placeholder}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q27"
        icon={Image}
        label={QUESTIONS.q27.label}
        optional
        divider={false}
      >
        {/* Formats per this flow's mockup. */}
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
