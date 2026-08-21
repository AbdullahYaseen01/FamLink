import OptionPills from "./OptionPills";

/*
 * One labelled rate group — the `.rate-section` of the nanny wizards' Q12.
 *
 * NOT the family's BudgetPills. That is a two-line card stacking a total rate
 * over a per-family rate; this is a plain single-select whose only difference
 * from OptionPills is geometry (see the `rect` shape), preceded by a small
 * section label and an explanatory sub.
 *
 * Two of these render inside ONE QuestionBlock, sharing a single error message,
 * which is how the mockup's qb-12 is built. So this component deliberately
 * carries no error copy of its own: the block owns it, and the pills pick up
 * their red border from QuestionInvalidContext like every other control.
 *
 * Type scale is straight from the mockup CSS (.rate-section-label is 11px/800
 * uppercase with 0.8px tracking in --muted, .rate-section-sub 11px/500 in
 * --muted-light), not from the .q-label above it.
 */
export default function RateGroupField({
  label,
  sub,
  options = [],
  value,
  onChange,
}) {
  return (
    <div>
      <p className="text-[11px] Livvic-Bold uppercase tracking-[0.8px] text-[#6B7280] mb-2">
        {label}
      </p>
      {sub && (
        <p className="text-[11px] Livvic-Medium text-[#9CA3AF] leading-[1.4] mb-2.5">
          {sub}
        </p>
      )}

      <OptionPills
        options={options}
        value={value}
        onChange={onChange}
        shape="rect"
      />
    </div>
  );
}
