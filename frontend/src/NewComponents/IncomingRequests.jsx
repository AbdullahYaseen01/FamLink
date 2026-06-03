import React, {
  useEffect,
  useState,
  useCallback
} from "react";

import {
  useDispatch,
  useSelector
} from "react-redux";

import {
  getIncomingRequestsThunk
} from "../Components/Redux/matchSlice";

import Loader from "../Components/subComponents/loader";
import {
  FamilyProfile,
  NannyProfile
} from "../Components/subComponents/profileCard";
import { MatchRequestSuccessModal } from "./MatchSuccessModal";

const IncomingRequests = () => {
  const dispatch = useDispatch();
  const [isRequestMatchSuccessModal, setIsRequestMatchSuccessModal] = useState(false)
  const [chatUserId, setChatUserId] = useState(null)

  const {
    matches,
    isMatchLoading,
    hasMore
  } = useSelector(
    (state) => state.matchRequest
  );

  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(
      getIncomingRequestsThunk({
        page: 1,
        limit: 10
      })
    );
  }, [dispatch]);

  console.log("Matches", matches)

  const handleScroll = useCallback(() => {
    const scrollTop =
      window.scrollY;

    const windowHeight =
      window.innerHeight;

    const documentHeight =
      document.documentElement
        .scrollHeight;

    if (
      scrollTop + windowHeight >=
      documentHeight - 200 &&
      !isMatchLoading &&
      hasMore
    ) {
      setPage(prev => prev + 1);
    }
  }, [
    isMatchLoading,
    hasMore
  ]);

  useEffect(() => {
    window.addEventListener(
      "scroll",
      handleScroll
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, [handleScroll]);

  useEffect(() => {
    if (page > 1) {
      dispatch(
        getIncomingRequestsThunk({
          page,
          limit: 10
        })
      );
    }
  }, [page, dispatch]);

  return (
    <div>
      {isRequestMatchSuccessModal && <MatchRequestSuccessModal setIsRequestMatchSuccessModal={setIsRequestMatchSuccessModal} chatUserId={chatUserId} />}
      {isMatchLoading && <Loader />}
      {matches?.filter(
        (profile) =>
          profile.status !== "accepted" &&
          profile.status !== "rejected"
      ).map((profile) =>
        // profile.status !== "accepted" &&
        profile.userId?.type ===
          "Parents" ? (
          <FamilyProfile
            key={profile._id}
            id={profile._id}
            matchId={profile.matchId}
            status={profile.status}
            userId={profile.userId?._id}
            setChatUserId={setChatUserId}
            setMatchRequestSuccessModal={setIsRequestMatchSuccessModal}
            requestType={profile.requestType}
            name={profile.userId?.name}
            imgUrl={profile.userId?.imageUrl}
            careType={profile.nannyShareType}
            schedule={profile.specificDays}
            location={profile.userId?.location}
            hosting={profile.hostingPreference}
            hasNanny={profile.hasNanny?.split(" ")[0]}
            start={profile.nannyshareStart}
            shareLocation={profile.shareLocation.length < 2 ? profile.shareLocation : "flexible location"}
            sharedRate={profile.hourlyBudget
              .maxShare ? `~$${profile.hourlyBudget
                .maxShare} - ${profile.hourlyBudget
                  .minShare}/hr per family` : `~$${profile.hourlyBudget
                    .minShare + "+/hr per family"}`}
            soloRate={profile.hourlyBudget
              .max ? `~$${profile.hourlyBudget
                .max} - ${profile.hourlyBudget
                  .min}/hr` : `~$${profile.hourlyBudget
                    .min + "+/hr"}`}
            ages={profile.childrenAges}
          />
        ) : (
          <NannyProfile
            key={profile._id}
            id={profile._id}
            matchId={profile.matchId}
            status={profile.status}
            userId={profile.userId?._id}
            setMatchRequestSuccessModal={setIsRequestMatchSuccessModal}
            requestType={profile.requestType}
            sharedRate={profile.sharedRate}
            setChatUserId={setChatUserId}
            soloRate={profile.soloRate}
            rateType={profile.rateType}
            ages={profile.preferredAges}
            schedule={profile.specificDays}
            careType={profile.careType}
            start={profile.startAvailability}
            // type={profile.userId?.type}
            goal={profile.userId?.goal}
            img={profile.imageFile}
            name={profile.userId?.name}
            // bio={profile?.bio}
            experience={profile?.careExperience}
            distance={profile?.careDistance}
            // roles={profile?.responsibilities}
            location={profile.userId?.location}
            created={profile?.createdAt}
          />
        )
      )}

      {!hasMore &&
        matches?.length > 0 && (
          <p className="text-center py-5">
            No more profiles
          </p>
        )}
    </div>
  );
};

export default IncomingRequests;