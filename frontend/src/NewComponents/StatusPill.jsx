/**
 * Shared status pill for neighborhood market status.
 * Renders ✦ LAUNCHING or ✦ ACTIVE with consistent design.
 */

const PILL_STYLES = {
  launching: {
    bg: "bg-[#FBF1DD]",
    text: "text-[#9D6C2E]",
    border: "border-[#EBD097]",
    starColor: "#DB8C4B",
    label: "LAUNCHING",
  },
  active: {
    bg: "bg-[#E6F3D7]",
    text: "text-[#496A2B]",
    border: "border-[#D1E7B4]",
    starColor: "#88B253",
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
