import { useEffect, useState } from "react";
import { Pagination, Skeleton } from "antd";
import { FamilyProfile, NannyProfile, ProfileCard1 } from "../../subComponents/profileCard";
import { useDispatch, useSelector } from "react-redux";
import { toCamelCase } from "../../subComponents/toCamelStr";
import { convertAgeRanges } from "../../../Config/helpFunction";
import Loader from "../../subComponents/loader";
import { fetchAllPostJobThunk } from "../../Redux/postJobSlice";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { viewCurrentUserProfileThunk, viewNannyShareProfileThunk } from "../../Redux/nannyShareSlice";
import { RequestMatchDenied } from "../../../NewComponents/RequestMatchDenied";
import { sentMatchRequestThunk } from "../../Redux/matchSlice";
import { fireToastMessage } from "../../../toastContainer";
import { CompleteProfileModal } from "../../../NewComponents/CompleteProfileModal";
import { MatchRequestFormModal } from "../../../NewComponents/MatchRequestFormModal";
import RejectMatchModal from "../../../NewComponents/RejectMatchModal";

export default function ProfileList({
  location,
  priceRange,
  availability,
  careOptions,
  services,
  maxChildren,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isMatchRequestDenied, setIsMatchRequestDenied] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [senderId, setSenderId] = useState(null);
  const [receiverId, setReceiverId] = useState(null);
  const [isRequestSubmitModal, setIsRequestSubmitModal] = useState(false);
  const { matches, isMatchLoading, message } = useSelector((state) => state.matchRequest);
  const { user, accessToken } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { data, pagination, isCurrentProfileLoading, isProfilesLoading, currentProfile } = useSelector((state) => state.postNannyShare);

  useEffect(() => {
    dispatch(viewCurrentUserProfileThunk());
  }, []);

  const pageSize = 4;

  useEffect(() => {
    const filters = {
      page: currentPage,
      limit: pageSize,
    };
    if (location > 0) filters.location = location;
    if (careOptions.length > 0) {
      const { min, max } = convertAgeRanges(careOptions);
      filters.minAge = min;
      filters.maxAge = max;
    }
    if (priceRange[0] >= 0 && priceRange[1] >= 0) {
      filters.minRate = priceRange[0];
      filters.maxRate = priceRange[1];
    }
    if (maxChildren) filters.maxChildren = maxChildren;
    if (services.length > 0) filters.jobType = services;
    if (availability?.length > 0) filters.preferredSchedule = availability;

    dispatch(viewNannyShareProfileThunk(filters));
  }, [dispatch, currentPage, location, careOptions, priceRange, availability, services, maxChildren, matches]);

  useEffect(() => {
    setCurrentPage(1);
  }, [location, careOptions, priceRange, maxChildren]);

  const total = pagination.totalRecords;
  const handlePageChange = (page) => setCurrentPage(page);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

  const handleMatchRequest = async (user, senderId, receiverId, setIsMatchRequestDenied, setIsProfileComplete, setIsRequestSubmitModal) => {
    if (!user.nannyProfileCompleted) {
      setIsProfileComplete(true);
      return;
    }
    if (user.type === "Parents" && user.matchRequestsSent > 0 && !user.premium) {
      setIsMatchRequestDenied(true);
      return;
    }
    setSenderId(senderId);
    setReceiverId(receiverId);
    setIsRequestSubmitModal(true);
  };

  const renderCurrentProfile = () => {
    if (isCurrentProfileLoading) {
      return (
        <div className="p-4 border rounded-xl">
          <Skeleton active avatar={{ size: 64, shape: "circle" }} paragraph={{ rows: 3 }} />
        </div>
      );
    }

    if (!currentProfile) return null;

    console.log("Current profile", currentProfile)

    const extraData =
      currentProfile.userId?.additionalInfo?.reduce(
        (acc, curr) => ({ ...acc, [curr.key]: curr.value }),
        {}
      ) || {};

    if (currentProfile.userId?.type === "Parents") {
      return (
        <FamilyProfile
          key={currentProfile._id}
          id={currentProfile.userId?._id || currentProfile.userId}
          status={currentProfile.status}
          handleMatchRequest={currentProfile.userId._id !== user._id ? handleMatchRequest : null}
          setIsRequestSubmitModal={setIsRequestSubmitModal}
          setIsMatchRequestDenied={setIsMatchRequestDenied}
          setIsProfileComplete={setIsProfileComplete}
          userId={currentProfile.userId?._id}
          name={currentProfile.userId?.name}
          img={currentProfile.userId?.imageUrl}
          careType={currentProfile.nannyShareType || extraData.nannyShareType || currentProfile.careType}
          schedule={currentProfile.specificDays || extraData.specificDaysAndTime}
          location={currentProfile.userId?.location}
          hosting={currentProfile.hostingPreference || extraData.hosting}
          hasNanny={currentProfile.hasNanny}
          start={currentProfile.nannyshareStart || extraData.urgency}
          shareLocation={(() => {
            const loc = currentProfile.shareLocation || extraData.shareLocation;
            if (!loc) return "flexible location";
            let arr = Array.isArray(loc) ? loc : [loc];
            const parsedArr = arr.map((item) => {
              if (typeof item === "string" && (item.startsWith("[") || item.startsWith("{"))) {
                try {
                  const p = JSON.parse(item);
                  return Array.isArray(p) ? p.join(", ") : p;
                } catch (e) {
                  return item;
                }
              }
              return item;
            });
            return parsedArr.join(", ");
          })()}
          sharedRate={
            typeof currentProfile.hourlyBudget === "string"
              ? currentProfile.hourlyBudget
              : currentProfile.hourlyBudget?.maxShare
                ? `~$${currentProfile.hourlyBudget.maxShare} - ${currentProfile.hourlyBudget.minShare}/hr per family`
                : currentProfile.hourlyBudget?.minShare
                  ? `~$${currentProfile.hourlyBudget.minShare}+/hr per family`
                  : "N/A"
          }
          soloRate={
            typeof currentProfile.hourlyBudget === "string"
              ? "N/A"
              : currentProfile.hourlyBudget?.max
                ? `~$${currentProfile.hourlyBudget.max} - ${currentProfile.hourlyBudget.min}/hr`
                : currentProfile.hourlyBudget?.min
                  ? `~$${currentProfile.hourlyBudget.min}+/hr`
                  : "N/A"
          }
          ages={
            currentProfile.childrenAges?.length > 0
              ? currentProfile.childrenAges.map((age) => age.label)
              : []
          }
          childrenCount={(() => {
            if (currentProfile.numberOfChildren !== undefined) return currentProfile.numberOfChildren;
            let childrenObj = currentProfile.userId?.noOfChildren;
            if (typeof childrenObj === "string") {
              try { childrenObj = JSON.parse(childrenObj); } catch (e) { }
            }
            return childrenObj?.length || 0;
          })()}
        />
      );
    }

    return (
      <NannyProfile
        key={currentProfile._id}
        id={currentProfile.userId?._id || currentProfile.userId}
        status={currentProfile.status}
        handleMatchRequest={currentProfile.userId._id !== user._id ? handleMatchRequest : null}
        userId={currentProfile.userId?._id}
        setIsRequestSubmitModal={setIsRequestSubmitModal}
        setIsMatchRequestDenied={setIsMatchRequestDenied}
        setIsProfileComplete={setIsProfileComplete}
        sharedRate={currentProfile.hasFamily
          ? typeof currentProfile.hourlyBudget === "string"
            ? currentProfile.hourlyBudget
            : currentProfile.hourlyBudget?.maxShare
              ? `~$${currentProfile.hourlyBudget.maxShare} - ${currentProfile.hourlyBudget.minShare}/hr per family`
              : currentProfile.hourlyBudget?.minShare
                ? `~$${currentProfile.hourlyBudget.minShare}+/hr per family`
                : "N/A"
          : currentProfile.sharedRate}
        soloRate={currentProfile.hasFamily
          ? typeof currentProfile.hourlyBudget === "string"
            ? "N/A"
            : currentProfile.hourlyBudget?.max
              ? `~$${currentProfile.hourlyBudget.max} - ${currentProfile.hourlyBudget.min}/hr`
              : currentProfile.hourlyBudget?.min
                ? `~$${currentProfile.hourlyBudget.min}+/hr`
                : "N/A"
          : currentProfile.soloRate}
        rateType={currentProfile.rateType}
        ages={
          !currentProfile.hasFamily ? currentProfile.preferredAges?.length > 0
            ? currentProfile.preferredAges.map((age) => age.label)
            : [] : currentProfile.childrenAges?.length > 0
            ? currentProfile.childrenAges.map((age) => age.label)
            : []
        }
        childrenCount={(() => {
          if (currentProfile.numberOfChildren !== undefined) return currentProfile.numberOfChildren;
          let childrenObj = currentProfile.userId?.noOfChildren;
          if (typeof childrenObj === "string") {
            try { childrenObj = JSON.parse(childrenObj); } catch (e) { }
          }
          return childrenObj?.length || 0;
        })()}
        schedule={currentProfile.specificDays}
        careType={currentProfile.careType}
        start={currentProfile.startAvailability}
        goal={currentProfile.hasFamily ? "With Family, Looking for share" : "Looking for a share position"}
        img={currentProfile.userId?.imageUrl || currentProfile.imageFile}
        name={currentProfile.userId?.name}
        experience={currentProfile?.careExperience}
        distance={currentProfile?.careDistance}
        location={currentProfile.userId?.location}
        created={currentProfile?.createdAt}
        hasFamily={currentProfile.hasFamily}
        whereCare={currentProfile?.whereCare}
      />
    );
  };

  const renderProfiles = () => {
    if (isProfilesLoading) {
      return Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-4 border rounded-xl">
          <Skeleton active avatar={{ size: 64, shape: "circle" }} paragraph={{ rows: 3 }} />
        </div>
      ));
    }

    if (!data?.length) {
      return (
        <div className="col-span-full text-start text-gray-600">
          <p>No profiles available at the moment. Please check back later.</p>
        </div>
      );
    }

    return data
      .filter((profile) => profile && profile._id && profile.userId._id !== user._id)
      .map((profile) => {
        const extraData =
          profile.userId?.additionalInfo?.reduce(
            (acc, curr) => ({ ...acc, [curr.key]: curr.value }),
            {}
          ) || {};

        if (profile.userId?.type === "Parents") {
          return (
            <FamilyProfile
              key={profile._id}
              id={profile.userId?._id || profile.userId}
              status={profile.status}
              handleMatchRequest={handleMatchRequest}
              setIsRequestSubmitModal={setIsRequestSubmitModal}
              setIsMatchRequestDenied={setIsMatchRequestDenied}
              setIsProfileComplete={setIsProfileComplete}
              userId={profile.userId?._id}
              name={profile.userId?.name}
              img={profile.userId?.imageUrl}
              careType={profile.nannyShareType || extraData.nannyShareType}
              schedule={profile.specificDays || extraData.specificDaysAndTime}
              location={profile.userId?.location}
              hosting={profile.hostingPreference || extraData.hosting}
              hasNanny={profile.hasNanny}
              start={profile.nannyshareStart || extraData.urgency}
              shareLocation={(() => {
                const loc = profile.shareLocation || extraData.shareLocation;
                if (!loc) return "flexible location";
                let arr = Array.isArray(loc) ? loc : [loc];
                const parsedArr = arr.map((item) => {
                  if (typeof item === "string" && (item.startsWith("[") || item.startsWith("{"))) {
                    try {
                      const p = JSON.parse(item);
                      return Array.isArray(p) ? p.join(", ") : p;
                    } catch (e) {
                      return item;
                    }
                  }
                  return item;
                });
                return parsedArr.join(", ");
              })()}
              sharedRate={
                typeof profile.hourlyBudget === "string"
                  ? profile.hourlyBudget
                  : profile.hourlyBudget?.maxShare
                    ? `~$${profile.hourlyBudget.maxShare} - ${profile.hourlyBudget.minShare}/hr per family`
                    : profile.hourlyBudget?.minShare
                      ? `~$${profile.hourlyBudget.minShare}+/hr per family`
                      : "N/A"
              }
              soloRate={
                typeof profile.hourlyBudget === "string"
                  ? "N/A"
                  : profile.hourlyBudget?.max
                    ? `~$${profile.hourlyBudget.max} - ${profile.hourlyBudget.min}/hr`
                    : profile.hourlyBudget?.min
                      ? `~$${profile.hourlyBudget.min}+/hr`
                      : "N/A"
              }
              ages={
                profile.childrenAges?.length > 0
                  ? profile.childrenAges.map((age) => age.label)
                  : []
              }
              childrenCount={(() => {
                if (profile.numberOfChildren !== undefined) return profile.numberOfChildren;
                let childrenObj = profile.userId?.noOfChildren;
                if (typeof childrenObj === "string") {
                  try { childrenObj = JSON.parse(childrenObj); } catch (e) { }
                }
                return childrenObj?.length || 0;
              })()}
            />
          );
        }

        return (
          <NannyProfile
            key={profile._id}
            id={profile.userId?._id || profile.userId}
            status={profile.status}
            handleMatchRequest={handleMatchRequest}
            userId={profile.userId?._id}
            setIsRequestSubmitModal={setIsRequestSubmitModal}
            setIsMatchRequestDenied={setIsMatchRequestDenied}
            setIsProfileComplete={setIsProfileComplete}
            sharedRate={profile.hasFamily
              ? typeof profile.hourlyBudget === "string"
                ? profile.hourlyBudget
                : profile.hourlyBudget?.maxShare
                  ? `~$${profile.hourlyBudget.maxShare} - ${profile.hourlyBudget.minShare}/hr per family`
                  : profile.hourlyBudget?.minShare
                    ? `~$${profile.hourlyBudget.minShare}+/hr per family`
                    : "N/A"
              : profile.sharedRate}
            soloRate={profile.hasFamily
              ? typeof profile.hourlyBudget === "string"
                ? "N/A"
                : profile.hourlyBudget?.max
                  ? `~$${profile.hourlyBudget.max} - ${profile.hourlyBudget.min}/hr`
                  : profile.hourlyBudget?.min
                    ? `~$${profile.hourlyBudget.min}+/hr`
                    : "N/A"
              : profile.soloRate}
            rateType={profile.rateType}
            ages={
              !profile.hasFamily ? profile.preferredAges?.length > 0
                ? profile.preferredAges.map((age) => age.label)
                : [] : profile.childrenAges?.length > 0
                ? profile.childrenAges.map((age) => age.label)
                : []
            }
            schedule={profile.specificDays}
            careType={profile.careType || profile.currentSchedule}
            start={profile.startAvailability}
            goal={profile.userId?.goal}
            img={profile.userId?.imageUrl || profile.imageFile}
            name={profile.userId?.name}
            experience={profile?.careExperience}
            distance={profile?.careDistance}
            location={profile.userId?.location}
            created={profile?.createdAt}
            childrenCount={(() => {
              if (profile.numberOfChildren !== undefined) return profile.numberOfChildren;
              let childrenObj = profile.userId?.noOfChildren;
              if (typeof childrenObj === "string") {
                try { childrenObj = JSON.parse(childrenObj); } catch (e) { }
              }
              return childrenObj?.length || 0;
            })()}
            hasFamily={profile.hasFamily}
            whereCare={profile?.whereCare}
          />
        );
      });
  };

  return (
    <div className="flex flex-col w-full px-0 lg:px-4 2xl:px-8">
      {isRequestSubmitModal && (
        <MatchRequestFormModal
          setIsRequestSubmitModal={setIsRequestSubmitModal}
          senderId={senderId}
          receiverId={receiverId}
        />
      )}
      {isProfileComplete && <CompleteProfileModal setIsProfileComplete={setIsProfileComplete} />}
      {isMatchRequestDenied && <RequestMatchDenied setIsMatchRequestDenied={setIsMatchRequestDenied} />}

      {/* Your Profile Section */}
      <div className="flex justify-between flex-wrap mb-6">
        <h1 className="Livvic-SemiBold text-3xl">Your Profile</h1>
      </div>
      {renderCurrentProfile()}

      {/* Results Section */}
      <div className="flex justify-between flex-wrap mt-6">
        <h1 className="Livvic-SemiBold text-3xl">
          {total >= 1 ? `${total - 1} Results` : `${total} Results`}
        </h1>
      </div>
      <div className="flex flex-col gap-4 mt-6">
        {renderProfiles()}
      </div>

      {/* Pagination */}
      <div className="mt-6 w-full flex justify-end">
        {!isProfilesLoading && data?.length !== 0 && (
          <div className="flex items-center space-x-4">
            <p className="Livvic-Medium text-sm">
              Showing {startItem}-{endItem} from {total}
            </p>
            <Pagination
              className="Livvic-Medium"
              current={currentPage}
              pageSize={pageSize}
              total={total}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}