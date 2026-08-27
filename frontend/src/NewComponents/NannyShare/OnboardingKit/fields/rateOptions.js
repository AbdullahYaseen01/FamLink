/*
 * The dual rate question's option lists, shared by both nanny wizards.
 *
 * `label` is the total hourly the cards show; `per` is the halved per-family
 * line; `value` is the stored token parseRange() already understands.
 *
 * "$50+" -> parseFloat 50 and an estimated upper bound. "1-20" is Below $20 so
 * rateIsUsable still sees a min greater than 0.
 */
export const RATE_OPTIONS = {
  shared: [
    { label: "Below $20/hr", per: "Below $10 per family", value: "1-20" },
    { label: "$20–$25/hr", per: "$10–$12.50 per family", value: "20-25" },
    { label: "$25–$30/hr", per: "$12.50–$15 per family", value: "25-30" },
    { label: "$30–$35/hr", per: "$15–$17.50 per family", value: "30-35" },
    { label: "$35–$40/hr", per: "$17.50–$20 per family", value: "35-40" },
    { label: "$40–$45/hr", per: "$20–$22.50 per family", value: "40-45" },
    { label: "$45–$50/hr", per: "$22.50–$25 per family", value: "45-50" },
    { label: "$50+/hr", per: "$25+ per family", value: "50+" },
  ],
  /* Kept so edit-profile hydration can still map a retired solo token to a
     nearest band when the document has budget numbers but no min–max string. */
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
 * open-ended tokens ("50+", "40-45+") can carry a trailing figure their
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

export function toSoloToken(min, max) {
  const lo = String(min ?? "").trim();
  const hi = String(max ?? "").trim();
  if (!lo && !hi) return "";
  return `${lo}-${hi}`;
}

export function fromSoloToken(token) {
  if (!token) return { min: "", max: "" };
  const raw = String(token);
  if (raw.includes("+") && !raw.includes("-")) {
    const n = parseFloat(raw);
    return { min: Number.isFinite(n) ? String(n) : "", max: "" };
  }
  const [min, max = ""] = raw.split("-");
  return { min: min || "", max: String(max).replace("+", "") };
}

export function soloRangeIsUsable(token) {
  const { min, max } = fromSoloToken(token);
  const lo = parseFloat(min);
  const hi = parseFloat(max);
  return Number.isFinite(lo) && lo > 0 && Number.isFinite(hi) && hi >= lo;
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
