import SharedRateCards from "../OnboardingKit/fields/SharedRateCards";

/*
 * Q19 only. Same card chrome as the nanny shared-care rates (grid, navy
 * selected border, check badge, total over per-family). The family's own
 * totals, per-family lines, and stored `value` strings are passed through
 * unchanged — parseHourlyRate() still matches `$N - $N`.
 */
export default function BudgetPills({ options = [], value, onChange }) {
  return (
    <SharedRateCards
      options={options.map((option) => ({
        label: option.total,
        per: option.per,
        value: option.value,
      }))}
      value={value}
      onChange={onChange}
    />
  );
}
