import { getFamilyGoal, getNannyGoal } from "../Config/shareTypeTheme";

export function formatDisplayName(name) {
  if (!name) return "";
  const trimmed = name.trim();
  if (/family/i.test(trimmed)) return trimmed;
  const parts = trimmed.split(/\s+/);
  const first = parts[0] || "";
  const last = parts[1] ? ` ${parts[1][0].toUpperCase()}.` : "";
  return `${first}${last}`;
}

export function profileTypeLabel(type) {
  if (type === "Parents") return "Family";
  if (type === "Nanny") return "Nanny";
  return "Member";
}

export function userTypeLabel({ type, hasNanny, hasFamily }) {
  const role = profileTypeLabel(type);
  const goal =
    type === "Parents" ? getFamilyGoal(hasNanny) : type === "Nanny" ? getNannyGoal(hasFamily) : "";
  return goal ? `${role} · ${goal}` : role;
}
