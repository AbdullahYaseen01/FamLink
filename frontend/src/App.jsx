import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Navigate,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import PageLayout from "./pageLayout";
import NannyShare from "./NewComponents/NannyShare/NannyShare";
import JoinNow from "./Components/JoinNow/joinNow";
import Job from "./Components/JoinNow/Job";
import ForgetPass from "./Components/Forget-Password/forgetPass";
import ResetPassword from "./Components/Forget-Password/resetPassword";
import Unsubscribe from "./Components/Preferences/unsubscribe";
import FeedbackPage from "./Components/Feedback/feedbackPage";
import Contact from "./Components/Contact/contact";
import TutorJob from "./Components/subComponents/Job/MultipleStep/tutor";
import SwimJob from "./Components/subComponents/Job/MultipleStep/swim";
import SpecialCaregiverJob from "./Components/subComponents/Job/MultipleStep/specializedCare";
import HouseManagerJob from "./Components/subComponents/Job/MultipleStep/houseMang";
import MusicJob from "./Components/subComponents/Job/MultipleStep/music";
import SportCoachJob from "./Components/subComponents/Job/MultipleStep/sportCoach";

import Family from "./Components/LoginAsFamily/family";
import ProfileNanny from "./Components/LoginAsFamily/profileNanny";
import EditProfile from "./Components/LoginAsFamily/editProfile";
import Setting from "./Components/LoginAsFamily/setting";
import Message from "./Components/LoginAsFamily/Message";
import Booking from "./Components/LoginAsFamily/Booking/booking";
import Favorites from "./Components/LoginAsFamily/favorite";

import Nanny from "./Components/LoginAsNanny/nanny";
import EditProfileNanny from "./Components/LoginAsNanny/editProfile";
import JobDescription from "./Components/LoginAsNanny/jobDescription";
import MessageNanny from "./Components/LoginAsNanny/Message";
import BookingNanny from "./Components/LoginAsNanny/booking";
import FavoritesNanny from "./Components/LoginAsNanny/favourite";
import TipsAndArticlesNanny from "./Components/LoginAsNanny/tipsAndArticles";
import Application from "./Components/LoginAsNanny/application";
// import WithdrawEarning from "./Components/LoginAsNanny/withdrawEarning";
import Login from "./Components/Login/login";
import NannyShareComponent from "./Components/LoginAsFamily/nannyShare";
import NewHireForm from "./Components/JoinNow/NewHire";
import PostAJob from "./Components/LoginAsFamily/PostAJob/postAJob";
import JobListing from "./Components/LoginAsFamily/JobListing/job-listing";
import JobListingView from "./Components/LoginAsFamily/JobListing/job-listing-view";
import FamilyOnboardingWizard from "./NewComponents/NannyShare/FamilyWizard/FamilyOnboardingWizard";
import { useNotifications } from "./Config/useNotification";
import NewHome from "./NewComponents/Home/Home";
import TermsAndConditions from "./Components/Authority/Terms&Condition";
import Caregivers from "./NewComponents/Caregivers/Caregivers";
import ResourcesPage from "./NewComponents/Home/ResourcesPage";
import ArticlePage from "./NewComponents/Home/ArticlePage";
import Events from "./NewComponents/Events";
import NannyShareDetails from "./NewComponents/NannyShare/Profile/NannyShareDetails";
import EditNannyShare from "./NewComponents/NannyShare/Profile/EditNannyShare";
import ProfileFamily from "./NewComponents/Home/FamilyProfile/ProfileFamily";
import NannyShareMatchForm from "./NewComponents/NannyShareMatchForm";
import NannyShareCityPage from "./NewComponents/NannyShare/Search/NannyShareCityPage";
import ViewProfileDetails from "./NewComponents/NannyShare/Search/ViewProfile";
import ChooseNannyShare from "./NewComponents/Caregivers/ChooseNannyShare";
import { JobQuestionnaire } from "./NewComponents/Caregivers/NannyShareOnboarding/LookingForJob/JobQuestionnaire";
import { ShareQuestionnaire } from "./NewComponents/Caregivers/NannyShareOnboarding/LookingForFamily/ShareQuestionnaire";
import NannyShareOnboardingWizard from "./NewComponents/NannyShare/NannyShareWizard/NannyShareOnboardingWizard";
import NannyFamilyOnboardingWizard from "./NewComponents/NannyShare/NannyFamilyWizard/NannyFamilyOnboardingWizard";
import NannyOnboardingChooser, {
  readNannyOnboardingFlow,
} from "./NewComponents/NannyShare/NannyOnboardingChooser";
import MatchRequests from "./NewComponents/MatchRequests";
import { FamilyOnboarding } from "./NewComponents/NannyShare/Onboarding/FamilyOnboarding";
import WaitlistForm from "./NewComponents/Waitlist";
import NannyProfileView from "./NewComponents/NannyShareProfile/NannyProfileView";
import FamilyProfileView from "./NewComponents/NannyShareProfile/FamilyProfileView";
import ResourceCenter from "./NewComponents/ResourceCenter/ResourceCenter";
import ResourceDownloadPage from "./NewComponents/ResourceCenter/ResourceDownloadPage";
import SharedProfilePage from "./NewComponents/ShareProfile/SharedProfilePage";

// The family questionnaire used to fan out to a per-share-type URL
// (.../nanny-share-questionnaire/fulltime-care/:id and five siblings). Share type
// is now Q1 inside the questionnaire itself, so those paths collapse into one.
// Emails already in inboxes and any bookmarks still point at the old shape, so
// redirect rather than 404 — dropping the type is safe because Q1 asks for it.
const LegacyQuestionnaireRedirect = () => {
  const { id } = useParams();
  const { search } = useLocation();
  return (
    <Navigate
      to={`/find-nanny-share/nanny-share-questionnaire/${id}${search}`}
      replace
    />
  );
};

// Same collapse for the signed-in paths, which carry ?recordId= rather than a
// path segment — so the query string has to survive the redirect.
const LegacyDashboardShareRedirect = () => {
  const { search } = useLocation();
  return <Navigate to={`/dashboard/post-a-nannyShare${search}`} replace />;
};

const NANNY_FAMILY_GOALS = [
  "Nanny adding a share",
  "I already work with a family and want to add a share",
];

const OnboardingCompleteProfile = () => {
  const { user } = useSelector((s) => s.auth);
  const [searchParams] = useSearchParams();
  const recordId = user?.sheetId;
  if (user?.type === "Parents") {
    return <FamilyOnboardingWizard recordId={recordId} />;
  }

  const flow = searchParams.get("flow") || readNannyOnboardingFlow();
  const familyGoal = NANNY_FAMILY_GOALS.includes(user?.goal);

  if (flow === "family" || (familyGoal && flow !== "looking")) {
    return <NannyFamilyOnboardingWizard />;
  }
  if (flow === "looking" || user?.goal) {
    return <NannyShareOnboardingWizard />;
  }
  return <NannyOnboardingChooser />;
};

// Catch-all landing for any path the router doesn't match. A logged-in member
// goes to their dashboard; a logged-out visitor goes home — EXCEPT when they
// were trying to reach a /dashboard/* page (e.g. a "View Request" button in an
// email opened without a session). Those get bounced to login with the intended
// path preserved as ?redirect=, so signing in drops them exactly where the email
// meant to send them instead of stranding them on the home page.
function AuthFallback({ isAuthed }) {
  const { pathname, search } = useLocation();
  if (isAuthed) return <Navigate to="/dashboard" replace />;
  if (pathname.startsWith("/dashboard")) {
    const target = encodeURIComponent(pathname + search);
    return <Navigate to={`/login?redirect=${target}`} replace />;
  }
  return <Navigate to="/" replace />;
}

function App() {
  const { user } = useSelector((s) => s.auth); // Fetching user from Redux state
  const [loading, setLoading] = useState(true);
  useNotifications({ userId: user._id });
  useEffect(() => {
    // Simulate an async operation to fetch user data
    if (user) {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return <div>Loading...</div>; // Show loading spinner or fallback while user loads
  }

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route element={<PageLayout />}>
        {/* Public Blog / Resources Routes */}
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/resources/:slug" element={<ArticlePage />} />

        {/* Nanny Share Resource Center (lead-magnet hub + printable downloads).
            Public and outside the logged-out block so it resolves for everyone,
            and reachable from the link in the resource-download email. */}
        <Route path="/nanny-share-resources" element={<ResourceCenter />} />
        <Route path="/nanny-share-resources/:slug" element={<ResourceDownloadPage />} />

        {/* A member's shared nanny share — the privacy-safe public page behind
            the "Share Profile" button. Outside the logged-out block because it
            gets pasted into group chats where members and strangers both click
            it: a signed-in reader gets a CTA straight into the real profile,
            and without this they'd hit the "*" fallback and bounce to their
            dashboard instead. */}
        <Route path="/share/:token" element={<SharedProfilePage />} />

        {/* Programmatic city/neighborhood landing pages (with the coverage map).
            Outside the logged-out block so members can open them too — e.g. from
            the footer's "Find Nanny Shares" links — instead of being bounced to
            /dashboard by the "*" fallback. */}
        <Route path="/nanny-share/:city" element={<NannyShareCityPage />} />

        {/* Landing pages for buttons in our emails. Registered outside the
            logged-out block so they resolve whether or not there's a session —
            an unsubscribe or support link has to work for anyone. */}
        <Route path="/unsubscribe" element={<Unsubscribe />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/contact" element={<Contact />} />
        {/* Also linked from automated emails, so they must resolve with or
            without a session. The footer Terms link ships in every email (all of
            which go to logged-in users), and the "Start Browsing / Browse
            Families" CTA in 03/13/16 targets logged-in members — if these lived
            only in the logged-out block below they'd fall through to the "*"
            redirect and bounce the recipient to /dashboard. */}
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/find-nanny-share" element={<NannyShareMatchForm />} />

        {/* Outside the logged-out block for the same reason /nanny-share/:city
            is: the San Francisco page is the one city page that still pitches
            the waitlist (NannyShare/Search/Hero.jsx), and members can open it.
            Registered logged-out only, its "Join Waitlist" button fell through
            to the "*" fallback and bounced signed-in visitors to /dashboard.
            The form reads no auth state, so it renders the same for both. */}
        <Route path="/waitlist" element={<WaitlistForm />} />

        {/* The two marketing pages the public header and footer link to. They
            sit outside the logged-out block so a signed-in member can browse
            back out to them and return: registered only for logged-out
            visitors, "/" fell through to the "*" fallback below, which bounced
            members straight back to /dashboard. That redirect is what made the
            dashboard a one-way door — the logo, the footer links and a typed
            URL all led back to where you already were. Neither page reads auth
            state, so they render the same for a member as for a visitor.
            /login and /joinNow deliberately stay logged-out only — a member
            landing there SHOULD be sent to their dashboard. */}
        <Route path="/" element={<NannyShare />} />
        <Route path="/jobSeekers" element={<Caregivers />} />

        {/* Common routes */}
        {!user?.type && (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/forgetPass" element={<ForgetPass />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/nanny-share/profile/:id" element={<ViewProfileDetails />} />
            <Route path="/events" element={<Events />} />
            <Route path="/families" element={<NewHome />} />
            <Route path="/joinNow" element={<JoinNow />} />
            <Route path="/caregiver/nannyshare" element={<ChooseNannyShare />} />
            <Route path="/hire" element={<NewHireForm />} />
            <Route path="/job" element={<Job />} />
            <Route path="/find-nanny-share/family/:id" element={<FamilyOnboarding />} />
            <Route path="/caregiver/nanny-share/looking-for-nanny-share-job/:id" element={<JobQuestionnaire />} />
            <Route path="/caregiver/nanny-share/looking-for-another-family/:id" element={<ShareQuestionnaire />} />
            <Route path="/find-nanny-share/nanny-share-questionnaire/:id" element={<FamilyOnboardingWizard login={false} />} />
            {/* Share type is now Q1 inside the questionnaire, so there is one
                route instead of a per-type fan-out. The redirect keeps any
                already-sent email or bookmark on a type URL working. */}
            <Route path="/find-nanny-share/nanny-share-questionnaire/:shareType/:id" element={<LegacyQuestionnaireRedirect />} />
            <Route path="/tutorJob" element={<TutorJob />} />
            <Route path="/swimJob" element={<SwimJob />} />
            <Route
              path="/specialCaregiverJob"
              element={<SpecialCaregiverJob />}
            />
            <Route path="/houseManagerJob" element={<HouseManagerJob />} />
            <Route path="/musicJob" element={<MusicJob />} />
            <Route path="/sportCoachJob" element={<SportCoachJob />} />
          </>
        )}
        {/* <Route path="/profile/:id" element={<IndividualProfile />} /> */}

        {/* Family-specific routes */}
        {(user?.type === "Parents" || user?.type === "Nanny") && (
          <Route path="/dashboard/*" element={<Nanny />}>
            <Route path="nanny-profile-view/:id" element={<NannyProfileView />} />
            <Route path="family-profile-view/:id" element={<FamilyProfileView />} />
            <Route path="profileNanny/:id" element={<ProfileNanny />} />
            <Route path="profileFamily/:id" element={<ProfileFamily />} />
            <Route path="requests" element={<MatchRequests />} />
            <Route path="post-a-job" element={<PostAJob />} />
            <Route path="complete-profile" element={<OnboardingCompleteProfile />} />
            <Route path="post-a-nannyShare" element={<FamilyOnboardingWizard />} />
            {/* Same collapse as the logged-out routes above: one questionnaire,
                with the old per-type paths redirecting into it. */}
            <Route
              path="post-a-nannyShare/:shareType"
              element={<LegacyDashboardShareRedirect />}
            />
            {/* <Route path="profile" element={<Profile />} /> */}
            <Route path="edit" element={user?.type === "Nanny" ? <EditProfileNanny /> : <EditProfile />} />
            <Route
              path="terms-and-conditions"
              element={<TermsAndConditions />}
            />
            <Route path="setting" element={<Setting />} />
            <Route path="message" element={<Message />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="community" element={<TipsAndArticlesNanny />} />
            <Route path="caregivers" element={<Family />} />
            <Route path="nannyShareView/:id" element={<NannyShareDetails />} />
            <Route path="nannyShareEdit/:id" element={<EditNannyShare />} />
            <Route path="description/:id" element={<JobDescription />} />
            <Route path="jobListing" element={<JobListing />} />
            <Route path="jobListingView/:id" element={<JobListingView />} />
          </Route>
        )}

        {/* Fallback: dashboard for members, home for visitors, and
            login-with-return-URL for logged-out clicks on a /dashboard/* link. */}
        <Route
          path="*"
          element={
            <AuthFallback
              isAuthed={user?.type === "Parents" || user?.type === "Nanny"}
            />
          }
        />
      </Route>,
    ),
  );

  return <RouterProvider router={router} />;
}

export default App;