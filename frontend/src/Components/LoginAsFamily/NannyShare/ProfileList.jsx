import { useEffect, useState } from "react";
import { Pagination } from "antd";
import { NannyProfile, ProfileCard1 } from "../../subComponents/profileCard";
import { NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toCamelCase } from "../../subComponents/toCamelStr";
import {
  convertAgeRanges,
  formatPlacedNannySharedRate,
  formatPlacedNannySoloRate,
} from "../../../Config/helpFunction";
import { fetchAllNanniesShareThunk } from "../../Redux/nannyShareSlice";
import Loader from "../../subComponents/loader";
import NannyShareCard from "../../../NewComponents/NannyShare/Profile/NannyShareCard";
import { viewNannyShareProfileThunk } from "../../Redux/nannyShareSlice";
// ProfileList component
export default function ProfileList({
  nanny,
  location,
  priceRange,
  availability,
  careOptions,
  careTypeOptions,
  services,
  start,
  maxChildren,
  refreshTrigger,
  nannyShare,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const dispatch = useDispatch();
  const { data, pagination, isLoading } = useSelector(
    (state) => state.postNannyShare
  );

  const pageSize = 6;

  useEffect(() => {
    const filters = {
      page: currentPage,
      limit: pageSize,
    };
    if (location > 0) {
      filters.location = location;
    }
    if (careOptions.length > 0) {
      // console.log("care option", careOptions)
      const { min, max } = convertAgeRanges(careOptions);
      // console.log("min Age", min);
      // console.log("max Age", max);
      filters.minAge = min;
      filters.maxAge = max;
    }

    if (careTypeOptions.length > 0) {
      filters.nannyShareTypes = careTypeOptions;
    }
    if (priceRange[0] >= 0 && priceRange[1] >= 0) {
      filters.minRate = priceRange[0];
      filters.maxRate = priceRange[1];
    }
    if (maxChildren) {
      filters.maxChildren = maxChildren;
    }
    dispatch(viewNannyShareProfileThunk(filters));
  }, [dispatch, currentPage, location, careOptions, priceRange, maxChildren, careTypeOptions, refreshTrigger]);
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
    <div className="flex flex-col w-full px-2 lg:px-4 2xl:px-8 mb-12">
      <div className={"flex flex-wrap gap-4 sm:gap-6"}>
        {isLoading ? (
          <Loader />
        ) : data?.length > 0 ? (
          data
            .filter((profile) => profile && profile._id && profile.userId?.nannyProfileCompleted)
            .map((profile, i) => {
              return profile.userId?.type === "Nanny" ? <NannyProfile key={profile._id}
                id={profile.userId?._id || profile.userId}
                sharedRate={profile.hasFamily ? formatPlacedNannySharedRate(profile) : profile.sharedRate}
                soloRate={profile.hasFamily ? formatPlacedNannySoloRate(profile) : profile.soloRate}
                rateType={profile.rateType}
                ages={profile.hasFamily ? profile.childrenAges?.map((age) => age.label) : profile.preferredAges}
                childrenCount={profile.hasFamily ? profile.numberOfChildren : undefined}
                schedule={profile.specificDays}
                careType={profile.careType || profile.currentSchedule}
                hasFamily={profile.hasFamily}
                whereCare={profile.whereCare}
                type={profile.userId?.type}
                goal={profile.userId?.goal}
                img={profile.imageFile}
                name={profile.userId?.name}
                bio={profile?.bio}
                experience={profile?.careExperience}
                distance={profile?.careDistance}
                roles={profile?.responsibilities}
                location={profile.userId?.location}
                created={profile?.createdAt} /> : <></>
            })
        ) : (
          <div className="col-span-full text-start text-gray-600">
            <p>No profiles available at the moment. Please check back later.</p>
          </div>
        )}
      </div>

      {/* Ant Design Pagination */}
      <div>
        {!isLoading && data?.length != 0 && (
          <div className="flex justify-end mt-6 mr-9">
            <p
              style={{ color: "#667085" }}
              className="mt-1 mr-4 Livvic-Medium text-sm Quicksand"
            >
              Showing {startItem}-{endItem} from {total}
            </p>
            <Pagination
              className="Livvic-Bold"
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
