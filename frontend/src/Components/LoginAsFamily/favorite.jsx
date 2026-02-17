import { useDispatch, useSelector } from "react-redux";
import ProfileCard from "../subComponents/profileCard";
import { fetchFavoritesThunk } from "../Redux/favouriteSlice";
import { useEffect, useState } from "react";
import { Pagination } from "antd";
import { NavLink } from "react-router-dom";
import FavouriteCard from "../subComponents/favoriteCard";

export default function Favorites({ nanny }) {
  const { isLoading, data, pagination } = useSelector(
    (state) => state.favouriteData
  );
  const dispatch = useDispatch();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 4; // Set your desired limit per page
  const fetchFavorites = async (page) => {
    const limit = pageSize;

    const dat = await dispatch(fetchFavoritesThunk({ page, limit })).unwrap();
  };

  useEffect(() => {
    fetchFavorites(currentPage); // Fetch favorites when the component mounts or current page changes
  }, [currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page); // Update the current page
  };

  // Calculate the range of items being shown
  const total = pagination ? pagination.totalRecords : 0; // Total number of records
  const startItem = (currentPage - 1) * pageSize + 1; // Start item index
  const endItem = Math.min(currentPage * pageSize, total); // End item index
  return (
    <div className="padding-navbar1 Quicksand min-h-screen">
      <p className="Livvic-SemiBold lg:text-3xl text-2xl mb-8">Favorite</p>
       <div
        className={
          "grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
        }
      >
        {data.length > 0 ? (
          data.map((profile) => (
            <NavLink
              key={profile._id}
              to={
                nanny
                  ? `/nanny/jobDescription/${profile._id}`
                  : `/family/profileNanny/${profile._id}`
              }
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <ProfileCard
                totalRatings={profile?.reviews?.length}
                img={profile.imageUrl}
                averageRating={
                  profile?.reviews?.length
                    ? (
                        profile.reviews.reduce((sum, r) => sum + r.rating, 0) /
                        profile.reviews.length
                      ).toFixed(1)
                    : 0
                }
                time={
                  nanny
                    ? profile?.additionalInfo?.find(
                        (info) => info.key === "preferredSchedule"
                      )?.value?.option
                    : profile?.additionalInfo?.find(
                        (info) => info.key === "avaiForWorking"
                      )?.value?.option || "N/A"
                }
                name={profile.name}
                intro={
                  profile?.additionalInfo.find(
                    (info) => info.key === "jobDescription"
                  )?.value || "N/A"
                }
                loc={profile?.location}
                zipCode={profile?.zipCode}
                hr={
                  nanny
                    ? Object.keys(
                        profile?.additionalInfo.find(
                          (info) => info.key === "noOfChildren"
                        )?.value || {}
                      ).length
                    : 40
                }
                exp={
                  profile?.additionalInfo?.find(
                    (info) => info.key === "experience"
                  )?.value?.option || "N/A"
                }
                rate={profile.rate}
                nanny={nanny}
              />
              {/* <FavouriteCard
                img={v.imageUrl}
                time={
                  v?.additionalInfo?.find(
                    (info) => info.key === "avaiForWorking"
                  )?.value?.option
                    ? v?.additionalInfo?.find(
                        (info) => info.key === "avaiForWorking"
                      )?.value?.option
                    : v?.additionalInfo?.find(
                        (info) => info.key === "preferredSchedule"
                      )?.value?.option || "N/A"
                }
                name={v.name}
                intro={
                  v?.additionalInfo.find(
                    (info) => info.key === "jobDescription"
                  )?.value || "N/A"
                }
                loc={v?.location}
                zipCode={v?.zipCode}
                hr={
                  nanny
                    ? Object.keys(
                        v?.additionalInfo.find(
                          (info) => info.key === "noOfChildren"
                        )?.value || {}
                      ).length
                    : 40
                }
                exp={
                  v?.additionalInfo?.find((info) => info.key === "experience")
                    ?.value?.option || "N/A"
                }
                rate={v.rate}
                nanny={nanny}
              /> */}
            </NavLink>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-600">
            <p>
              No favorites available at the moment. Please check back later.
            </p>
          </div>
        )}
      </div>

      {/* Ant Design Pagination */}
      {pagination && total > 0 && (
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
  );
}
