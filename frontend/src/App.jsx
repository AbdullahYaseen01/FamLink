import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import PageLayout from "./pageLayout";
import Home from "./Components/Home/home";
import Families from "./Components/Families/Families";
import JobSeekers from "./Components/Job-Seekers/jobSeekers";
import IndividualProfile from "./Components/Profiles/profiles";
import NannyShare from "./NewComponents/NannyShare/NannyShare";
import Services from "./Components/Services/services";
import ListYourBusiness from "./Components/ListYouryourBusiness/listYourBusiness";
import JoinNow from "./Components/JoinNow/joinNow";
import Tutor from "./Components/subComponents/Hire/NannyShareNo/AdditionalStep.jsx/tutor";
import Swim from "./Components/subComponents/Hire/NannyShareNo/AdditionalStep.jsx/swim";
import SpecialCaregiver from "./Components/subComponents/Hire/NannyShareNo/AdditionalStep.jsx/specializedCare";
import HouseManager from "./Components/subComponents/Hire/NannyShareNo/AdditionalStep.jsx/houseMang";
import Music from "./Components/subComponents/Hire/NannyShareNo/AdditionalStep.jsx/music";
import SportCoach from "./Components/subComponents/Hire/NannyShareNo/AdditionalStep.jsx/sportCoach";
import HireForm from "./Components/JoinNow/Hire";
import Job from "./Components/JoinNow/Job";
import CommunitySign from "./Components/JoinNow/CommunitySign";
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
import TipsAndArticles from "./Components/LoginAsFamily/community";
import Community from "./Components/LoginAsFamily/tipsAndArticles";
import DetailsCommArt from "./Components/LoginAsFamily/detailsCommArt";
import TrustsAndSafety from "./Components/LoginAsFamily/trustAndSafety";
import HowItWorks from "./Components/LoginAsFamily/howItWorks";
import Desktop1 from "./Components/LoginAsFamily/CommDesktop/desktop1";
import Desktop2 from "./Components/LoginAsFamily/CommDesktop/desktop2";
import Desktop3 from "./Components/LoginAsFamily/CommDesktop/desktop3";
import TransHist from "./Components/LoginAsFamily/transHistory";

import Nanny from "./Components/LoginAsNanny/nanny";
import UserProfileNanny from "./Components/LoginAsNanny/userProfile";
import EditProfileNanny from "./Components/LoginAsNanny/editProfile";
import JobDescription from "./Components/LoginAsNanny/jobDescription";
import SettingNanny from "./Components/LoginAsNanny/setting";
import MessageNanny from "./Components/LoginAsNanny/Message";
import BookingNanny from "./Components/LoginAsNanny/booking";
import FavoritesNanny from "./Components/LoginAsNanny/favourite";
import TipsAndArticlesNanny from "./Components/LoginAsNanny/tipsAndArticles";
import DetailsCommArtNanny from "./Components/LoginAsNanny/detailsCommArt";
import TransHistNanny from "./Components/LoginAsNanny/transHist";
import Application from "./Components/LoginAsNanny/application";
import WithdrawEarning from "./Components/LoginAsNanny/withdrawEarning";
import Login from "./Components/Login/login";
import ComingSoon from "./Components/subComponents/comingSoon";
import NannyShareComponent from "./Components/LoginAsFamily/nannyShare";
import NewHireForm from "./Components/JoinNow/NewHire";
import PostAJob from "./Components/LoginAsFamily/PostAJob/postAJob";
import JobListing from "./Components/LoginAsFamily/JobListing/job-listing";
import JobListingView from "./Components/LoginAsFamily/JobListing/job-listing-view";
import { PostANannyShare } from "./Components/LoginAsFamily/PostANannyShare/postANannyShare";
import { NannyShareView } from "./Components/LoginAsFamily/PostANannyShare/detailsNannyShare";
import { useNotifications } from "./Config/useNotification";
import Pricing from "./Components/Price/pricing";
import CommunityPost from "./Components/subComponents/community";
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
            {/* <Route path="/pricing" element={<Pricing />} /> */}
            <Route
              path="/terms-and-conditions"
              element={<TermsAndConditions />}
            />
            <Route path="/forgetPass" element={<ForgetPass />} />
            <Route path="/forFamilies" element={<Families />} />
            <Route path="/events" element={<Events />} />
            <Route path="/jobSeekers" element={<Caregivers />} />
            <Route path="/family" element={<NewHome />} />
            <Route path="/business" element={<Business />} />
            <Route path="/services" element={<Services />} />
            <Route path="/yourBusiness" element={<ListYourBusiness />} />
            <Route path="/joinNow" element={<JoinNow />} />
            <Route path="/hire" element={<NewHireForm />} />
            <Route path="/job" element={<Job />} />
            {/* <Route path="/communitySign" element={<CommunitySign />} /> */}
            {/* <Route path='/tutor' element={<Tutor />} /> */}
            <Route path="/tutorJob" element={<TutorJob />} />
            {/* <Route path='/swim' element={<Swim />} /> */}
            <Route path="/swimJob" element={<SwimJob />} />
            {/* <Route path='/specialCaregiver' element={<SpecialCaregiver />} /> */}
            <Route
              path="/specialCaregiverJob"
              element={<SpecialCaregiverJob />}
            />
            {/* <Route path='/houseManager' element={<HouseManager />} /> */}
            <Route path="/houseManagerJob" element={<HouseManagerJob />} />
            {/* <Route path='/music' element={<Music />} /> */}
            <Route path="/musicJob" element={<MusicJob />} />
            {/* <Route path='/sportCoach' element={<SportCoach />} /> */}
            <Route path="/sportCoachJob" element={<SportCoachJob />} />
          </>
        )}
        <Route path="/profile/:id" element={<IndividualProfile />} />

        {/* Family-specific routes */}
        {user?.type === "Parents" && (
          <Route path="/family/*" element={<Family />}>
            <Route path="profileNanny/:id" element={<ProfileNanny />} />
            <Route path="post-a-job" element={<PostAJob />} />
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
            <Route path="post-a-nannyShare/seasonal" element={<Seasonal />} />
            <Route path="pricing" element={<Pricing nanny={false} />} />
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
            <Route path="nannyShare" element={<NannyShareComponent />} />
            <Route path="nannyShareView/:id" element={<NannyShareDetails />} />
             <Route path="nannyShareEdit/:id" element={<EditNannyShare />} />
            <Route path="description/:id" element={<JobDescription />} />
            <Route path="tipsAndArticles" element={<Community />} />
            <Route path="howItWorks" element={<HowItWorks />} />
            <Route path="jobListing" element={<JobListing />} />
            <Route path="jobListingView/:id" element={<JobListingView />} />
            <Route path="trustsAndSafety" element={<TrustsAndSafety />} />
            {/* <Route path='transHistory' element={<TransHist />} /> */}
            <Route path="desktop1/:id" element={<Desktop1 />} />
            <Route path="desktop2/:id/:topicId" element={<Desktop2 />} />
            <Route path="desktop3/:id/:postId" element={<Desktop3 />} />
            <Route path="details/:id" element={<DetailsCommArt />} />
          </Route>
        )}

        {/* Nanny-specific routes */}
        {user?.type === "Nanny" && (
          <Route path="/nanny/*" element={<Nanny />}>
            <Route path="jobDescription/:id" element={<JobDescription />} />
            <Route path="profile" element={<UserProfileNanny />} />
            <Route path="edit" element={<EditProfileNanny />} />
            <Route path="pricing" element={<Pricing nanny={true} />} />
            <Route path="setting" element={<SettingNanny />} />
            <Route path="message" element={<MessageNanny />} />
            <Route path="booking" element={<BookingNanny />} />
            <Route
              path="terms-and-conditions"
              element={<TermsAndConditions />}
            />
            <Route path="favorites" element={<FavoritesNanny />} />
            <Route path="community" element={<TipsAndArticlesNanny />} />
            <Route path="howItWorks" element={<HowItWorks />} />
            <Route path="trustsAndSafety" element={<TrustsAndSafety />} />
            <Route path="details/:id" element={<DetailsCommArtNanny />} />
            {/* <Route
              path='community'
              element={<TipsAndArticles nanny={true} />}
            /> */}
            {/* <Route
              path='community'
              element={<ComingSoon />}
            /> */}
            <Route path="desktop1/:id" element={<Desktop1 nanny={true} />} />
            <Route
              path="desktop2/:id/:topicId"
              element={<Desktop2 nanny={true} />}
            />
            <Route
              path="desktop3/:id/:postId"
              element={<Desktop3 nanny={true} />}
            />
            {/* <Route path='transHistory' element={<TransHistNanny />} /> */}
            <Route path="application" element={<Application />} />
            <Route path="withdrawEarning" element={<WithdrawEarning />} />
          </Route>
        )}

        {/* Fallback or redirect for unauthorized users */}
        {!user?.type && <Route path="*" element={<Navigate to="/" />} />}
        <Route
          path="*"
          element={
            user?.type === "Parents" ? (
              <Navigate to="/family" />
            ) : user?.type === "Nanny" ? (
              <Navigate to="/nanny" />
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Route>
    )
  );

  return <RouterProvider router={router} />;
}

export default App;
