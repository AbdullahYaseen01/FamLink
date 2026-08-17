import { useQuestionInvalid } from "./questionState";
import { controlClass } from "./inputStyles";

export default function TextField({
  value = "",
  onChange,
  placeholder,
  className = "",
  ...rest
}) {
  const invalid = useQuestionInvalid();

  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${controlClass(invalid)} ${className}`}
      {...rest}
    />
  );
}
