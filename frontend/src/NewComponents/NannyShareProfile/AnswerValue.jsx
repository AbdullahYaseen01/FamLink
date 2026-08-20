import { formatSharedRate, formatSoloRate, formatStartDate } from "../../Config/helpFunction";
import { CONTROL, canonicalise, isRevealed, LEGACY_SHARE_TYPE_ALIASES, toArray } from "../../Config/profileFields";

/*
 * One answer, rendered as the format it was asked in.
 *
 * Both profile views used to print every answer as a single line of text, with
 * chips for exactly one key. That cannot represent honestly what the wizards now
 * ask: a five-option multi-select came out as one comma-joined sentence, and an
 * "Other" free-text answer was appended into the same sentence — so a reader
 * could not tell which parts were choices the person made from a list and which
 * part they typed themselves. A dual shared/solo rate collapsed to one string,
 * and a per-child age list lost its months/years unit.
 *
 * So this component takes a manifest entry and renders by its `control`, reusing
 * the onboarding kit's own visual language: the selected-pill palette for chips,
 * the age-row card for children's ages, the 11px uppercase section label for the
 * two halves of a rate. A family reading a profile should recognise the shapes
 * from the questionnaire they filled in.
 *
 * Colocated with its two consumers rather than in Config/, which is plain data —
 * Config/profileFields/index.js must stay importable without React.
 *
 * Returns null when there is nothing to show, INCLUDING after considering the
 * "Other" text and any revealed field, so the caller's own "No details provided"
 * placeholder stays the single owner of the empty state.
 */

/* ── Pieces of the onboarding visual language ──────────────────────────────── */

/*
 * A read-only answer chip. Deliberately the wizard's SELECTED pill — every value
 * shown here is something the person chose — minus the interaction: the same
 * #AEC4FF border and navy dot, on the lighter #EEF3FF fill so a row of them does
 * not read as a row of buttons.
 */
function Chip({ children }) {
  return (
    <span className="inline-flex items-center gap-[7px] rounded-full border-[1.5px] border-[#AEC4FF] bg-[#EEF3FF] px-3.5 py-1.5 text-[13px] Livvic-SemiBold text-[#001243]">
      <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-[#001243] shrink-0" />
      {children}
    </span>
  );
}

/*
 * A stored entry's display text.
 *
 * Multi-selects are not always arrays of strings: Flow 1's "what ages do you
 * prefer to work with" stores [{label, min, max}] because the matcher compares
 * those numbers, and Flow 2 stores point ranges in the same field. Handing one
 * of those objects to React is a crash, not a bad render, so the unwrapping
 * happens here rather than at each call site.
 */
const chipText = (entry) => {
  if (entry && typeof entry === "object") return entry.label ?? entry.value ?? "";
  return entry;
};

function Chips({ items }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <Chip key={`${chipText(item)}-${i}`}>{chipText(item)}</Chip>
      ))}
    </div>
  );
}

/*
 * The day chips, kept byte-identical to what both views already rendered for
 * `specificDaysAndTime` — it was the one key that already had a format, and
 * changing it would be a regression dressed as a redesign.
 */
function DayChips({ schedule }) {
  const days = Object.keys(schedule).filter((day) => schedule[day]?.checked);
  if (days.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {days.map((day) => {
        const { start, end } = schedule[day];
        let timeStr = "";
        if (start && end) {
          const s = new Date(start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const e = new Date(end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          timeStr = ` (${s} - ${e})`;
        }
        return (
          <span
            key={day}
            className="inline-flex items-center gap-1.5 bg-[#E9F8FF] text-[#001243] px-3 py-1 rounded-full text-xs Livvic-Medium border border-[#AEC4FF]"
          >
            {day}
            {timeStr}
          </span>
        );
      })}
    </div>
  );
}

/* A secondary line under the main answer: free text the person typed, or a field
   one of their choices revealed. The label is what tells a reader this was typed
   rather than picked. */
function SubLine({ label, children }) {
  return (
    <div className="mt-2">
      <p className="text-[11px] Livvic-Bold uppercase tracking-[0.8px] text-[#6B7280] mb-1">
        {label}
      </p>
      <div className="text-[14px] Livvic-Medium text-[#334155] whitespace-pre-line">{children}</div>
    </div>
  );
}

/* The wizard's own age row, read-only: the Child N label and the age with its
   unit, which the stored `label` already carries ("3 yrs", "18 months"). */
function AgeRows({ ages }) {
  return (
    <div className="flex flex-col gap-2 mt-2">
      {ages.map((age, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-[12px] border-[1.5px] border-[#E8ECF4] bg-[#F4F6FB] px-3 py-2 w-fit max-w-full"
        >
          <span className="min-w-[52px] text-[12px] Livvic-Bold text-[#6B7280]">
            Child {i + 1}
          </span>
          <span className="text-[13px] Livvic-SemiBold text-[#001243]">
            {typeof age === "object" && age !== null ? age.label : String(age)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* RateGroupField's section label, so the two halves of a rate read here the way
   they were asked. */
function RatePart({ label, children }) {
  return (
    <div>
      <p className="text-[11px] Livvic-Bold uppercase tracking-[0.8px] text-[#6B7280] mb-1">
        {label}
      </p>
      <div className="text-[14px] Livvic-Bold text-[#001243]">{children}</div>
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */

const isBlank = (v) =>
  v === null ||
  v === undefined ||
  v === "" ||
  v === "null" ||
  v === "N A" ||
  (typeof v === "string" && v.trim() === "") ||
  (Array.isArray(v) && v.length === 0);

/* A rate token ("30-35") back to the label the wizard showed ("$30–$35/hr"). */
const rateLabel = (options = [], token) =>
  options.find((o) => o.value === token)?.label || token;

/* A "(optional)" suffix is placeholder copy, not part of a label. */
const asLabel = (text) => String(text).replace(/\s*\(optional\)\s*$/i, "").trim();

/* ── The component ─────────────────────────────────────────────────────────── */

/*
 * `empty` is what renders when the question has no answer at all — including
 * after considering the "Other" text and any revealed field, which is why the
 * caller cannot make that call itself. One owner of the empty state, so a row
 * can never show both a value and a placeholder.
 */
export default function AnswerValue({ field, value, resolve = () => null, empty = null }) {
  return renderAnswer({ field, value, resolve }) ?? empty;
}

function renderAnswer({ field, value, resolve }) {
  const { control, options, specifyKey, reveal, storedAs, sharedLabel, soloLabel } = field;

  /* The free text an "Other" pill revealed. Labelled "Other" because that is the
     option the person actually selected — no wording is invented here. */
  const specifyText = specifyKey ? resolve(specifyKey) : null;
  const specify = isBlank(specifyText) ? null : (
    <SubLine label="Other">{specifyText}</SubLine>
  );

  /* A field one of the answers revealed — the school name behind "Yes", the pet
     types behind "Yes". Its label is the wizard's placeholder, which is the only
     user-visible description that input has. */
  let revealed = null;
  if (reveal && isRevealed(value, reveal.when)) {
    const revealValue = resolve(reveal.dbKey);
    if (!isBlank(revealValue)) {
      const revealSpecify = reveal.specifyKey ? resolve(reveal.specifyKey) : null;
      revealed = (
        <SubLine label={asLabel(reveal.label || reveal.dbKey)}>
          {reveal.isMulti ? (
            <Chips items={toArray(canonicalise(revealValue, reveal.options || [])) || []} />
          ) : (
            revealValue
          )}
          {!isBlank(revealSpecify) && (
            <p className="mt-1 text-[13px] Livvic-Medium text-[#475569]">Other: {revealSpecify}</p>
          )}
        </SubLine>
      );
    }
  }

  const withExtras = (main) =>
    main === null && !specify && !revealed ? null : (
      <>
        {main}
        {specify}
        {revealed}
      </>
    );

  /* Empty is still worth rendering when a companion line has something — an
     "Other"-only answer, or a revealed field whose parent reads "Yes". */
  if (isBlank(value) && control !== CONTROL.RATE_GROUP && control !== CONTROL.BUDGET_PILLS) {
    return withExtras(null);
  }

  switch (control) {
    case CONTROL.MULTI:
    case CONTROL.MULTI_OTHER: {
      const items = toArray(canonicalise(value, options || [])) || [];
      const shown = items.filter((i) => !isBlank(i));
      return withExtras(shown.length ? <Chips items={shown} /> : null);
    }

    case CONTROL.DAY_SCHEDULE: {
      if (!value || typeof value !== "object" || Array.isArray(value)) return withExtras(null);
      return withExtras(<DayChips schedule={value} />);
    }

    case CONTROL.COUNT_WITH_AGES: {
      const ages = toArray(resolve(field.alsoWrites?.[0])) || [];
      const count = Number(value) || 0;
      return withExtras(
        <>
          <span className="text-[15px] Livvic-SemiBold text-[#1E293B]">
            {count === 1 ? "1 child" : `${count} children`}
          </span>
          {ages.length > 0 && <AgeRows ages={ages} />}
        </>,
      );
    }

    case CONTROL.RATE_GROUP: {
      const shared = value;
      const solo = resolve("soloRate");
      if (isBlank(shared) && isBlank(solo)) return withExtras(null);
      return withExtras(
        <div className="flex flex-col gap-3">
          {!isBlank(shared) && (
            <RatePart label={sharedLabel || "Shared-care rate"}>
              {rateLabel(options?.shared, shared)}
            </RatePart>
          )}
          {!isBlank(solo) && (
            <RatePart label={soloLabel || "Solo-care rate"}>
              {rateLabel(options?.solo, solo)}
            </RatePart>
          )}
        </div>,
      );
    }

    case CONTROL.BUDGET_PILLS: {
      /* Stored as the parsed {min,max,minShare,maxShare}, that object
         stringified, or a bare display label — the shared formatters understand
         all three, which is what keeps a legacy "$20 - $undefined per hour"
         record from printing verbatim. */
      const total = formatSoloRate(value);
      const perFamily = formatSharedRate(value);
      if (!total && !perFamily) {
        const specifyRate = resolve("hourlyBudgetSpecify");
        return withExtras(isBlank(specifyRate) ? null : `$${specifyRate}/hr`);
      }
      return withExtras(
        <div className="flex flex-col gap-3">
          {total && <RatePart label="Total hourly">{total.replace("~", "")}</RatePart>}
          {perFamily && (
            /* The formatter's own string ends "per family"; the label already
               says so, so it is not said twice. */
            <RatePart label="Each family pays">
              {perFamily.replace("~", "").replace(/\s*per family\s*$/i, "")}
            </RatePart>
          )}
        </div>,
      );
    }

    case CONTROL.DATE:
      return withExtras(
        <span className="text-[15px] Livvic-SemiBold text-[#1E293B]">
          {formatStartDate(value)}
        </span>,
      );

    case CONTROL.PHOTO:
      return withExtras(
        <img
          src={value}
          alt=""
          className="w-16 h-16 rounded-[12px] object-cover border border-[#E8ECF4]"
        />,
      );

    case CONTROL.TEXTAREA:
      return withExtras(
        <span className="text-[15px] Livvic-Medium text-[#1E293B] whitespace-pre-line">
          {value}
        </span>,
      );

    case CONTROL.SINGLE:
    case CONTROL.TEXT:
    default: {
      /* Flow 2 asks communication as a single select and stores it as a
         one-element array, because the schema path is [String] (the family
         wizard asks the same question as a multi-select). Unwrap before the
         chip so React never receives ["Text"]. */
      const singleValue =
        storedAs === "singletonArray" && Array.isArray(value) ? value[0] : value;

      /* hasNanny is asked as a sentence and stored as a Boolean. */
      if (storedAs === "boolean" || typeof singleValue === "boolean") {
        const yes = singleValue === true || String(singleValue).toLowerCase() === "true";
        const [yesLabel, noLabel] = options || [];
        return withExtras(
          <span className="text-[15px] Livvic-SemiBold text-[#1E293B]">
            {yes ? yesLabel || "Yes" : noLabel || "No"}
          </span>,
        );
      }

      /*
       * nannyShareType is stored lowercased because it is queried. Match it back
       * to the option the person picked; anything that matches nothing came from
       * "Other", so the text they typed is the answer.
       */
      if (storedAs === "lowercase") {
        const aliased =
          LEGACY_SHARE_TYPE_ALIASES[String(singleValue).trim().toLowerCase()] ??
          singleValue;
        const matched = (options || []).find(
          (o) => o.toLowerCase().trim() === String(aliased).toLowerCase().trim(),
        );
        if (!matched) {
          const typed = specifyKey ? resolve(specifyKey) : null;
          return (
            <span className="text-[15px] Livvic-SemiBold text-[#1E293B]">
              {isBlank(typed) ? singleValue : typed}
            </span>
          );
        }
        return withExtras(
          <span className="text-[15px] Livvic-SemiBold text-[#1E293B]">{matched}</span>,
        );
      }

      /* A single choice is one chip, so a reader can see it came from a list —
         free text is not a chip, because it did not. */
      const text = canonicalise(singleValue, options || []);
      return withExtras(
        control === CONTROL.SINGLE && (options || []).length ? (
          <Chip>{text}</Chip>
        ) : (
          <span className="text-[15px] Livvic-Medium text-[#1E293B]">{text}</span>
        ),
      );
    }
  }
}
