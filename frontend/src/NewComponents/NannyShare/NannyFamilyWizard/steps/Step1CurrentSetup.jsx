import { Briefcase, Calendar, Clock, Heart, Users } from "lucide-react";
import {
  ChildrenAgesField,
  OptionPills,
  QuestionBlock,
} from "../../OnboardingKit/fields";
import { OPTIONS, QUESTIONS, q2Label, q5Label } from "../onboardingConfig";

/*
 * Step 1 — Q1 who the share is for, Q2 current child count and ages, Q3 their
 * age bands, qExperience years of experience, Q5 current schedule, Q6 when a
 * second family joins, Q7 whether the children overlap.
 *
 * There is no Q4: the mockup's ids skip it, and what the spec calls "Q4" is this
 * step's q5. qExperience is not the missing q4 — it is an addition over the
 * mockup and carries a named id for that reason. See onboardingConfig.
 *
 * Every step takes the same three props and holds no state of its own. That is
 * the fix for the retired flow losing answers: its steps each owned an antd Form
 * hoisted through familyFormRef, with a separate plain formValues object beside
 * it. With state living only in the container, Back is free.
 */
export default function Step1CurrentSetup({ values, patch, errors }) {
  return (
    <>
      <QuestionBlock
        qKey="q1"
        icon={Users}
        label={QUESTIONS.q1.label}
        required
        error={errors.q1}
      >
        <OptionPills
          options={OPTIONS.q1}
          value={values.forWho}
          onChange={(next) => patch({ forWho: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q2"
        icon={Users}
        label={q2Label(values.forWho)}
        required
        error={errors.q2}
      >
        <OptionPills
          options={OPTIONS.q2}
          /* Bound to the pill's own string, not to String(numberOfChildren):
             the third option is "3+", which no round trip through a Number can
             reproduce, so the selection would not survive Back. */
          value={values.childCountChoice}
          onChange={(next) => {
            /* "3+" is three rows and numberOfChildren: 3 — the mockup's
               updateChildren(3). parseInt stops at the "+". */
            const count = parseInt(next, 10) || 0;
            patch({
              /* Store the pill's own string so re-rendering the group re-selects
                 the pill that was clicked: "3+" and String(3) are not equal. */
              childCountChoice: next,
              numberOfChildren: count,
              /* Resize the rows with the count, in the same patch.
                 ChildrenAgesField renders only `count` of them, so lowering the
                 count would otherwise hide the extra rows while leaving their
                 answers in state — and a nanny who picked 3, filled them in,
                 then went back to 1 would still submit three childrenAges
                 against numberOfChildren: 1. Both are queried, so the two
                 disagreeing is a real matching bug, not just stale UI. */
              children: Array.from(
                { length: count },
                (_, i) => values.children?.[i] || { age: "", unit: "months" },
              ),
            });
          }}
        />
        {/* The age rows live inside Q2's block, as in the mockup, so a missing
            age reddens the same question that asked for the count. */}
        <ChildrenAgesField
          count={values.numberOfChildren}
          value={values.children}
          onChange={(next) => patch({ children: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q3"
        icon={Heart}
        label={QUESTIONS.q3.label}
        required
        error={errors.q3}
      >
        <OptionPills
          options={OPTIONS.q3}
          value={values.agesCare}
          onChange={(next) => patch({ agesCare: next })}
          multi
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="qExperience"
        icon={Briefcase}
        label={QUESTIONS.qExperience.label}
        required
        error={errors.qExperience}
      >
        <OptionPills
          options={OPTIONS.qExperience}
          value={values.careExperience}
          onChange={(next) => patch({ careExperience: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q5"
        icon={Clock}
        label={q5Label(values.forWho)}
        required
        error={errors.q5}
      >
        {/* Also writes careType, lowercased, in the payload — the one answer in
            this flow whose casing is queried. */}
        <OptionPills
          options={OPTIONS.q5}
          value={values.currentSchedule}
          onChange={(next) => patch({ currentSchedule: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q6"
        icon={Calendar}
        label={QUESTIONS.q6.label}
        required
        error={errors.q6}
      >
        <OptionPills
          options={OPTIONS.q6}
          value={values.joinTiming}
          onChange={(next) => patch({ joinTiming: next })}
        />
      </QuestionBlock>

      <QuestionBlock
        qKey="q7"
        icon={Users}
        label={QUESTIONS.q7.label}
        required
        error={errors.q7}
        divider={false}
      >
        <OptionPills
          options={OPTIONS.q7}
          value={values.together}
          onChange={(next) => patch({ together: next })}
        />
      </QuestionBlock>
    </>
  );
}
