import { useQuestionInvalid } from "./questionState";
import { controlClass, todayLocalISODate } from "./inputStyles";

/*
 * Q3 (share start date). Value is a plain `YYYY-MM-DD` string, stored as-is:
 * nannyProfile.nannyshareStart is a String and formatStartDate() in
 * Config/helpFunction.jsx parses that shape.
 *
 * `min` blocks past dates, which is what the retired step2.jsx used antd's
 * disabledDate for.
 */
export default function DateField({ value = "", onChange, className = "" }) {
  const invalid = useQuestionInvalid();

  return (
    <input
      type="date"
      value={value}
      min={todayLocalISODate()}
      onChange={(e) => onChange(e.target.value)}
      className={`${controlClass(invalid)} max-w-[220px] ${className}`}
    />
  );
}
