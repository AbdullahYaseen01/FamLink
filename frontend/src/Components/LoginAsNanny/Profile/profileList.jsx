import { useEffect, useState } from "react";
import { Pagination } from "antd";
import { FamilyProfile, NannyProfile, ProfileCard1 } from "../../subComponents/profileCard";
import { useDispatch, useSelector } from "react-redux";
import { toCamelCase } from "../../subComponents/toCamelStr";
import { convertAgeRanges } from "../../../Config/helpFunction";
import Loader from "../../subComponents/loader";
import { fetchAllPostJobThunk } from "../../Redux/postJobSlice";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { viewNannyShareProfileThunk } from "../../Redux/nannyShareSlice";
import { RequestMatchDenied } from "../../../NewComponents/RequestMatchDenied";
import { sentMatchRequestThunk } from "../../Redux/matchSlice";
import { fireToastMessage } from "../../../toastContainer";
import { CompleteProfileModal } from "../../../NewComponents/CompleteProfileModal";
import { MatchRequestFormModal } from "../../../NewComponents/MatchRequestFormModal";
// ProfileList component

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
  const dispatch = useDispatch();
  const { data, pagination, isLoading } = useSelector((state) => state.postNannyShare);
  const pageSize = 4;
  useEffect(() => {
    const filters = {
      page: currentPage,
      limit: pageSize,
    };
    if (location > 0) {
      filters.location = location;
    }
    if (careOptions.length > 0) {
      const { min, max } = convertAgeRanges(careOptions);
      filters.minAge = min;
      filters.maxAge = max;
    }
    if (priceRange[0] >= 0 && priceRange[1] >= 0) {
      filters.minRate = priceRange[0];
      filters.maxRate = priceRange[1];
    }
    if (maxChildren) {
      filters.maxChildren = maxChildren;
    }
    if (services.length > 0) {
      const camelCaseAvailability = services.map(toCamelCase);
      filters.jobType = camelCaseAvailability.join(", ");
    }
    if (availability?.length > 0) {
      availability?.length == 1
        ? (filters.preferredSchedule = availability.join(", "))
        : (filters.preferredSchedule = availability);
    }
    dispatch(viewNannyShareProfileThunk(filters));
  }, [
    dispatch,
    currentPage,
    location,
    careOptions,
    priceRange,
    availability,
    services,
    maxChildren,
    matches
  ]);
  useEffect(() => {
    setCurrentPage(1);
  }, [location, careOptions, priceRange, maxChildren]);
  const total = pagination.totalRecords; // Use the nannies directly after fetching

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Calculate the range of items being shown (e.g., "Showing 1-08 from 100")
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

  const handleMatchRequest = async (user, senderId, receiverId, setIsMatchRequestDenied, setIsProfileComplete, setIsRequestSubmitModal) => {
    if (!user.nannyProfileCompleted) {
      setIsProfileComplete(true)
      return
    }
    if (user.matchRequestsSent >= 1 && !user.premium) {
      setIsMatchRequestDenied(true)
      return
    }
    console.log("Request sent logic starts");
    setSenderId(senderId)
    setReceiverId(receiverId)
    setIsRequestSubmitModal(true)
    return

  }

  return (
    <div className="flex flex-col w-full px-0 lg:px-4 2xl:px-8">
      {isRequestSubmitModal && <MatchRequestFormModal setIsRequestSubmitModal={setIsRequestSubmitModal} senderId={senderId} receiverId={receiverId} />}
      {isProfileComplete && <CompleteProfileModal setIsProfileComplete={setIsProfileComplete} />}
      {isMatchRequestDenied && <RequestMatchDenied setIsMatchRequestDenied={setIsMatchRequestDenied} />}
      <div className="flex justify-between flex-wrap">
        <h1 className="Livvic-SemiBold text-3xl">{total} Results</h1>
      </div>
      <div className="flex flex-col gap-4 mt-6">
        {isLoading ? (
          <div className="col-span-full">
            <Loader />
          </div>
        ) : data?.length > 0 ? (
          data
            .filter((profile) => profile && profile._id)
            .map((profile) => {
              const extraData = profile.userId?.additionalInfo?.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {}) || {};
              return profile.userId?.type === "Parents" ? (
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
                imgUrl={profile.userId?.imageUrl}
                careType={profile.nannyShareType || extraData.nannyShareType}
                schedule={profile.specificDays || extraData.specificDaysAndTime}
                location={profile.userId?.location}
                hosting={profile.hostingPreference || extraData.hosting}
                hasNanny={profile.hasNanny?.split(" ")[0] || extraData.hasNanny?.split("-")[0]}
                start={profile.nannyshareStart || extraData.urgency}
                shareLocation={(() => {
                  const loc = profile.shareLocation || extraData.shareLocation;
                  if (!loc) return "flexible location";
                  
                  let arr = Array.isArray(loc) ? loc : [loc];
                  
                  // Parse stringified JSON elements
                  const parsedArr = arr.map(item => {
                    if (typeof item === 'string' && (item.startsWith('[') || item.startsWith('{'))) {
                      try {
                        const p = JSON.parse(item);
                        return Array.isArray(p) ? p.join(", ") : p;
                      } catch(e) { return item; }
                    }
                    return item;
                  });
                  
                  return parsedArr.join(", ");
                })()}
                sharedRate={
                  typeof profile.hourlyBudget === 'string'
                    ? profile.hourlyBudget
                    : profile.hourlyBudget?.maxShare 
                      ? `~$${profile.hourlyBudget.maxShare} - ${profile.hourlyBudget.minShare}/hr per family` 
                      : profile.hourlyBudget?.minShare ? `~$${profile.hourlyBudget.minShare}+/hr per family` : "N/A"
                }
                soloRate={
                  typeof profile.hourlyBudget === 'string'
                    ? "N/A"
                    : profile.hourlyBudget?.max 
                      ? `~$${profile.hourlyBudget.max} - ${profile.hourlyBudget.min}/hr` 
                      : profile.hourlyBudget?.min ? `~$${profile.hourlyBudget.min}+/hr` : "N/A"
                }
                ages={(() => {
                  if (profile.childrenAges && profile.childrenAges.length > 0) return profile.childrenAges;
                  let childrenObj = profile.userId?.noOfChildren;
                  if (typeof childrenObj === 'string') {
                    try { childrenObj = JSON.parse(childrenObj); } catch (e) {}
                  }
                  if (childrenObj && childrenObj.info) {
                    return Object.values(childrenObj.info);
                  }
                  return [];
                })()}
                childrenCount={(() => {
                  if (profile.numberOfChildren !== undefined) return profile.numberOfChildren;
                  let childrenObj = profile.userId?.noOfChildren;
                  if (typeof childrenObj === 'string') {
                    try { childrenObj = JSON.parse(childrenObj); } catch (e) {}
                  }
                  return childrenObj?.length || 0;
                })()}
              />
              ) : (
              <NannyProfile
                key={profile._id}
                id={profile.userId?._id || profile.userId}
                status={profile.status}
                handleMatchRequest={handleMatchRequest}
                userId={profile.userId?._id}
                setIsRequestSubmitModal={setIsRequestSubmitModal}
                setIsMatchRequestDenied={setIsMatchRequestDenied}
                setIsProfileComplete={setIsProfileComplete}
                sharedRate={profile.sharedRate}
                soloRate={profile.soloRate}
                rateType={profile.rateType}
                ages={profile.preferredAges}
                schedule={profile.specificDays}
                careType={profile.careType}
                start={profile.startAvailability}
                goal={profile.userId?.goal}
                img={profile.userId?.imageUrl || profile.imageFile}
                name={profile.userId?.name}
                experience={profile?.careExperience}
                distance={profile?.careDistance}
                location={profile.userId?.location}
                created={profile?.createdAt}
              />
            )})
        ) : (
          <div className="col-span-full text-start text-gray-600">
            <p>No profiles available at the moment. Please check back later.</p>
          </div>
        )}
      </div>

      {/* Ant Design Pagination */}
      <div className="mt-6 w-full flex justify-end">
        {!isLoading && data?.length !== 0 && (
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
