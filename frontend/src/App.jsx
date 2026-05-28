import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useState, lazy, Suspense } from "react";
import PageLayout from "./pageLayout";
import NannyShare from "./NewComponents/NannyShare/NannyShare";
import JoinNow from "./Components/JoinNow/joinNow";
import Job from "./Components/JoinNow/Job";
import ForgetPass from "./Components/Forget-Password/forgetPass";
import TutorJob from "./Components/subComponents/Job/MultipleStep/tutor";
import SwimJob from "./Components/subComponents/Job/MultipleStep/swim";
import SpecialCaregiverJob from "./Components/subComponents/Job/MultipleStep/specializedCare";
import HouseManagerJob from "./Components/subComponents/Job/MultipleStep/houseMang";
import MusicJob from "./Components/subComponents/Job/MultipleStep/music";
import SportCoachJob from "./Components/subComponents/Job/MultipleStep/sportCoach";

import Family from "./Components/LoginAsFamily/family";
import ProfileNanny from "./Components/LoginAsFamily/profileNanny";
import Profile from "./Components/LoginAsFamily/userProfile";
import EditProfile from "./Components/LoginAsFamily/editProfile";
import Setting from "./Components/LoginAsFamily/setting";
import Message from "./Components/LoginAsFamily/Message";
import Booking from "./Components/LoginAsFamily/Booking/booking";
import Favorites from "./Components/LoginAsFamily/favorite";

import Nanny from "./Components/LoginAsNanny/nanny";
import UserProfileNanny from "./Components/LoginAsNanny/userProfile";
import EditProfileNanny from "./Components/LoginAsNanny/editProfile";
import JobDescription from "./Components/LoginAsNanny/jobDescription";
import SettingNanny from "./Components/LoginAsNanny/setting";
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
import { PostANannyShare } from "./Components/LoginAsFamily/PostANannyShare/postANannyShare";
import { useNotifications } from "./Config/useNotification";
import NewHome from "./NewComponents/Home/Home";
import TermsAndConditions from "./Components/Authority/Terms&Condition";
import Caregivers from "./NewComponents/Caregivers/Caregivers";
import Business from "./NewComponents/Businesses/Businesses";
import Events from "./NewComponents/Events";
import { AfterSchoolCare } from "./NewComponents/NannyShare/PostANannyShare/Type/AfterSchoolCare";
import { DropOff } from "./NewComponents/NannyShare/PostANannyShare/Type/DropOff";
import { FullTime } from "./NewComponents/NannyShare/PostANannyShare/Type/FullTime";
import { PartTime } from "./NewComponents/NannyShare/PostANannyShare/Type/PartTime";
import { Seasonal } from "./NewComponents/NannyShare/PostANannyShare/Type/Seasonal";
import NannyShareDetails from "./NewComponents/NannyShare/Profile/NannyShareDetails";
import EditNannyShare from "./NewComponents/NannyShare/Profile/EditNannyShare";
import ProfileFamily from "./NewComponents/Home/FamilyProfile/ProfileFamily";
import NannyShareMatchForm from "./NewComponents/NannyShareMatchForm";
import NannyShareCityPage from "./NewComponents/NannyShare/Search/NannyShareCityPage";
import ViewProfileDetails from "./NewComponents/NannyShare/Search/ViewProfile";
import ChooseNannyShare from "./NewComponents/Caregivers/ChooseNannyShare";
import { JobQuestionnaire } from "./NewComponents/Caregivers/NannyShareOnboarding/LookingForJob/JobQuestionnaire";
import { ShareQuestionnaire } from "./NewComponents/Caregivers/NannyShareOnboarding/LookingForFamily/ShareQuestionnaire";
import { Screen4 } from "./NewComponents/Caregivers/NannyShareOnboarding/LookingForJob/Screen4"
import MatchRequests from "./NewComponents/MatchRequests";
import { FamilyOnboarding } from "./NewComponents/NannyShare/Onboarding/FamilyOnboarding";
import WaitlistForm from "./NewComponents/Waitlist";
import NannyProfileView from "./NewComponents/NannyShareProfile/NannyProfileView";
import FamilyProfileView from "./NewComponents/NannyShareProfile/FamilyProfileView";

// Lazy import
const LazyStripeCheckout = lazy(() => import("./NewComponents/StripeCheckout"));

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
        {/* Common routes */}
        {!user?.type && (
          <>
            <Route path="/" element={<NannyShare />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/terms-and-conditions"
              element={<TermsAndConditions />}
            />
            <Route path="/forgetPass" element={<ForgetPass />} />
            <Route path="/nanny-share/:city" element={<NannyShareCityPage />} />
            <Route path="/nanny-share/profile/:id" element={<ViewProfileDetails />} />
            <Route path="/events" element={<Events />} />
            <Route path="/jobSeekers" element={<Caregivers />} />
            <Route path="/families" element={<NewHome />} />
            <Route path="/business" element={<Business />} />
            <Route path="/joinNow" element={<JoinNow />} />
            <Route path="/caregiver/nannyshare" element={<ChooseNannyShare />} />
            <Route path="/hire" element={<NewHireForm />} />
            <Route path="/job" element={<Job />} />
            <Route path="/find-nanny-share" element={<NannyShareMatchForm />} />
            <Route path="/find-nanny-share/family/:id" element={<FamilyOnboarding />} />
            <Route path="/caregiver/nanny-share/looking-for-nanny-share-job/:id" element={<JobQuestionnaire />} />
            <Route path="/caregiver/nanny-share/looking-for-another-family/:id" element={<ShareQuestionnaire />} />
            <Route path="/find-nanny-share/nanny-share-questionnaire/:id" element={<PostANannyShare login={false} />} />
            <Route path="/find-nanny-share/nanny-share-questionnaire/fulltime-care/:id" element={<FullTime login={false} />} />
            <Route path="/find-nanny-share/nanny-share-questionnaire/parttime-care/:id" element={<PartTime login={false} />} />
            <Route path="/find-nanny-share/nanny-share-questionnaire/pickup-dropoff/:id" element={<DropOff login={false} />} />
            <Route path="/find-nanny-share/nanny-share-questionnaire/after-school/:id" element={<AfterSchoolCare login={false} />} />
            <Route path="/find-nanny-share/nanny-share-questionnaire/seasonal/:id" element={<Seasonal login={false} />} />
            <Route path="/find-nanny-share/nanny-share-questionnaire/weekend/:id" element={<PartTime login={false} />} />
            <Route path="/tutorJob" element={<TutorJob />} />
            <Route path="/swimJob" element={<SwimJob />} />
            <Route
              path="/specialCaregiverJob"
              element={<SpecialCaregiverJob />}
            />
            <Route path="/houseManagerJob" element={<HouseManagerJob />} />
            <Route path="/musicJob" element={<MusicJob />} />
            <Route path="/sportCoachJob" element={<SportCoachJob />} />
            <Route path="/waitlist" element={<WaitlistForm />} />
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
            <Route path="complete-profile" element={<Screen4 />} />
            <Route path="post-a-nannyShare" element={<PostANannyShare />} />
            <Route
              path="post-a-nannyShare/after-school"
              element={<AfterSchoolCare />}
            />
            <Route
              path="post-a-nannyShare/pickup-dropoff"
              element={<DropOff />}
            />
            <Route
              path="post-a-nannyShare/fulltime-care"
              element={<FullTime />}
            />
            <Route
              path="post-a-nannyShare/parttime-care"
              element={<PartTime />}
            />
            <Route
              path="post-a-nannyShare/weekend"
              element={<PartTime />}
            />
            <Route path="post-a-nannyShare/seasonal" element={<Seasonal />} />
            <Route
              path="pricing"
              element={
                <Suspense fallback={<div>Loading payment...</div>}>
                  <LazyStripeCheckout nanny={false} />
                </Suspense>
              }
            />
            <Route path="profile" element={<Profile />} />
            <Route path="edit" element={<EditProfile />} />
            <Route
              path="terms-and-conditions"
              element={<TermsAndConditions />}
            />
            <Route path="setting" element={<Setting />} />
            <Route path="message" element={<Message />} />
            <Route path="booking" element={<Booking />} />
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

        {/* Nanny-specific routes */}
        {user?.type === "Nanny" && (
          <Route path="/nanny/*" element={<Nanny />}>
            <Route path="family-profile-view/:id" element={<FamilyProfileView />} />
            <Route path="nanny-profile-view/:id" element={<NannyProfileView />} />
            <Route path="jobDescription/:id" element={<JobDescription />} />
            <Route path="profileFamily/:id" element={<ProfileFamily />} />
            <Route path="profile" element={<UserProfileNanny />} />
            <Route path="requests" element={<MatchRequests />} />
            <Route path="edit" element={<EditProfileNanny />} />
            <Route path="complete-profile" element={<Screen4 />} />
            <Route
              path="pricing"
              element={
                <Suspense fallback={<div>Loading payment...</div>}>
                  <LazyStripeCheckout nanny={true} />
                </Suspense>
              }
            />
            <Route path="setting" element={<SettingNanny />} />
            <Route path="message" element={<MessageNanny />} />
            <Route path="booking" element={<BookingNanny />} />
            <Route
              path="terms-and-conditions"
              element={<TermsAndConditions />}
            />
            <Route path="favorites" element={<FavoritesNanny />} />
            <Route path="community" element={<TipsAndArticlesNanny />} />
            <Route path="application" element={<Application />} />
            {/* <Route path="withdrawEarning" element={<WithdrawEarning />} /> */}
          </Route>
        )}

        {/* Fallback or redirect for unauthorized users */}
        {!user?.type && <Route path="*" element={<Navigate to="/" />} />}
        <Route
          path="*"
          element={
            user?.type === "Parents" ? (
              <Navigate to="/dashboard" />
            ) : user?.type === "Nanny" ? (
              <Navigate to="/nanny" />
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Route>,
    ),
  );

  return <RouterProvider router={router} />;
}

export default App;
