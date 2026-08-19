import { Calendar, Clock, User, Users } from "lucide-react";
import { DateField, OptionPills, QuestionBlock, TextField } from "../../OnboardingKit/fields";
import { OPTIONS, OTHER_LABEL } from "../onboardingConfig";

/*
 * Step 1 — Q1 share type, Q2 existing nanny, Q3 start date, Q4 urgency.
 *
 * Every step takes the same three props and holds no state of its own. That is
 * the fix for the retired flow losing answers: those steps each owned an antd
 * Form instance hoisted through a ref, and the container called resetFields()
 * after every Continue, then tried to re-seed from initialValues -- which ran on
 * mount for some steps and not at all for others. With state living only in the
 * container, Back is free.
 */
export default function Step1ShareNeeds({ values, patch, errors }) {
  const showShareTypeOther = values.shareTypeChoice === OTHER_LABEL;

  return (
    <>
      <QuestionBlock
        qKey="q1"
        icon={Users}
        label="What type of nanny share are you looking for?"
        required
        error={errors.q1}
      >
        <OptionPills
          options={OPTIONS.q1}
          value={values.shareTypeChoice}
          onChange={(next) =>
            patch({
              shareTypeChoice: next,
              /* Switching away from Other drops the free text with it. */
              ...(next === OTHER_LABEL ? {} : { otherShareTypeSpecify: "" }),
            })
          }
        />
        {showShareTypeOther && (
          <div className="mt-3">
            <TextField
              value={values.otherShareTypeSpecify}
              onChange={(next) => patch({ otherShareTypeSpecify: next })}
              placeholder="Please specify..."
            />
          </div>
        )}
      </QuestionBlock>

      <QuestionBlock
        qKey="q2"
        icon={User}
        label="Do you already have a nanny?"
        required
        error={errors.q2}
      >
        <OptionPills
          options={OPTIONS.q2}
          value={values.hasNannyChoice}
          onChange={(next) => patch({ hasNannyChoice: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q3"
        icon={Calendar}
        label="When do you want to start the nanny share?"
        required
        error={errors.q3}
      >
        <DateField
          value={values.nannyshareStart}
          onChange={(next) => patch({ nannyshareStart: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q4"
        icon={Clock}
        label="How urgent is your childcare search?"
        required
        error={errors.q4}
        divider={false}
      >
        <OptionPills
          options={OPTIONS.q4}
          value={values.urgency}
          onChange={(next) => patch({ urgency: next })}
        />
      </QuestionBlock>
    </>
  );
}
