import { formatSharedRate, formatSoloRate, formatStartDate } from "../helpFunction";

/*
 * Turning a stored answer into something a profile row can show.
 *
 * One copy, shared by FamilyProfileView and NannyProfileView. It used to be two,
 * and they had already diverged in ways that mattered: only the family one
 * carried the `keyMapping` fallback that resolves a legacy key to a profile
 * field, and only the nanny one knew how to read `{option: [...]}` or pull a
 * `.label` off an array of objects — so the family page printed `[object Object]`
 * for exactly the shapes the nanny page rendered correctly.
 *
 * This module is the union of the two, and it is deliberately a faithful union:
 * every branch below exists because some stored shape reaches it. The behaviour
 * is unchanged for both pages on well-formed data. Where the two disagreed on a
 * malformed shape, the version that produced something readable wins — printing
 * `[object Object]` to a family reading a profile is not a behaviour worth
 * preserving byte for byte.
 *
 * Kept separate from Config/profileFields/index.js on purpose: that barrel is
 * plain data with no React in it, so a script or a test can import the manifest
 * without pulling in a renderer. This file returns JSX.
 */

/*
 * additionalInfo reaches us in two shapes. Most profiles carry a plain array of
 * { key, value } objects, but sheet-imported caregivers carry a single
 * JSON-stringified array instead: ["[{\"key\":\"currentSchedule\",…}]"]. Flatten
 * both into one { key, value } list so a `.find(by key)` resolves either way —
 * otherwise those answers silently render "No details provided" even though the
 * data is right there.
 */
export function flatAdditionalInfo(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const item of raw) {
    if (item && typeof item === "object" && "key" in item) {
      out.push(item);
    } else if (typeof item === "string") {
      try {
        const parsed = JSON.parse(item);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        for (const p of list) if (p && typeof p === "object" && "key" in p) out.push(p);
      } catch {
        /* non-JSON string — nothing to extract */
      }
    }
  }
  return out;
}

/*
 * Where to look for a key's answer, in order.
 *
 * The two pages had different lookup chains and BOTH are preserved here, because
 * their alias maps mean opposite things:
 *
 *   profileAliases  a key the page asks for -> the nannyProfile field holding it
 *                   (the family page: "hosting" -> "hostingPreference")
 *   infoAliases     a key the page asks for -> the legacy additionalInfo key
 *                   (the nanny page: "careExperience" -> "experience")
 *
 * A page passes whichever it has; the steps it does not use are no-ops, so each
 * page resolves exactly as it did before.
 */
export function makeGetFallbackValue({
  profile = {},
  additionalInfo = [],
  profileAliases = {},
  infoAliases = {},
} = {}) {
  const present = (v) => v !== undefined && v !== null && v !== "";

  return function getFallbackValue(key) {
    // 1. The profile field itself.
    if (present(profile?.[key])) return profile[key];

    // 2. additionalInfo under the same key.
    const direct = additionalInfo.find((info) => info.key === key);
    if (direct) return direct.value;

    // 3-4. The profile field, then additionalInfo, under a legacy profile alias.
    const profileAlias = profileAliases[key];
    if (profileAlias) {
      if (present(profile?.[profileAlias])) return profile[profileAlias];
      const aliased = additionalInfo.find((info) => info.key === profileAlias);
      if (aliased) return aliased.value;
    }

    // 5. additionalInfo under a legacy intake key.
    const infoAlias = infoAliases[key];
    if (infoAlias) {
      const aliased = additionalInfo.find((info) => info.key === infoAlias);
      if (aliased) return aliased.value;
    }

    return null;
  };
}

/*
 * Unwrap a value that has been JSON-stringified on its way into Mongo — possibly
 * more than once, because a FormData round trip can stringify an already
 * stringified array.
 *
 * Three rounds, not a loop to exhaustion: a bio that happens to start with "["
 * must not be chewed on forever, and three covers every shape actually stored.
 * The single-quote fallback afterwards is for values that look like an array but
 * are not valid JSON — "['Dog(s)', 'Cat(s)']" — which is what the retired
 * Apps Script round trip produced.
 */
function unwrap(value) {
  let parsed = value;
  let rounds = 0;
  while (
    typeof parsed === "string" &&
    (parsed.startsWith("{") || parsed.startsWith("[")) &&
    rounds < 3
  ) {
    try {
      const next = JSON.parse(parsed);
      if (typeof next === "string" && next === parsed) break;
      parsed = next;
    } catch {
      break;
    }
    rounds++;
  }

  if (typeof parsed === "string" && parsed.startsWith("[") && parsed.endsWith("]")) {
    return parsed.replace(/[[\]']/g, "").split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
  }
  return parsed;
}

/* Join, then re-split on commas and trim — so "a,b" inside one array entry comes
   out spaced the same as two entries would. Both pages did this; it is why a
   value that is already a comma-joined string renders identically to the array
   it came from. */
const cleanJoin = (parts) =>
  parts
    .join(", ")
    .split(",")
    .map((s) => s.trim())
    .join(", ");

/* An object entry contributes its own label; anything else is stringified and
   stripped of the brackets and quotes a sloppier round trip left behind. */
const entryText = (v) => {
  if (v && typeof v === "object" && v.label) return v.label;
  if (v && typeof v === "object" && v.value) return v.value;
  return String(v).replace(/[[\]"]/g, "");
};

const dayChip = (day, timeStr) => (
  <span
    key={day}
    className="inline-flex items-center gap-1.5 bg-[#E9F8FF] text-[#001243] px-3 py-1 rounded-full text-xs Livvic-Medium border border-[#AEC4FF]"
  >
    {day}
    {timeStr}
  </span>
);

/* The seven-day object -> day chips with their time ranges. */
function renderSchedule(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const days = Object.keys(value).filter((day) => value[day]?.checked);
  if (days.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {days.map((day) => {
        const { start, end } = value[day];
        let timeStr = "";
        if (start && end) {
          const s = new Date(start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const e = new Date(end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          timeStr = ` (${s} - ${e})`;
        }
        return dayChip(day, timeStr);
      })}
    </div>
  );
}

/* childrenAges / openToChildrenAges — [{label,value,unit}], or any of the looser
   shapes older documents hold. A bare number means years. */
function renderAges(value) {
  let list = value;
  if (!Array.isArray(list)) {
    try {
      list = JSON.parse(list);
    } catch {
      list = [list];
    }
  }
  if (!Array.isArray(list)) return String(list);

  return list
    .map((age) => {
      if (typeof age === "object" && age !== null && age.label) return age.label;
      const clean = String(age).trim().replace(/[[\]"']/g, "");
      if (!clean) return null;
      const lower = clean.toLowerCase();
      if (lower.includes("year") || lower.includes("yr") || lower.includes("month") || lower.includes("mo")) {
        return clean;
      }
      return `${clean} years`;
    })
    .filter(Boolean)
    .join(", ");
}

/* The per-child rates the retired flow collected. Kept per decision 7. */
function renderSalaryExp(value) {
  let obj = value;
  if (typeof value === "string") {
    try {
      obj = JSON.parse(value);
    } catch {
      /* leave it as the string; the guard below rejects it */
    }
  }
  if (!obj || typeof obj !== "object") return null;

  const parts = [];
  if (obj.firstChild) parts.push(`1st Child: $${obj.firstChild}/hr`);
  if (obj.secChild) parts.push(`2nd Child: $${obj.secChild}/hr`);
  if (obj.thirdChild) parts.push(`3rd Child: $${obj.thirdChild}/hr`);
  if (obj.fourthChild) parts.push(`4th Child: $${obj.fourthChild}/hr`);
  if (obj.fiveOrMoreChild) parts.push(`5+ Children: $${obj.fiveOrMoreChild}/hr`);
  return parts.length > 0 ? parts.join(" | ") : null;
}

/*
 * A family's budget: what the whole share costs and what each family pays.
 *
 * Stored as a parsed object, that object stringified, or a bare display label —
 * three shapes, because three questionnaires have written this field. Routing
 * everything through the shared formatters is what keeps a legacy
 * "$20 - $undefined per hour" record from printing here verbatim.
 */
function renderBudgetPair(share, solo) {
  if (!share && !solo) return null;
  return (
    <>
      {solo ? solo.replace("~", "") : null}
      {solo && share && <br />}
      {share ? share.replace("~", "") : null}
    </>
  );
}

/*
 * @param key   the key the page asked for, not necessarily a schema field —
 *              "budgetDisplay" is synthetic and pulls from several.
 * @param val   whatever getFallbackValue returned.
 * @param ctx   getFallbackValue, so the branches that need a second field can
 *              reach it; and specifyFor, which the family page uses to append an
 *              "Other" answer inline. Task 1.3 gives specify text its own line
 *              and that argument goes away.
 */
export function formatProfileValue(key, val, ctx = {}) {
  const { getFallbackValue = () => null, specifyFor = () => null } = ctx;

  /* hasNanny is the one Boolean with an answer rather than a Yes/No — it is
     asked as a sentence — so it must reach the boolean branch below. */
  if (val === false && key !== "hasNanny") return "No";

  /* budgetDisplay holds nothing of its own; it is assembled from other fields. */
  const isEmpty =
    val === null ||
    val === undefined ||
    val === "N A" ||
    val === "null" ||
    (typeof val === "string" && val.trim() === "");
  if (key !== "budgetDisplay" && isEmpty) return null;

  const parsed = unwrap(val);

  if (key === "specificDays" || key === "specificDaysAndTime") {
    const rendered = renderSchedule(parsed);
    if (rendered !== undefined) return rendered;
    /* Not an object — fall through to the generic handling below. */
  } else if (key === "childrenAges" || key === "openToChildrenAges") {
    return renderAges(parsed);
  } else if (key === "salaryExp") {
    return renderSalaryExp(parsed);
  } else if (key === "nannyShareType") {
    if (typeof parsed === "string" && parsed.toLowerCase() === "other") {
      return getFallbackValue("otherShareTypeSpecify") || "Other";
    }
    return parsed;
  } else if (key === "hourlyBudget") {
    /* Deliberately the RAW value: the shared rate formatters understand all
       three stored shapes and unwrap() would have flattened an object. */
    const share = formatSharedRate(val);
    const solo = formatSoloRate(val);
    if (!share && !solo) {
      const specify = getFallbackValue("hourlyBudgetSpecify");
      return specify ? `$${specify}/hr` : null;
    }
    return renderBudgetPair(share, solo);
  } else if (key === "budgetDisplay") {
    /* A nanny already with a family stored a family-shaped hourlyBudget; one
       looking for a position stored sharedRate/soloRate. Try both. */
    const budgetObj = getFallbackValue("hourlyBudget");
    if (budgetObj) {
      const share = formatSharedRate(budgetObj);
      const solo = formatSoloRate(budgetObj);
      if (!share && !solo) {
        const specify = getFallbackValue("hourlyBudgetSpecify");
        return specify ? `$${specify}/hr` : null;
      }
      return renderBudgetPair(share, solo);
    }

    const sRate = getFallbackValue("sharedRate");
    const soloRate = getFallbackValue("soloRate");
    if (sRate || soloRate) {
      return (
        <>
          {sRate ? `$${sRate}/hr` : null}
          {sRate && soloRate && <br />}
          {soloRate ? `$${soloRate}/hr per family` : null}
        </>
      );
    }
    return null;
  } else if (key === "hosting" || key === "hostingPreference" || key === "whereCare") {
    /* The retired control's wording for the same answer. */
    if (typeof parsed === "string" && parsed.toLowerCase() === "your home") return "My home";
    return parsed;
  } else if (key === "nannyshareStart" || key === "startAvailability") {
    /* Stored as an ISO date from the picker, so the row used to print the raw
       "2026-07-20T23:00:00.000Z". Non-date answers ("Flexible", "ASAP") pass
       through the formatter untouched. */
    return formatStartDate(parsed);
  }

  let res;
  if (typeof parsed === "object" && parsed !== null) {
    let arr;
    if (Array.isArray(parsed)) {
      arr = parsed;
    } else if (parsed.option) {
      arr = Array.isArray(parsed.option) ? parsed.option : [parsed.option];
    } else {
      return JSON.stringify(parsed);
    }

    if (key === "additionalDetails") {
      arr = arr.filter(
        (s) =>
          typeof s === "string" &&
          !s.toLowerCase().includes("first aid") &&
          !s.toLowerCase().includes("cpr"),
      );
    }

    /* An empty group falls through to the specify handling rather than
       returning early — the family page rescues an "Other" answer whose own
       group came back empty, and losing that would lose the only text there is. */
    res = cleanJoin(arr.map(entryText));
  } else if (typeof parsed === "boolean") {
    if (key === "hasNanny") {
      return parsed ? "Yes - we already have a nanny" : "No - we are looking for a nanny";
    }
    return parsed ? "Yes" : "No";
  } else if (key === "additionalDetails" && typeof parsed === "string") {
    const filtered = parsed
      .split(",")
      .map((s) => s.trim())
      .filter((s) => !s.toLowerCase().includes("first aid") && !s.toLowerCase().includes("cpr"));
    return filtered.length > 0 ? filtered.join(", ") : null;
  } else {
    res = cleanJoin([String(parsed).replace(/[[\]"]/g, "")]);
  }

  /*
   * The family page appends an "Other" answer to the end of the same sentence.
   * It is passed in rather than assumed, because the nanny page never did this —
   * and Task 1.3 replaces it everywhere with a labelled line of its own, which
   * is the only way a reader can tell a selection from free text.
   */
  const specifyKey = specifyFor(key);
  if (specifyKey) {
    const specifyVal = getFallbackValue(specifyKey);
    if (specifyVal) res = res ? `${res}, ${specifyVal}` : specifyVal;
  }

  return res;
}
