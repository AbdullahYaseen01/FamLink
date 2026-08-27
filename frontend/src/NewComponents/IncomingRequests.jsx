import React, { useState } from "react";
import Loader from "../Components/subComponents/loader";
import { FamilyProfileUpgraded, NannyProfileUpgraded } from "../Components/subComponents/profileCard";
import { MatchRequestSuccessModal } from "./MatchSuccessModal";
import MatchesEmptyState from "./MatchesEmptyState";
import {
  formatPlacedNannySharedRate,
  formatPlacedNannySoloRate,
  formatSharedRate,
  formatSoloRate,
} from "../Config/helpFunction";

const IncomingRequests = ({ matches, isMatchLoading, hasMore, hasFetched, onBrowse }) => {
  const [isRequestMatchSuccessModal, setIsRequestMatchSuccessModal] = useState(false);
  const [chatUserId, setChatUserId] = useState(null);

  return (
    <div className="flex flex-col gap-4">
      {isRequestMatchSuccessModal && (
        <MatchRequestSuccessModal
          setIsRequestMatchSuccessModal={setIsRequestMatchSuccessModal}
          chatUserId={chatUserId}
        />
      )}

      {isMatchLoading && !hasFetched && <Loader />}

      {hasFetched && !isMatchLoading && matches?.length === 0 && (
        <MatchesEmptyState
          variant="requests"
          headline="No match requests yet"
          description="When a family or caregiver wants to connect with you, their request will appear here."
          ctaLabel="Browse Matches"
          onCta={onBrowse}
        />
      )}

      {matches?.map((profile) =>
        profile.userId?.type === "Parents" ? (
          <FamilyProfileUpgraded
            key={profile._id}
            id={profile.userId?._id || profile.userId}
            matchId={profile.matchId}
            status={profile.status}
            userId={profile.userId?._id}
            setChatUserId={setChatUserId}
            setMatchRequestSuccessModal={setIsRequestMatchSuccessModal}
            requestType="incoming"
            name={profile.userId?.name}
            img={profile.userId?.imageUrl}
            careType={profile.nannyShareType}
            schedule={profile.specificDays}
            location={profile.userId?.location}
            hosting={profile.hostingPreference}
            hasNanny={profile.hasNanny}
            distanceMiles={profile.distanceMiles}
            start={profile.nannyshareStart}
            shareLocation={
              !profile.shareLocation || profile.shareLocation.length < 2
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
            upgraded
          />
        ) : (
          <NannyProfileUpgraded
            key={profile._id}
            id={profile.userId?._id || profile.userId}
            matchId={profile.matchId}
            status={profile.status}
            userId={profile.userId?._id}
            setMatchRequestSuccessModal={setIsRequestMatchSuccessModal}
            requestType="incoming"
            sharedRate={profile.hasFamily ? formatPlacedNannySharedRate(profile) : profile.sharedRate}
            setChatUserId={setChatUserId}
            soloRate={profile.hasFamily ? formatPlacedNannySoloRate(profile) : profile.soloRate}
            rateType={profile.rateType}
            ages={profile.hasFamily ? profile.childrenAges?.map((age) => age.label) : profile.preferredAges}
            childrenCount={profile.hasFamily ? profile.numberOfChildren : undefined}
            schedule={profile.specificDays}
            careType={profile.careType || profile.currentSchedule}
            start={profile.startAvailability}
            goal={profile.userId?.goal}
            img={profile.imageFile}
            name={profile.userId?.name}
            experience={profile?.careExperience}
            distance={profile?.careDistance}
            location={profile.userId?.location}
            created={profile?.createdAt}
            upgraded
            hasFamily={profile.hasFamily}
            preferredAges={profile.preferredAges}
            distanceMiles={profile.distanceMiles}
            whereCare={profile.whereCare}
          />
        )
      )}

      {!hasMore && matches?.length > 0 && (
        <p className="text-center py-5">No more profiles</p>
      )}
    </div>
  );
};

export default IncomingRequests;
