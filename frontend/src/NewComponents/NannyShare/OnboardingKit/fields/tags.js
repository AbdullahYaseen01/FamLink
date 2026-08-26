/*
 * Optional short-text answers that are a list, not a paragraph: allergies,
 * schools, extra certifications, skills. The control commits a chip on comma
 * or Enter; these helpers are how those chips become a stored string (or back).
 */

export function splitTags(value) {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) return value.flatMap((item) => splitTags(item));
  return String(value)
    .split(/[,|\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinTags(value) {
  return splitTags(value).join(", ");
}

export function addTags(current, incoming) {
  const next = [...splitTags(current)];
  const seen = new Set(next.map((tag) => tag.toLowerCase()));
  splitTags(incoming).forEach((tag) => {
    const key = tag.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    next.push(tag);
  });
  return next;
}
