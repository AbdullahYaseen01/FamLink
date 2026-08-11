import axios from "axios";
import { BACKEND_API_URL } from "../Config/url";
// Cyclic on paper — the slices in the store import this module — but `store` is
// only read inside the interceptor, which runs long after every module has
// finished evaluating.
import { store } from "../store";

if (!BACKEND_API_URL) {
  console.error(
    "[api] VITE_API_BASE_URL is missing. Set it in Vercel env to your Fly API URL."
  );
}

export const api = axios.create({
  baseURL: BACKEND_API_URL || "https://backend-bitter-shape-3085.fly.dev",
  // Without a timeout a hung request never settles, leaving shared loading
  // flags (e.g. auth.isLoading, which drives the login spinner) stuck on.
  // Keep under typical proxy idle limits so dead Fly machines fail fast.
  timeout: 20000,
});

// Attach the session to every request, taken from the store rather than from
// redux-persist's copy in localStorage.
//
// The persisted copy lags: redux-persist writes "persist:auth" on a timer after
// the reducer runs, so for a beat after login the mirror in storage is still the
// logged-out one. Every request fired in that window — the navbar's referral
// fetch, the dashboard's subscription check, all of them mount-time effects that
// run the instant /dashboard renders — went out with no Authorization header and
// came back 401, and nothing retried them. That's why a nanny's "Upgrade" /
// "Refer a Friend" button stayed missing until the page was reloaded: the CTA
// waits on referral.code, and the only call that sets it had already failed.
// The store is updated synchronously by the login reducer, so there's no window.
api.interceptors.request.use(
  (config) => {
    const accessToken = store.getState()?.auth?.accessToken;

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Normalize transport failures so callers never see a bare TypeError when
// `error.response` is missing (CORS block, dead API, offline).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      error.response = {
        data: {
          message:
            error.code === "ECONNABORTED"
              ? "Server is taking too long to respond. Please try again."
              : "Cannot reach the server. Please try again in a moment.",
        },
        status: 0,
      };
    } else if (error.response.data == null) {
      error.response.data = {
        message: "Something went wrong. Please try again.",
      };
    } else if (typeof error.response.data === "string") {
      error.response.data = { message: error.response.data };
    }
    return Promise.reject(error);
  }
);
