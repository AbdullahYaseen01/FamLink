import axios from "axios";
import { BACKEND_API_URL } from "../Config/url";
// Cyclic on paper — the slices in the store import this module — but `store` is
// only read inside the interceptor, which runs long after every module has
// finished evaluating.
import { store } from "../store";

export const api = axios.create({
  baseURL: BACKEND_API_URL,
  // Without a timeout a hung request never settles, leaving shared loading
  // flags (e.g. auth.isLoading, which drives the login spinner) stuck on.
  timeout: 30000,
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

