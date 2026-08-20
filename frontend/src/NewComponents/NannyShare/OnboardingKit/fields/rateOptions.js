/*
 * The dual rate question's option lists, shared by both nanny wizards.
 *
 * Both nanny mockups ask the same question with the same ten ranges — the
 * "looking for a share position" flow as its Q12, the "already with a family"
 * flow as its Q19 — so this lives in the kit rather than being transcribed twice.
 * Two copies would be two chances for a glyph or a token to drift, and the tokens
 * are what gets stored.
 *
 * `label` is what the mockup renders; `value` is what gets stored, and the two
 * cannot be the same string. The values are byte-identical to the RANGES table in
 * the retired CompleteProfile/Step5.jsx, so profiles saved through the old flow
 * and through either wizard stay comparable — and parseRange() in each payload
 * builder already knows that shape.
 *
 * "$45+/hr" -> "45-50+" and "$40+/hr" -> "40-45+" look like a mismatch and are
 * not: parseRange parseFloats the leading number whenever a "+" is present and
 * estimates the upper bound from it, so the trailing figure is never read.
 */
export const RATE_OPTIONS = {
  shared: [
    { label: "$25–$30/hr", value: "25-30" },
    { label: "$30–$35/hr", value: "30-35" },
    { label: "$35–$40/hr", value: "35-40" },
    { label: "$40–$45/hr", value: "40-45" },
    { label: "$45+/hr", value: "45-50+" },
  ],
  solo: [
    { label: "$20–$25/hr", value: "20-25" },
    { label: "$25–$30/hr", value: "25-30" },
    { label: "$30–$35/hr", value: "30-35" },
    { label: "$35–$40/hr", value: "35-40" },
    { label: "$40+/hr", value: "40-45+" },
  ],
};

/*
 * "30-35" -> {low: 30, high: 35}. Ported verbatim from the RANGES parser in the
 * retired CompleteProfile/Step5.jsx, so the numbers stored for a given token do
 * not change between it and the wizards.
 *
 * The "+" branch estimates an upper bound from the lower one, which is why the
 * open-ended tokens ("45-50+", "40-45+") can carry a trailing figure their
 * display label does not: it is never read.
 */
export function parseRange(val) {
  if (!val) return { low: 0, high: 0 };

  if (val.includes("+")) {
    const base = parseFloat(val);
    return { low: base, high: base * 1.15 };
  }

  const [low, high] = val.split("-").map(Number);
  return { low, high };
}

/* budget is what the browse filter reads; sharedRate/soloRate are the labels the
 * profile screens print. Both are stored, as the retired Step5 did. */
export function toBudget(sharedRate, soloRate) {
  const shared = parseRange(sharedRate);
  const solo = parseRange(soloRate);

  return {
    sharedRate: { min: shared.low, max: shared.high },
    soloRate: { min: solo.low, max: solo.high },
  };
}

/*
 * Blocks submit when the chosen rate cannot be parsed into usable numbers.
 *
 * budget.sharedRate.{min,max} is the ONLY nanny rate path share.controller.js
 * reads — a profile without it is excluded from every narrowed rate search, so an
 * unparseable label would store a profile no filtered browse can ever find.
 */
export function rateIsUsable(budget) {
  return (
    Number.isFinite(budget?.sharedRate?.min) &&
    Number.isFinite(budget?.sharedRate?.max) &&
    budget.sharedRate.min > 0
  );
}
