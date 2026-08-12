import { useQuestionInvalid } from "./questionState";
import { controlClass } from "./inputStyles";

export default function TextAreaField({
  value = "",
  onChange,
  placeholder,
  className = "",
  ...rest
}) {
  const invalid = useQuestionInvalid();

  return (
    <textarea
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${controlClass(invalid)} min-h-[90px] resize-y leading-[1.55] ${className}`}
      {...rest}
    />
  );
}
