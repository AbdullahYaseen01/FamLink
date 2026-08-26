import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";

import { viewCurrentUserProfileThunk } from "../../../../Components/Redux/nannyShareSlice";
import { applyPrefill, collectLandingPrefill } from "./fromLanding";

/*
 * Seed the questionnaire from nannyProfile, then the Google Sheet, then the
 * homepage chat. Empty keys only, so a later source cannot clobber an answer
 * already on screen, and step changes never re-apply the seed.
 *
 * A second pass is allowed only when a sheet record id arrives after the first
 * pass ran without one — otherwise a dashboard user whose sheetId hydrates a
 * tick late would skip the Sheet entirely.
 */
export function useLandingPrefill({
  flow,
  sheetRecordId = "",
  loadProfile = true,
  setValues,
}) {
  const dispatch = useDispatch();
  const started = useRef(false);
  const sheetSeen = useRef("");
  const applied = useRef(false);
  const [isPrefilling, setIsPrefilling] = useState(false);

  useEffect(() => {
    const nextSheet = sheetRecordId || "";
    if (started.current && sheetSeen.current === nextSheet) return;
    if (started.current && sheetSeen.current) return;
    if (started.current && !nextSheet) return;

    started.current = true;
    sheetSeen.current = nextSheet;

    let cancelled = false;
    (async () => {
      try {
        setIsPrefilling(true);
        const sources = await collectLandingPrefill({
          flow,
          sheetRecordId: nextSheet,
          fetchProfile: loadProfile
            ? async () => {
                const result = await dispatch(
                  viewCurrentUserProfileThunk(),
                ).unwrap();
                return result?.data?.data ?? null;
              }
            : undefined,
        });
        if (cancelled) return;
        setValues((prev) => applyPrefill(prev, sources));
        applied.current = true;
      } catch {
        /* A missing profile or Sheet must not block the questionnaire. */
      } finally {
        if (!cancelled) setIsPrefilling(false);
      }
    })();

    return () => {
      cancelled = true;
      if (!applied.current) {
        started.current = false;
        sheetSeen.current = "";
      }
    };
  }, [dispatch, flow, loadProfile, setValues, sheetRecordId]);

  return isPrefilling;
}
