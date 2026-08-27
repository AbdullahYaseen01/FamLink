import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Loader from "../Components/subComponents/loader";
import { FamilyProfile, NannyProfile } from "../Components/subComponents/profileCard";
import { MatchRequestSuccessModal } from "./MatchSuccessModal";
import { formatSharedRate, formatSoloRate } from "../Config/helpFunction";
import MatchesEmptyState from "./MatchesEmptyState";
import {
  getCompatibility,
  resolveShareType,
  viewedTypeFromMatch,
} from "./matchesCompatibility";

const IncomingRequests = ({ matches, isMatchLoading, hasMore, hasFetched }) => {
  const [isRequestMatchSuccessModal, setIsRequestMatchSuccessModal] = useState(false);
  const [chatUserId, setChatUserId] = useState(null);
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const currentProfile = useSelector((s) => s.postNannyShare?.currentProfile);

  const viewerType = resolveShareType({
    type: user?.type,
    hasNanny: currentProfile?.hasNanny,
    hasFamily: currentProfile?.hasFamily,
  });

  return (
    <div>
      {isRequestMatchSuccessModal && (
        <MatchRequestSuccessModal
          setIsRequestMatchSuccessModal={setIsRequestMatchSuccessModal}
          chatUserId={chatUserId}
        />
      )}

      {isMatchLoading && <Loader />}

      {hasFetched && !isMatchLoading && matches?.length === 0 && (
        <MatchesEmptyState
          variant="requests"
          headline="No match requests yet"
          line="When a family or caregiver wants to connect with you, their request will appear here."
          cta="Browse Matches"
          onCta={() => navigate("/dashboard")}
        />
      )}

      {matches?.map((profile) => {
        const viewedType = viewedTypeFromMatch(profile);
        const { level, famSays } = getCompatibility(viewerType, viewedType, profile._id);
        const cardProps = {
          forceUpgraded: true,
          matchLevel: level,
          famSays,
        };

        return profile.userId?.type === "Parents" ? (
          <FamilyProfile
            key={profile._id}
            id={profile.userId?._id || profile.userId}
            matchId={profile.matchId}
            status={profile.status}
            userId={profile.userId?._id}
            setChatUserId={setChatUserId}
            setMatchRequestSuccessModal={setIsRequestMatchSuccessModal}
            requestType={profile.requestType || "incoming"}
            name={profile.userId?.name}
            img={profile.userId?.imageUrl}
            careType={profile.nannyShareType}
            schedule={profile.specificDays}
            location={profile.userId?.location}
            hosting={profile.hostingPreference}
            hasNanny={profile.hasNanny}
            start={profile.nannyshareStart}
            shareLocation={
              profile.shareLocation?.length < 2
                ? profile.shareLocation
                : "flexible location"
            }
            sharedRate={formatSharedRate(profile.hourlyBudget) || "N/A"}
            soloRate={formatSoloRate(profile.hourlyBudget) || "N/A"}
            ages={(() => {
              if (profile.childrenAges && profile.childrenAges.length > 0) {
                return profile.childrenAges.map((age) => age.label);
              }
              return [];
            })()}
            childrenCount={(() => {
              if (profile.numberOfChildren !== undefined)
                return profile.numberOfChildren;
              let childrenObj = profile.userId?.noOfChildren;
              if (typeof childrenObj === "string") {
                try { childrenObj = JSON.parse(childrenObj); } catch (e) {}
              }
              return childrenObj?.length || 0;
            })()}
            created={profile?.createdAt}
            {...cardProps}
          />
        ) : (
          <NannyProfile
            key={profile._id}
            id={profile.userId?._id || profile.userId}
            matchId={profile.matchId}
            status={profile.status}
            userId={profile.userId?._id}
            setMatchRequestSuccessModal={setIsRequestMatchSuccessModal}
            requestType={profile.requestType || "incoming"}
            sharedRate={profile.sharedRate}
            setChatUserId={setChatUserId}
            soloRate={profile.soloRate}
            rateType={profile.rateType}
            ages={profile.hasFamily ? (profile.childrenAges || profile.preferredAges) : profile.preferredAges}
            schedule={profile.specificDays}
            careType={profile.careType}
            start={profile.startAvailability}
            goal={profile.userId?.goal}
            img={profile.imageFile}
            name={profile.userId?.name}
            experience={profile?.careExperience}
            distance={profile?.careDistance}
            location={profile.userId?.location}
            created={profile?.createdAt}
            hasFamily={profile.hasFamily}
            whereCare={profile.hostingPreference || profile.whereCare}
            childrenCount={profile.numberOfChildren ?? profile.childrenCount}
            {...cardProps}
          />
        );
      })}

      {!hasMore && matches?.length > 0 && (
        <p className="text-center py-5">No more profiles</p>
      )}
    </div>
  );
};

export default IncomingRequests;
