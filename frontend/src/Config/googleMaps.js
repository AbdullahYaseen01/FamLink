// Shared loader for the Google Maps JavaScript SDK.
//
// The SDK must only ever be injected ONCE per page. Several screens already
// pull it in indirectly through react-google-autocomplete (Places), so this
// loader looks for an existing <script> before adding its own — a second
// include makes Google log "You have included the Google Maps JavaScript API
// multiple times" and can reset map state.

const SDK_SRC_MATCH = "maps.googleapis.com/maps/api/js";

let pending = null;

const scriptHasPlaces = (src = "") =>
  /libraries=places|libraries%3Dplaces/i.test(src);

// The script's own load event is unreliable here: if another component injected
// the SDK before us, that event has already fired and our listener would never
// run. Polling for the global works in every ordering.
const waitForPlaces = (timeoutMs = 15000) =>
  new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const tick = () => {
      if (window.google?.maps?.places) return resolve(window.google.maps);
      if (Date.now() - startedAt > timeoutMs) {
        return reject(new Error("Timed out waiting for the Google Maps Places library"));
      }
      setTimeout(tick, 100);
    };
    tick();
  });

const injectScript = (apiKey) => {
  const script = document.createElement("script");
  script.src =
    `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
    `&libraries=places`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
};

export function loadGoogleMaps(apiKey) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps needs a browser"));
  }
  if (window.google?.maps?.places) return Promise.resolve(window.google.maps);
  if (pending) return pending;

  pending = (async () => {
    const scripts = Array.from(document.querySelectorAll("script")).filter(
      (s) => s.src && s.src.includes(SDK_SRC_MATCH)
    );
    const placesScript = scripts.find((s) => scriptHasPlaces(s.src));

    // Only skip injection when an existing tag already requests the Places lib.
    // A maps-only script (no places) must not block us — we'd poll forever.
    if (!placesScript) {
      if (!apiKey) throw new Error("VITE_GOOGLE_KEY is not set");
      injectScript(apiKey);
    }

    return waitForPlaces();
  })();

  pending.finally(() => {
    pending = null;
  });

  return pending;
}
