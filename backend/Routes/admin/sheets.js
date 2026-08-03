import express from "express";

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

/* ═══════════════════════════════════ LIST ═════════════════════════════════ */

// GET /admin/sheets/:key?search=&column=&value=&page=&limit=&refresh=1
router.get("/:key", async (req, res) => {
  const key = resolveKey(req.params.key);
  if (!key) return res.status(404).json({ message: "Unknown sheet" });

  if (!sheetsConfigured()) return notConfigured(res, key);

  try {
    const paging = parsePaging(req.query);
    const sheet = await fetchSheet(key, { force: req.query.refresh === "1" });

    const filtered = filterRows(sheet.rows, {
      search: req.query.search,
      column: req.query.column,
      value: req.query.value,
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
    const filtered = filterRows(sheet.rows, {
      search: req.query.search,
      column: req.query.column,
      value: req.query.value,
    });
    const ordered = sortRows(filtered, sheet.headers);

    // Exporting personal data off the platform is worth a record of who did it.
    await logAdminAction({
      req,
      action: "export.sheet",
      targetType: "sheet",
      reason: `Exported ${ordered.length} rows from the ${SHEET_META[key].label}`,
      metadata: { key, rows: ordered.length, search: req.query.search || null },
    });

    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${key}-${stamp}.csv"`);
    return res.status(200).send(toCsv(sheet.headers, ordered));
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
