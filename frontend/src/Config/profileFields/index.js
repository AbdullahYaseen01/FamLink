/*
 * The shared field manifest: one description of every onboarding question, read
 * by both View Profiles and both Edit Profiles.
 *
 * Before this, four files each kept their own idea of what the wizards ask. The
 * view pages hand-maintained `groupedDetails` arrays with their own labels; the
 * edit forms imported OPTIONS but retyped the questions; and the drift between
 * them is what the profile-consistency work exists to remove. A question that
 * changes in a wizard config now changes on all four surfaces at once, because
 * none of them holds a second copy.
 *
 * Nothing here reads the database or React — it is plain data, so any surface
 * can import it without pulling in a wizard.
 */
export { CONTROL, isRevealed } from "./controls";
export {
  LEGACY_ANSWER_ALIASES,
  LEGACY_SHARE_TYPE_ALIASES,
  canonicalise,
  optionsWithStored,
  resolveHasNanny,
  toArray,
  toCareType,
  toSingleton,
  toSingletonArray,
} from "./normalise";

export { FAMILY_FIELDS, FAMILY_LEGACY_FIELDS } from "./familyFields";
export { NANNY_JOB_FIELDS, NANNY_JOB_LEGACY_FIELDS } from "./nannyJobFields";
export { NANNY_FAMILY_FIELDS, NANNY_FAMILY_LEGACY_FIELDS } from "./nannyFamilyFields";

import { FAMILY_FIELDS, FAMILY_LEGACY_FIELDS } from "./familyFields";
import { NANNY_JOB_FIELDS, NANNY_JOB_LEGACY_FIELDS } from "./nannyJobFields";
import { NANNY_FAMILY_FIELDS, NANNY_FAMILY_LEGACY_FIELDS } from "./nannyFamilyFields";

/*
 * Which manifest describes this profile.
 *
 * Keyed off `hasFamily`, the schema-required Boolean the card badge, the browse
 * filter and the shared theme already agree on — not the free-text `goal`
 * string, which has two vocabularies in circulation. A family profile is
 * anything that is not a nanny, so the caller passes the user type it already
 * has rather than this module guessing from profile shape.
 */
export function fieldsFor({ isNanny, hasFamily } = {}) {
  if (!isNanny) return FAMILY_FIELDS;
  return hasFamily ? NANNY_FAMILY_FIELDS : NANNY_JOB_FIELDS;
}

export function legacyFieldsFor({ isNanny, hasFamily } = {}) {
  if (!isNanny) return FAMILY_LEGACY_FIELDS;
  return hasFamily ? NANNY_FAMILY_LEGACY_FIELDS : NANNY_JOB_LEGACY_FIELDS;
}

/*
 * The manifest grouped by wizard step, in step order, for a surface that renders
 * one card per group.
 *
 * Built from the entries rather than from STEPS so a group with no questions
 * cannot appear as an empty card, and so the order inside a group is the order
 * the wizard asks in.
 */
export function groupFields(fields) {
  const groups = [];
  for (const f of fields) {
    let group = groups.find((g) => g.title === f.group);
    if (!group) {
      group = { title: f.group, step: f.step, items: [] };
      groups.push(group);
    }
    group.items.push(f);
  }
  return groups.sort((a, b) => a.step - b.step);
}

/*
 * Every nannyProfile key a flow writes, including the extra keys a single
 * question fans out to and the keys behind its conditional reveals.
 *
 * This is what makes "a Flow 1 nanny should not carry empty Flow 2 keys" a
 * computation rather than a hand-maintained list: the save payload can ask for
 * the active flow's keys and exclude the other's, instead of iterating one map
 * over both.
 */
export function dbKeysOf(fields) {
  const keys = new Set();
  for (const f of fields) {
    keys.add(f.dbKey);
    f.alsoWrites.forEach((k) => keys.add(k));
    if (f.specifyKey) keys.add(f.specifyKey);
    if (f.reveal) {
      keys.add(f.reveal.dbKey);
      if (f.reveal.specifyKey) keys.add(f.reveal.specifyKey);
    }
  }
  return keys;
}

/* Look an entry up by the key it writes — the shape most read-side code has. */
export function byDbKey(fields) {
  return new Map(fields.map((f) => [f.dbKey, f]));
}
