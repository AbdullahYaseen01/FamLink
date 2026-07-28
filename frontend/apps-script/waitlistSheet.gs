/**
 * Waitlist sheet web app — the server half of src/Config/waitlistSubmit.js.
 *
 * This file is NOT bundled or deployed by Vite. It is the source of record for
 * the Apps Script bound to the "Famlink Waitlist Sheet" spreadsheet; it lives in
 * the repo so the contract is reviewable and a bad edit in the Apps Script
 * editor can be diffed against something. Paste it into the editor and deploy a
 * NEW VERSION — "Deploy > Manage deployments > edit > New version". Saving alone
 * changes nothing that the /exec URL serves.
 *
 * This is hardening, not a bug fix. The version it replaced already wrote rows
 * and already answered with JSON; a "waitlist not saving" report was chased here
 * first and the script came back clean under test. What it adds is a script lock
 * around the read-then-append, an outermost try that turns a thrown exception
 * into JSON instead of an error page, and by-name column placement. Before
 * editing this file again, re-read the note on debugging below — the same false
 * lead is easy to walk into twice.
 *
 * Debugging note, because curl lies here. `curl -L` re-POSTs to the 302's
 * Location, and script.googleusercontent.com/macros/echo answers a POST with 405
 * and an HTML error page — which looks exactly like a broken doPost while the
 * row lands anyway. A browser's fetch follows that redirect with GET and gets
 * the JSON. To test by hand, capture the Location without -L, then GET it:
 *
 *   LOC=$(curl -sS -D - -o /dev/null -X POST "$URL" --data-urlencode ... \
 *           | grep -i '^location:' | cut -d' ' -f2 | tr -d '\r')
 *   curl -sS "$LOC"
 *
 * The rule worth keeping: every exit path returns json_(). A bare `return`, an
 * uncaught throw, or an `if` that falls through would serve HTML to the browser,
 * and submitWaitlistEntry would read that as a failed write.
 */

// The tab, not the file. Both are called "Famlink Waitlist Sheet" — the
// spreadsheet's own name and one of its three tabs — which is worth renaming one
// day, but not while it is the tab holding the live rows.
const SHEET_NAME = 'Famlink Waitlist Sheet';

// Mirrors SHEET_FIELDS in src/Config/waitlistSubmit.js. Column ORDER here is
// only used to seed the header row on a fresh tab; on an existing tab the live
// header row wins and values are placed by name, so reordering columns in the
// sheet by hand does not corrupt writes.
const HEADERS = [
  'Timestamp',
  'Id',
  'Source',
  'Name',
  'Email',
  'Location',
  'City',
  'Neighborhood',
  'Details',
];

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function sheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
  return sh;
}

/* Live header row, lowercased, name -> 1-based column. Read every request
   rather than cached: someone adding a column in the sheet UI must not need a
   redeploy, and this is one cheap read against a nine-column row. */
function headerMap_(sh) {
  const width = Math.max(sh.getLastColumn(), HEADERS.length);
  const row = sh.getRange(1, 1, 1, width).getValues()[0];
  const map = {};
  row.forEach((name, i) => {
    const key = String(name || '').trim().toLowerCase();
    if (key) map[key] = i + 1;
  });
  return map;
}

/* Has this Id been written already? Scans the Id column only. The client sends
   an Id per submission so a retry after a flaky response replays the same one
   and lands here instead of writing a second row. Returns the 1-based row when
   found so the caller can report it back. */
function findRowById_(sh, cols, id) {
  const col = cols['id'];
  if (!col || !id) return 0;

  const last = sh.getLastRow();
  if (last < 2) return 0;

  const values = sh.getRange(2, col, last - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === id) return i + 2;
  }
  return 0;
}

/* Health check. Hitting the /exec URL in a browser answers with what the script
   believes it is writing to — which tab, how many rows, which headers — because
   the failure mode worth catching early is the script writing correctly to the
   wrong tab, and that is invisible from the client.

   openThisTab is a deep link, not a convenience. The spreadsheet's own URL opens
   on gid=0, which is the empty Sheet1 — so the obvious link shows no records
   while the rows sit one tab over. A "waitlist not saving" report was actually
   this. Follow openThisTab before believing a row is missing. */
function doGet() {
  try {
    const ss = SpreadsheetApp.getActive();
    const sh = sheet_();
    return json_({
      ok: true,
      service: 'famlink-waitlist',
      rows: Math.max(sh.getLastRow() - 1, 0),
      file: ss.getName(),
      url: ss.getUrl(),
      openThisTab: ss.getUrl().replace(/\/edit.*$/, '') + '/edit#gid=' + sh.getSheetId(),
      tabs: ss.getSheets().map(function (s) {
        return {
          name: s.getName(),
          rows: Math.max(s.getLastRow() - 1, 0),
          gid: s.getSheetId(),
        };
      }),
      writingTo: sh.getName(),
      // The header row as it actually reads, not headerMap_'s lowercased keys —
      // this is here to be eyeballed against SHEET_FIELDS in waitlistSubmit.js,
      // and a case difference is worth seeing rather than normalising away.
      headers: sh
        .getRange(1, 1, 1, Math.max(sh.getLastColumn(), HEADERS.length))
        .getValues()[0]
        .filter(function (name) {
          return String(name || '').trim() !== '';
        }),
    });
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  }
}

function doPost(e) {
  // One outermost try. An exception escaping doPost is the exact failure this
  // file exists to fix, so nothing below is allowed to throw past here.
  try {
    // Form-urlencoded is the normal path — it is a CORS "simple request", so the
    // browser skips the preflight an Apps Script web app cannot answer. JSON is
    // accepted too for curl and for anything posting server-side.
    let p = (e && e.parameter) || {};
    if ((!p.action || !p.Id) && e && e.postData && e.postData.contents) {
      try {
        const parsed = JSON.parse(e.postData.contents);
        if (parsed && typeof parsed === 'object') p = Object.assign({}, parsed, p);
      } catch (ignored) {
        // Not JSON. e.parameter is still authoritative.
      }
    }

    const action = String(p.action || 'create');
    if (action !== 'create') {
      return json_({ ok: false, error: 'Unknown action: ' + action });
    }

    if (!String(p.Email || '').trim() && !String(p.Name || '').trim()) {
      return json_({ ok: false, error: 'Need at least a Name or an Email.' });
    }

    // Serialise the read-then-append. Two submissions landing together would
    // otherwise both miss the dedupe scan and both append.
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(20000);
    } catch (ignored) {
      return json_({ ok: false, error: 'Sheet busy, retry.' });
    }

    try {
      const sh = sheet_();
      const cols = headerMap_(sh);
      const id = String(p.Id || '').trim();

      const existing = findRowById_(sh, cols, id);
      if (existing) {
        return json_({ ok: true, id: id, row: existing, duplicate: true });
      }

      // Place each value under its live column, so a field the sheet has no
      // header for is dropped rather than shifting every later column left.
      const width = Math.max(sh.getLastColumn(), HEADERS.length);
      const row = new Array(width).fill('');
      Object.keys(p).forEach((key) => {
        if (key === 'action') return;
        const col = cols[key.trim().toLowerCase()];
        if (col) row[col - 1] = p[key];
      });

      // A client that forgot the timestamp still gets one.
      const tsCol = cols['timestamp'];
      if (tsCol && !row[tsCol - 1]) row[tsCol - 1] = new Date().toISOString();

      sh.appendRow(row);

      return json_({ ok: true, id: id, row: sh.getLastRow() });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  }
}
