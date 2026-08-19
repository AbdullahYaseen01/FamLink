/*
 * The one place a manifest entry is assembled.
 *
 * Each of the three flow manifests declares only what its config cannot know —
 * which database key a question writes, which control it is asked with, whether
 * it reveals a second field. Everything the wizard already states (the label,
 * the step, the group, whether it blocks Continue, its placeholder, its
 * exclusive options) is read out of that wizard's own onboardingConfig.js.
 *
 * The derived values are spread AFTER the caller's spec, deliberately. It means
 * a manifest cannot override the wizard's wording even by accident: if the two
 * ever disagree, the wizard wins, because the wizard is what the user answered.
 */
export function makeFieldBuilder({ STEPS, QUESTIONS, REQUIRED_BY_STEP, EXCLUSIVE = {} }) {
  const groupByStep = new Map(STEPS.map((s) => [s.n, s.label]));
  const requiredIds = new Set(Object.values(REQUIRED_BY_STEP).flat());

  return function field(qid, spec = {}) {
    const q = QUESTIONS[qid];
    if (!q) throw new Error(`profileFields: no QUESTIONS entry for "${qid}"`);
    if (!groupByStep.has(q.step)) {
      throw new Error(`profileFields: "${qid}" claims step ${q.step}, which STEPS does not define`);
    }

    return {
      /* Defaults the spec may override. */
      isMulti: false,
      specifyKey: null,
      reveal: null,
      alsoWrites: [],
      options: null,
      storedAs: null,
      legacy: false,

      ...spec,

      /* Read from the wizard's config; not overridable. */
      qid,
      label: q.label,
      step: q.step,
      group: groupByStep.get(q.step),
      required: requiredIds.has(qid),
      placeholder: q.placeholder ?? null,
      sharedLabel: q.sharedLabel ?? null,
      soloLabel: q.soloLabel ?? null,
      exclusive: EXCLUSIVE[qid] ?? null,
    };
  };
}

/*
 * A field the profile surfaces keep showing but no wizard asks — `careDescription`,
 * `ageGroupsExp`, `salaryExp`, `careType` on a job-seeking nanny.
 *
 * Kept per decision 7 of the execution plan: nothing writes them from onboarding
 * any more, but real data exists and dropping the rows destroys visibility of
 * answers people gave. They carry `legacy: true` and no `qid`, so a check that
 * every wizard question has exactly one manifest entry stays exact, and
 * `group: null` because they belong to no wizard step — the page that renders
 * them decides where they sit.
 */
export function legacyField(spec) {
  return {
    isMulti: false,
    specifyKey: null,
    reveal: null,
    alsoWrites: [],
    options: null,
    storedAs: null,
    placeholder: null,
    sharedLabel: null,
    soloLabel: null,
    exclusive: null,
    required: false,

    ...spec,

    qid: null,
    step: null,
    group: null,
    legacy: true,
  };
}
