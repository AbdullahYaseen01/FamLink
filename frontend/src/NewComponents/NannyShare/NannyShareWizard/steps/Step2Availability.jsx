import { Calendar } from "lucide-react";
import {
  DateField,
  DayScheduleField,
  QuestionBlock,
} from "../../OnboardingKit/fields";

/*
 * Step 2 — Q6 available days and times, Q7 start date.
 *
 * The two are coupled in the payload: toSpecificDays anchors each day's "HH:mm"
 * to the Q7 date so the stored timestamps are real moments rather than epoch.
 */
export default function Step2Availability({ values, patch, errors }) {
  return (
    <>
      <QuestionBlock
        qKey="q6"
        icon={Calendar}
        label="Select your available working days and times"
        required
        error={errors.q6}
      >
        <DayScheduleField
          value={values.specificDays}
          onChange={(next) => patch({ specificDays: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q7"
        icon={Calendar}
        label="When are you available to start?"
        required
        error={errors.q7}
        divider={false}
      >
        <DateField
          value={values.startAvailability}
          onChange={(next) => patch({ startAvailability: next })}
        />
      </QuestionBlock>
    </>
  );
}
