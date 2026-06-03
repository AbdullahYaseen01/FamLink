import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getIncomingRequestsThunk } from "../Components/Redux/matchSlice";
import Loader from "../Components/subComponents/loader";
import { FamilyProfile, NannyProfile } from "../Components/subComponents/profileCard";
import { MatchRequestSuccessModal } from "./MatchSuccessModal";

const ChatInterfaceRequests = ({matches, isMatchLoading, setChatUserId, setIsRequestMatchSuccessModal}) => {

    return (
        <div>
            {isMatchLoading && <Loader />}
            {matches.length > 0 ? (matches
                .map((profile) =>
                    profile.userId?.type === "Parents" ? (
                        <FamilyProfile
                            key={profile._id}
                            id={profile._id}
                            matchId={profile.matchId}
                            status={profile.status}
                            setChatUserId={setChatUserId}
                            setMatchRequestSuccessModal={setIsRequestMatchSuccessModal}
                            userId={profile.userId?._id}
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
                            sharedRate={profile.hourlyBudget.maxShare ? `~$${profile.hourlyBudget.maxShare} - ${profile.hourlyBudget.minShare}/hr per family` : `~$${profile.hourlyBudget.minShare + "+/hr per family"}`}
                            soloRate={profile.hourlyBudget.max ? `~$${profile.hourlyBudget.max} - ${profile.hourlyBudget.min}/hr` : `~$${profile.hourlyBudget.min + "+/hr"}`}
                            ages={profile.childrenAges}
                        />
                    ) : (
                        <NannyProfile
                            key={profile._id}
                            id={profile._id}
                            matchId={profile.matchId}
                            setMatchRequestSuccessModal={setIsRequestMatchSuccessModal}
                            status={profile.status}
                            userId={profile.userId?._id}
                            setChatUserId={setChatUserId}
                            requestType={profile.requestType}
                            sharedRate={profile.sharedRate}
                            soloRate={profile.soloRate}
                            rateType={profile.rateType}
                            ages={profile.preferredAges}
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
                        />
                    )
                )) : (
                <div className="flex justify-center items-center w-full h-[200px]">
                    No Pending Requests
                </div>
            )}
        </div>
    );
};

export default ChatInterfaceRequests;