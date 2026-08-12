import { NavLink, Outlet, useLocation, useNavigate, matchPath } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "./Components/Navbars/navbar";
import Navbar1 from "./Components/Navbars/navbar1";
import Footer from "./NewComponents/Footer/Footer";
import { api } from "./Config/api";
import { refreshTokenThunk, logout } from "./Components/Redux/authSlice";
import Feedback from "./NewComponents/Feedback";
import { captureReferralFromUrl } from "./Config/referral";
import { captureSharedProfileFromUrl } from "./Config/sharedProfileRef";

// ─── Route Config ────────────────────────────────────────────────────────────

const ROUTES = {
  withHeaderAndFooter: [
    "/yourBusiness", "/forFamilies", "/jobSeekers", "/families",
    "/nannShare", "/services", "/", "/terms-and-conditions",
    "/pricing", "/profile/:id", "/share", "/resources", "/resources/:slug"
  ],
  withHeaderOnly: [
    "/joinNow", "/login", "/forgetPass", "/hire", "/job", "/tutor", "/waitlist",
    "/tutorJob", "/swim", "/communitySign", "/swimJob", "/specialCaregiver",
    "/specialCaregiverJob", "/houseManager", "/houseManagerJob", "/music", "/caregiver/nannyshare",
    "/musicJob", "/sportCoach", "/sportCoachJob", "/find-nanny-share", "/find-nanny-share/family/:id", "/caregiver/nanny-share/looking-for-another-family/:id", "/caregiver/nanny-share/looking-for-nanny-share-job/:id",
  ],
  withNothing: [
    "/events", "/nanny-share/:city", "/nanny-share/profile/:id",
    // Resource Center pages render their own chrome (hub: header + footer;
    // download: a print-friendly toolbar), so the layout adds nothing.
    "/nanny-share-resources", "/nanny-share-resources/:slug",
    // The family questionnaire brings its own top bar and progress rail, so a
    // site header here would stack two bars. Its five per-share-type siblings
    // used to be listed under withHeaderOnly; share type is now Q1 inside the
    // questionnaire, so only this one path remains.
    "/find-nanny-share/nanny-share-questionnaire/:id",
  ],
  // Standalone pages reached from a link in one of our emails. The recipient may
  // have no session and no other way into the site, so they get the full chrome
  // — none of these four render a header or footer of their own.
  emailLanding: ["/unsubscribe", "/feedback", "/contact", "/reset-password"],
  // A member's shared nanny share. Same chrome as the email landings and for
  // the same reason — the reader followed a link out of a Facebook group and
  // has no other way around the site — but listed separately because it isn't
  // one of ours, it's one a member sent.
  sharedProfile: ["/share/:token"],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Matches a pathname against a route pattern that may contain :param segments */
function matchesRoute(pathname, routePattern) {
  return matchPath({ path: routePattern, end: true }, pathname);
}

function matchesAnyRoute(pathname, routeList) {
  return routeList.some((route) => matchesRoute(pathname, route));
}

/** Extracts a user's additionalInfo value by key */
function getAdditionalInfo(user, key) {
  return user?.additionalInfo?.find((info) => info.key === key)?.value;
}

/** Checks whether the nanny's profile has all required fields filled */
function checkIsProfileComplete(user) {
  const availability = getAdditionalInfo(user, "avaiForWorking")?.option;
  const language = getAdditionalInfo(user, "language")?.option;
  const start = getAdditionalInfo(user, "availability")?.option;
  const workExp = getAdditionalInfo(user, "experience")?.option;
  const specificDays = getAdditionalInfo(user, "specificDaysAndTime");
  const salaryExp = getAdditionalInfo(user, "salaryExp");
  const ageGroupsExp = getAdditionalInfo(user, "ageGroupsExp")?.option;

  return (
    availability &&
    Array.isArray(language) && language.length > 0 &&
    start &&
    workExp &&
    specificDays && Object.keys(specificDays).length > 0 &&
    salaryExp && Object.values(salaryExp).every((val) => val && val !== "") &&
    Array.isArray(ageGroupsExp) && ageGroupsExp.length > 0
  );
}

// ─── Token Refresh Hook ──────────────────────────────────────────────────────

function useTokenRefresh() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { accessTokenExpiry } = useSelector((state) => state.auth);

  // useNavigate() hands back a new function on every location change, so an
  // effect that captured it (or pathname) re-runs on every navigation. The 401
  // interceptor below must not do that — see the comment where it's registered —
  // so the redirect reads both through a ref that each render keeps current.
  const routeRef = useRef({ navigate, pathname });
  routeRef.current = { navigate, pathname };

  const handleAuthFailure = async () => {
    const { navigate: go, pathname: from } = routeRef.current;
    await dispatch(logout());
    go("/login", { state: { from }, replace: true });
  };

  const tryRefreshToken = async () => {
    try {
      const { status } = await dispatch(refreshTokenThunk()).unwrap();
      if (status !== 200) await handleAuthFailure();
      return status === 200;
    } catch {
      await handleAuthFailure();
      return false;
    }
  };

  // On mount: refresh token immediately if already expired
  useEffect(() => {
    const currentTime = Math.floor(Date.now() / 1000);
    const isExpired = accessTokenExpiry && currentTime >= accessTokenExpiry;
    if (isExpired) tryRefreshToken();
  }, [accessTokenExpiry]);

  // Schedule a proactive refresh 60 seconds before expiry
  useEffect(() => {
    if (!accessTokenExpiry) return;

    const currentTime = Math.floor(Date.now() / 1000);
    const secondsUntilExpiry = accessTokenExpiry - currentTime;
    const shouldSchedule = secondsUntilExpiry > 60;

    if (!shouldSchedule) return;

    const refreshAfterMs = (secondsUntilExpiry - 60) * 1000;
    const timeout = setTimeout(async () => {
      const success = await tryRefreshToken();
      // Re-scheduling is handled by the accessTokenExpiry change after a successful refresh
    }, refreshAfterMs);

    return () => clearTimeout(timeout);
  }, [accessTokenExpiry]);

  // Intercept 401 API responses and attempt a token refresh.
  //
  // Registered once for the session, not per navigation. Keyed on pathname (as
  // it was), the cleanup ejected the interceptor on every route change and the
  // replacement only went back on in PageLayout's effect — which React runs
  // *after* the effects of everything below it. So during the commit that mounts
  // a page, its children's own mount-time requests had no 401 handling at all:
  // one unauthorized response there was final, with no refresh and no retry.
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        const is401 = error.response?.status === 401;
        const notRetried = !originalRequest._retry;

        if (is401 && notRetried) {
          originalRequest._retry = true;
          const success = await tryRefreshToken();
          if (success) return api(originalRequest);
        }

        return Promise.reject(error);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ─── Layout Sections ─────────────────────────────────────────────────────────

function FamilyLayout({ pathname }) {
  const isPostingJob = pathname.startsWith("/dashboard/post-a-nannyShare");
  const isMessaging = pathname.startsWith("/dashboard/message");
  const isCommunity = pathname.startsWith("/dashboard/community");
  const isPricing = pathname.startsWith("/dashboard/pricing");
  const isDetails = pathname.startsWith("/dashboard/nannyShareView/");
  const isCompletProfilePage = pathname.startsWith("/dashboard/complete-profile");
  const isShareManagement = pathname.startsWith("/dashboard/share-management");

  const noFeedback = isPostingJob || isMessaging || isCommunity || isDetails || isCompletProfilePage;
  const noNavbar = isCompletProfilePage;
  const noPadding = isPostingJob || isPricing || isMessaging || isShareManagement;

  if (isMessaging) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <Navbar1 nanny={true} />
        <div className="flex-1 min-h-0 overflow-hidden bg-white">
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <>
      {noNavbar ? <Header join={true} /> : <Navbar1 nanny={true} />}
      <div className={noPadding ? "bg-white" : "py-8"}>
        <Outlet />
      </div>
      {/* Footer intentionally omitted for all /dashboard routes */}
      {!noFeedback && <Feedback />}
    </>
  );
}

function NannyLayout({ pathname, isProfileComplete }) {
  const isMessaging = pathname.startsWith("/nanny/message");
  const isCommunity = pathname.startsWith("/nanny/community");
  const isPricing = pathname.startsWith("/nanny/pricing");
  const isSetting = pathname.startsWith("/nanny/setting") || pathname.startsWith("/family/setting");
  const isEditPage = pathname === "/nanny/edit";
  const isDetailsPage = pathname.startsWith("/nanny/details/");
  const isCompletProfilePage = pathname.startsWith("/nanny/complete-profile");

  const noPadding = isPricing || isMessaging || isSetting;
  const noNavbar = isCompletProfilePage;
  const noFooter = isMessaging || isCompletProfilePage;
  const noFeedback = isMessaging || isCommunity || isDetailsPage || isCompletProfilePage;

  const showIncompleteProfileBanner =
    !isCommunity && !isDetailsPage && !isEditPage && !isPricing && !isMessaging && !isProfileComplete;

  if (isMessaging) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <Navbar1 nanny={true} />
        <div className="flex-1 min-h-0 overflow-hidden bg-white">
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <>
      {noNavbar ? <Header join={true} /> : <Navbar1 nanny={true} />}
      <div className={noPadding ? "py-0" : "py-8"}>
        {showIncompleteProfileBanner && (
          <NavLink to="/nanny/edit">
            {/* Profile setup banner — add UI here if needed */}
          </NavLink>
        )}
        <Outlet />
      </div>
      {!noFooter && <Footer />}
      {!noFeedback && <Feedback />}
    </>
  );
}

// ─── Main Layout ─────────────────────────────────────────────────────────────

export default function PageLayout() {
  const { pathname, search } = useLocation();
  const { user } = useSelector((s) => s.auth);

  useTokenRefresh();

  // Park any ?ref= code from a caregiver's referral link. It sits here rather
  // than on a single landing page because a shared link can point at anything —
  // the home page, a city page, a job form — and the signup that redeems it
  // usually happens several screens later.
  //
  // The ?share= token from a shared profile's CTA rides along the same way, and
  // for the same reason: the signup that redeems it is several screens past the
  // page that carried it.
  useEffect(() => {
    captureReferralFromUrl(search);
    captureSharedProfileFromUrl(search);
  }, [search]);

  const isProfileComplete = checkIsProfileComplete(user);

  if (matchesAnyRoute(pathname, ROUTES.withNothing)) {
    return <Outlet />;
  }

  if (matchesAnyRoute(pathname, ROUTES.withHeaderAndFooter)) {
    return (
      <>
        {pathname.startsWith("/terms-and-conditions") && <Header join={true} />}
        <Outlet />
        <Footer />
      </>
    );
  }

  if (matchesAnyRoute(pathname, ROUTES.withHeaderOnly)) {
    return (
      <>
        {!pathname.startsWith("/login") && <Header join={true} />}
        <Outlet />
      </>
    );
  }

  if (matchesAnyRoute(pathname, [...ROUTES.emailLanding, ...ROUTES.sharedProfile])) {
    return (
      <>
        <Header join={true} />
        <Outlet />
        <Footer />
      </>
    );
  }

  if (pathname.startsWith("/dashboard")) {
    return <FamilyLayout pathname={pathname} />;
  }

  if (pathname.startsWith("/nanny")) {
    return <NannyLayout pathname={pathname} isProfileComplete={isProfileComplete} />;
  }

  // A path that App.jsx routes but no list above claims used to land here and get
  // `null` back. PageLayout is the parent route element, so returning null means
  // its <Outlet /> never mounts: the page comes up blank on a 200, with nothing in
  // the console to explain it. That is how /unsubscribe, /feedback, /contact and
  // /reset-password — every landing page our emails link to — shipped broken.
  // Degrade to the standard chrome instead, so the next missed registration is a
  // page with a header rather than a white screen.
  return (
    <>
      <Header join={true} />
      <Outlet />
      <Footer />
    </>
  );
}