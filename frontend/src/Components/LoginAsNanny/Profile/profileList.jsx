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

  return (
    <div className="flex flex-col w-full px-0 lg:px-4 2xl:px-8">
      <div className="flex justify-between flex-wrap">
        <h1 className="Livvic-SemiBold text-3xl">{total} Results</h1>
      </div>
      <div className="flex flex-col gap-4 mt-6">
        {isLoading ? (
          <div className="col-span-full">
            <Loader />
          </div>
        ) : data?.length > 0 ? (
          data.map((profile) => (
            profile.userId?.type === "Parents" ?
              <FamilyProfile
                key={profile._id}
                id={profile._id}
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
              :
              <NannyProfile
                key={profile._id}
                id={profile._id}
                sharedRate={profile.sharedRate}
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
          ))
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
