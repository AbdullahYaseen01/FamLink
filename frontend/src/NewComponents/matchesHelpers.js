import { getFamilyGoal, getNannyGoal } from "../Config/shareTypeTheme";

export function formatDisplayName(name) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
  if (parts.length === 1) return first;
  return `${first} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
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
