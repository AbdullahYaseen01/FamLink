import express from "express";

import User from "../../Schema/user.js";
import { adminOnly, parsePaging, pagingMeta } from "../../Services/utils/adminAuth.js";
import { logAdminAction } from "../../Services/utils/adminAudit.js";
import {
  SHEET_KEYS,
  fetchSheet,
  filterRows,
  sortRows,
  sheetsConfigured,
  clearSheetCache,
  toCsv,
  findEmailColumn,
  normalizeEmail,
  ACCOUNT_FIELD,
} from "../../Services/utils/sheetReader.js";

const router = express.Router();
router.use(adminOnly);

// The Google Sheets the public forms still write to, shown in the console.
//
// Read-only, by construction: the reader deployment behind this has no write
// path at all (frontend/apps-script/sheetReader.gs). The forms' own scripts are
// untouched, which matters because eighteen files on the public site post to
// one of them and its source isn't in this repo.

const SHEET_META = {
  waitlist: {
    label: "Waitlist sheet",
    description:
      "Everyone who joined the waitlist through the website — the standalone waitlist page, " +
      "the family match form, and both caregiver questionnaires.",
  },
  forms: {
    label: "Form responses",
    description:
      "Submissions from the match and questionnaire forms, including people who started " +
      "onboarding but never finished creating an account.",
  },
};

const resolveKey = (raw) => (SHEET_KEYS.includes(String(raw)) ? String(raw) : null);

// A configuration problem is not a server error — it is a setup step nobody has
// done yet. 200 with `configured: false` lets the screen say so calmly instead
// of rendering a red failure over a feature that was never switched on.
const notConfigured = (res, key) =>
  res.status(200).json({
    configured: false,
    data: [],
    pagination: pagingMeta(0, { page: 1, limit: 50, skip: 0 }),
    meta: { key, ...SHEET_META[key], headers: [], file: "", tab: "", fetchedAt: null },
    message:
      "Google Sheets reading isn't set up yet. The reader script needs deploying and " +
      "GOOGLE_SHEET_READER_URL / GOOGLE_SHEET_READER_TOKEN adding to the backend environment.",
  });

/* ═══════════════════════════ THE ACCOUNT JOIN ═════════════════════════════ */

// Who filled in the form but never created an account.
//
// ────────────────────────────────────────────────────────────────────────────
// These sheets are the top of the funnel: somebody answered the onboarding
// questions on the public site, which writes a row here, and only afterwards
// (if at all) went on to register. The gap between the two is the most
// actionable list on the platform — people who showed real intent and then
// stopped — and until now it was invisible, because the sheet knows nothing
// about the database and the database knows nothing about the sheet.
//
// The join is the email address and can only be the email address: a sheet row
// carries no user id, and names are neither unique nor spelled the same twice.
//
// TWO THINGS THIS CANNOT SEE, both worth knowing before acting on the list:
//
//   1. Someone who registered with a DIFFERENT email than they put in the form
//      reads as "never signed up". Nothing in either record links them.
//   2. A deleted account has had its email overwritten (see admin/users delete,
//      which rewrites it to deleted+<id>@famlink.invalid). Someone who joined
//      and was later removed therefore also reads as "never signed up".
//
// Both err the same way — toward over-reporting the gap — which is the safer
// direction for a list whose purpose is "consider following these people up".
// ────────────────────────────────────────────────────────────────────────────

// Attach account state to every row, in place. Returns the email column used,
// or null when the sheet has none — in which case no join happened and the
// console hides the filter rather than offering one that silently matches
// nothing.
const annotateAccounts = async (rows, headers) => {
  const emailColumn = findEmailColumn(headers);
  if (!emailColumn) return null;

  const emails = [
    ...new Set(rows.map((row) => normalizeEmail(row[emailColumn])).filter(Boolean)),
  ];
  if (!emails.length) {
    for (const row of rows) row[ACCOUNT_FIELD] = false;
    return emailColumn;
  }

  // One query, bounded by the sheet's own size.
  //
  // `collation strength 2` makes the comparison case-insensitive on BOTH sides.
  // Stored emails are saved as typed rather than normalised, so a plain $in
  // would miss the accounts whose address has a capital in it and report those
  // people as never having signed up — the exact error this screen exists to
  // avoid making. It costs the index on `email` (a collation mismatch can't use
  // it), which is an acceptable trade at this size and behind the sheet's own
  // 60-second cache.
  const accounts = await User.find({ email: { $in: emails } })
    .collation({ locale: "en", strength: 2 })
    .select("email status createdAt type")
    .lean();

  const byEmail = new Map(accounts.map((u) => [normalizeEmail(u.email), u]));

  for (const row of rows) {
    const account = byEmail.get(normalizeEmail(row[emailColumn]));
    row[ACCOUNT_FIELD] = Boolean(account);
    row.__accountStatus = account?.status || null;
    row.__accountCreatedAt = account?.createdAt || null;
  }

  return emailColumn;
};

// Totals across the WHOLE sheet, not the current page. "412 of 1,200 never
// signed up" is the number worth showing; the same figure scoped to 25 visible
// rows would be noise that changes every time you page.
const accountTotals = (rows) => {
  let joined = 0;
  let never = 0;
  for (const row of rows) {
    if (row[ACCOUNT_FIELD] === true) joined += 1;
    else if (row[ACCOUNT_FIELD] === false) never += 1;
  }
  return { joined, neverSignedUp: never };
};

/* ═══════════════════════════════════ LIST ═════════════════════════════════ */

// GET /admin/sheets/:key?search=&column=&value=&page=&limit=&refresh=1
router.get("/:key", async (req, res) => {
  const key = resolveKey(req.params.key);
  if (!key) return res.status(404).json({ message: "Unknown sheet" });

  if (!sheetsConfigured()) return notConfigured(res, key);

  try {
    const paging = parsePaging(req.query);
    const sheet = await fetchSheet(key, { force: req.query.refresh === "1" });

    // Annotate before filtering, because `signup` filters on the annotation —
    // and count before filtering too, so the headline totals describe the sheet
    // rather than whatever the admin has currently narrowed it to.
    const emailColumn = await annotateAccounts(sheet.rows, sheet.headers);
    const totals = emailColumn ? accountTotals(sheet.rows) : null;

    const filtered = filterRows(sheet.rows, {
      search: req.query.search,
      column: req.query.column,
      value: req.query.value,
      signup: emailColumn ? req.query.signup : "",
    });
    const ordered = sortRows(filtered, sheet.headers);
    const page = ordered.slice(paging.skip, paging.skip + paging.limit);

    return res.status(200).json({
      configured: true,
      data: page,
      pagination: pagingMeta(ordered.length, paging),
      meta: {
        key,
        ...SHEET_META[key],
        headers: sheet.headers,
        file: sheet.file,
        tab: sheet.tab,
        tabs: sheet.tabs,
        fetchedAt: sheet.fetchedAt,
        totalRows: sheet.total,
        // Null when the sheet has no email column: there is nothing to join on,
        // so the console hides the filter instead of offering one that can only
        // ever return nothing.
        emailColumn,
        accountTotals: totals,
        // Set when the sheet is longer than the reader's row cap, so the
        // console can say the totals are a floor rather than quietly under-
        // reporting a spreadsheet that outgrew it.
        truncated: sheet.truncated,
      },
    });
  } catch (error) {
    console.error(`admin/sheets ${key} failed:`, error.message);
    return res.status(502).json({
      message: error.message || "Could not read the sheet.",
      code: error.code || undefined,
    });
  }
});

/* ══════════════════════════════════ EXPORT ════════════════════════════════ */

// GET /admin/sheets/:key/export?search=&column=&value=
//
// Exports what the filters currently select, not the whole sheet — an admin who
// filtered to one city and clicked export means that city.
router.get("/:key/export", async (req, res) => {
  const key = resolveKey(req.params.key);
  if (!key) return res.status(404).json({ message: "Unknown sheet" });

  if (!sheetsConfigured()) {
    return res.status(400).json({ message: "Google Sheets reading isn't set up yet." });
  }

  try {
    const sheet = await fetchSheet(key);
    const emailColumn = await annotateAccounts(sheet.rows, sheet.headers);

    const filtered = filterRows(sheet.rows, {
      search: req.query.search,
      column: req.query.column,
      value: req.query.value,
      signup: emailColumn ? req.query.signup : "",
    });
    const ordered = sortRows(filtered, sheet.headers);

    // Exporting personal data off the platform is worth a record of who did it.
    await logAdminAction({
      req,
      action: "export.sheet",
      targetType: "sheet",
      reason: `Exported ${ordered.length} rows from the ${SHEET_META[key].label}`,
      metadata: {
        key,
        rows: ordered.length,
        search: req.query.search || null,
        signup: req.query.signup || null,
      },
    });

    // The account column is appended when the join was possible.
    //
    // Filtering to "never signed up" and exporting produces a file that is
    // otherwise indistinguishable from any other export — the same columns, no
    // trace of what it was narrowed to. Someone opening that file a week later
    // has no way to know it is a follow-up list rather than the whole sheet.
    const headers = emailColumn ? [...sheet.headers, "Created an account"] : sheet.headers;
    const exportRows = emailColumn
      ? ordered.map((row) => ({
          ...row,
          "Created an account": row[ACCOUNT_FIELD] ? "Yes" : "No",
        }))
      : ordered;

    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${key}-${stamp}.csv"`);
    return res.status(200).send(toCsv(headers, exportRows));
  } catch (error) {
    console.error(`admin/sheets ${key} export failed:`, error.message);
    return res.status(502).json({ message: error.message || "Could not export the sheet." });
  }
});

/* ═════════════════════════════════ REFRESH ════════════════════════════════ */

// POST /admin/sheets/:key/refresh — drop the cache so the next read is live.
router.post("/:key/refresh", async (req, res) => {
  const key = resolveKey(req.params.key);
  if (!key) return res.status(404).json({ message: "Unknown sheet" });

  clearSheetCache(key);
  return res.status(200).json({ message: "Refreshed. The next load reads the sheet directly." });
});

export default router;
