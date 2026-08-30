/**
 * Shared status pill for neighborhood market status.
 * Renders ✦ LAUNCHING or ✦ ACTIVE with consistent design.
 */

const PILL_STYLES = {
  launching: {
    bg: "bg-[#FFF1E0]",
    text: "text-[#C2410C]",
    border: "border-[#F5D5A8]",
    starColor: "#C2410C",
    label: "LAUNCHING",
  },
  active: {
    bg: "bg-[#D6FB9A]",
    text: "text-[#075B49]",
    border: "border-[#A8E86C]",
    starColor: "#075B49",
    label: "ACTIVE",
  },
};

function StarIcon({ color, size = 12 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden="true"
    >
      <path d="M8 0 L9.8 6.2 L16 8 L9.8 9.8 L8 16 L6.2 9.8 L0 8 L6.2 6.2 Z" />
    </svg>
  );
}

export default function StatusPill({ status = "active", className = "" }) {
  const style = PILL_STYLES[status] || PILL_STYLES.active;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-[1.5px] ${style.border} ${style.bg} ${style.text} Livvic-Bold text-[11px] leading-none tracking-[0.08em] uppercase px-3 py-1.5 shrink-0 ${className}`}
    >
      <StarIcon color={style.starColor} />
      {style.label}
    </span>
  );
}

export { PILL_STYLES };
