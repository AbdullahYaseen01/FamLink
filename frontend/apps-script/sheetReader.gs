/**
 * Read-only reader for the two Google Sheets the admin console displays.
 *
 * This is a STANDALONE Apps Script — not bound to either spreadsheet — and it
 * only ever reads. That is deliberate:
 *
 *   • The waitlist sheet already has a bound script (waitlistSheet.gs) whose
 *     doPost is the only way waitlist signups get recorded.
 *   • The form-responses sheet has a bound script that eighteen files on the
 *     public site write to, with `create` and `update` actions, and whose
 *     source is not in this repo.
 *
 * Editing either of those to add a read endpoint would put the live signup and
 * questionnaire flows one bad deploy away from breaking, for a feature that
 * only needs to read. A separate deployment cannot affect them at all.
 *
 * ── Setup ─────────────────────────────────────────────────────────────────
 *
 * 1. script.google.com → New project → paste this file.
 * 2. Project Settings → Script Properties → add:
 *
 *      READ_TOKEN         a long random string you invent (see below)
 *      WAITLIST_SHEET_ID  the /d/<THIS PART>/edit of the waitlist spreadsheet
 *      FORMS_SHEET_ID     the same, for the form-responses spreadsheet
 *
 *    Optionally WAITLIST_TAB / FORMS_TAB to pin a specific tab; without them
 *    the reader uses the tab with the most rows, which is the one holding the
 *    data. (The waitlist spreadsheet has three tabs and the obvious one —
 *    gid=0, "Sheet1" — is empty. That has already caused one "waitlist not
 *    saving" false alarm; see the note in waitlistSheet.gs.)
 *
 * 3. Deploy → New deployment → Web app → Execute as: Me →
 *    Who has access: Anyone. Copy the /exec URL.
 * 4. Put the URL and the token in the BACKEND's environment, never the
 *    frontend's:
 *
 *      GOOGLE_SHEET_READER_URL=https://script.google.com/macros/s/…/exec
 *      GOOGLE_SHEET_READER_TOKEN=<the same READ_TOKEN>
 *
 * ── Why the token ─────────────────────────────────────────────────────────
 *
 * "Anyone" is the only access level that works without a Google sign-in, and
 * these rows are names, email addresses and neighbourhoods. Without a shared
 * secret, anyone who learned this URL could download the entire waitlist.
 *
 * The token therefore lives in the backend's environment and the admin browser
 * never sees it: the console asks our API, and the API asks this script. That
 * is also why the write URLs being in the public bundle is survivable — they
 * accept writes, not reads.
 *
 * Generate one with:  openssl rand -hex 32
 */

/* Which spreadsheet each `sheet=` value maps to. */
const SHEETS = {
  waitlist: { idProp: 'WAITLIST_SHEET_ID', tabProp: 'WAITLIST_TAB' },
  forms: { idProp: 'FORMS_SHEET_ID', tabProp: 'FORMS_TAB' },
};

/* Rows returned in one request. The sheets are small — hundreds of rows, not
   millions — but an unbounded read would eventually hit the 6-minute execution
   limit and start failing silently. */
const MAX_ROWS = 5000;

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function prop_(name) {
  return PropertiesService.getScriptProperties().getProperty(name) || '';
}

/**
 * Constant-time-ish string compare.
 *
 * Apps Script has no crypto.timingSafeEqual, and `a === b` on a secret leaks a
 * little through timing. Comparing every character regardless of an early
 * mismatch removes the obvious signal. Length is still observable, which is
 * fine for a token whose length is not secret.
 */
function tokenMatches_(given, expected) {
  if (!expected) return false;
  if (String(given).length !== String(expected).length) return false;
  var diff = 0;
  for (var i = 0; i < expected.length; i++) {
    diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * The tab holding the data.
 *
 * Falls back to whichever tab has the most rows rather than to the first one.
 * The first tab is routinely an empty "Sheet1" left over from creating the
 * file, and returning it would show an empty table over a full spreadsheet —
 * indistinguishable from "nobody has signed up".
 */
function pickSheet_(ss, preferredName) {
  if (preferredName) {
    var named = ss.getSheetByName(preferredName);
    if (named) return named;
  }

  var sheets = ss.getSheets();
  var best = sheets[0];
  for (var i = 1; i < sheets.length; i++) {
    if (sheets[i].getLastRow() > best.getLastRow()) best = sheets[i];
  }
  return best;
}

function readSheet_(key) {
  var conf = SHEETS[key];
  var id = prop_(conf.idProp);
  if (!id) {
    return { ok: false, error: 'Script property ' + conf.idProp + ' is not set.' };
  }

  var ss = SpreadsheetApp.openById(id);
  var sh = pickSheet_(ss, prop_(conf.tabProp));

  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();

  if (lastRow < 1 || lastCol < 1) {
    return { ok: true, headers: [], rows: [], total: 0, tab: sh.getName(), file: ss.getName() };
  }

  var headers = sh
    .getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map(function (h) {
      return String(h == null ? '' : h).trim();
    });

  var dataRows = Math.max(lastRow - 1, 0);
  var take = Math.min(dataRows, MAX_ROWS);
  var values = take > 0 ? sh.getRange(2, 1, take, lastCol).getValues() : [];

  var rows = values.map(function (row) {
    var obj = {};
    for (var i = 0; i < headers.length; i++) {
      if (!headers[i]) continue;
      var cell = row[i];
      // Dates come back as Date objects and JSON.stringify would render them in
      // whatever the script's timezone is. ISO keeps them unambiguous and lets
      // the console format them however it likes.
      if (cell instanceof Date) cell = cell.toISOString();
      else if (cell == null) cell = '';
      else cell = String(cell);
      obj[headers[i]] = cell;
    }
    return obj;
  });

  return {
    ok: true,
    file: ss.getName(),
    tab: sh.getName(),
    headers: headers.filter(function (h) {
      return h !== '';
    }),
    rows: rows,
    total: dataRows,
    truncated: dataRows > take,
    tabs: ss.getSheets().map(function (s) {
      return { name: s.getName(), rows: Math.max(s.getLastRow() - 1, 0) };
    }),
  };
}

function doGet(e) {
  // One outermost try: an exception escaping doGet serves an HTML error page,
  // which the backend would have to guess at rather than report.
  try {
    var p = (e && e.parameter) || {};

    if (!tokenMatches_(String(p.token || ''), prop_('READ_TOKEN'))) {
      return json_({ ok: false, error: 'Unauthorized' });
    }

    var key = String(p.sheet || '').toLowerCase();
    if (!SHEETS[key]) {
      return json_({
        ok: false,
        error: 'Unknown sheet: ' + key + '. Expected one of: ' + Object.keys(SHEETS).join(', '),
      });
    }

    return json_(readSheet_(key));
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  }
}

/**
 * Reading is a GET; this exists only so a mistaken POST gets a JSON answer
 * rather than an HTML error page that looks like a broken deployment.
 */
function doPost() {
  return json_({ ok: false, error: 'This deployment is read-only. Use GET.' });
}
