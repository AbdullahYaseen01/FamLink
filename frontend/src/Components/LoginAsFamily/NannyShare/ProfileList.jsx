import { useEffect, useState } from "react";
import { Pagination } from "antd";
import { ProfileCard1 } from "../../subComponents/profileCard";
import { NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toCamelCase } from "../../subComponents/toCamelStr";
import { convertAgeRanges } from "../../../Config/helpFunction";
import { fetchAllNanniesShareThunk } from "../../Redux/nannyShareSlice";
import Loader from "../../subComponents/loader";
// ProfileList component
export default function ProfileList({
  nanny,
  location,
  priceRange,
  availability,
  careOptions,
  services,
  start,
  maxChildren,
  nannyShare,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const dispatch = useDispatch();
  const { data, pagination, isLoading } = useSelector(
    (state) => state.postNannyShare
  );

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
      // console.log("care option", careOptions)
      const { min, max } = convertAgeRanges(careOptions);
      // console.log("min Age", min);
      // console.log("max Age", max);
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
    dispatch(fetchAllNanniesShareThunk(filters));
  }, [dispatch, currentPage, location, careOptions, priceRange, maxChildren]);
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

  console.log("Nanny Share:", data);

  return (
    <div className="flex flex-col w-full px-0 lg:px-4 2xl:px-8">
      <div
        className={
          "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-4"
        }
      >
        {isLoading ? (
          <Loader />
        ) : data?.length > 0 ? (
          data
            .filter((profile) => profile && profile._id)
            .map((profile) => {
              console.log("Rendering profile with ID:", profile._id);
              return (
                <NavLink
                  key={profile._id}
                  to={`/family/nannyShareView/${profile._id}`}
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                >
                  <ProfileCard1
                    id={profile._id}
                    img={profile.user?.imageUrl}
                    name={profile.user?.name}
                    intro={profile?.jobDescription || "N/A"}
                    loc={profile?.user?.location}
                    zipCode={profile?.user?.zipCode}
                    hr={profile?.noOfChildren?.length}
                    nannyShareView={true}
                    created={profile?.createdAt}
                  />
                </NavLink>
              );
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
          <div className="flex justify-end mt-6">
            <p
              style={{ color: "#667085" }}
              className="mt-1 mr-4 font-medium text-sm Quicksand"
            >
              Showing {startItem}-{endItem} from {total}
            </p>
            <Pagination
              className="font-bold"
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
