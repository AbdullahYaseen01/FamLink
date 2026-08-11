import React, { useEffect, useState } from "react";
import CustomButton from "../../Button";
import { NavLink, useNavigate } from "react-router-dom";
import NannyShareBrowseCard from "./NannyShareBrowseCard";
import { Pagination } from "antd";
import { api } from "../../../Config/api";
import { UsersIcon } from "lucide-react";
import WaitlistUI from "./WaitlistUI";

function Browse({ city }) {
  const [shares, setShares] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const pageSize = 6;

  const fetchShares = async (page = 1) => {
    try {
      setLoading(true);

      const res = await api.get(
        `/nannyShare/nanny-share-opportunities/city/${city}?page=${page}&limit=${pageSize}`,
      );

      setShares(res.data.data || []);
      setPagination(res.data.pagination || {});
    } catch (err) {
      console.error("Error fetching nanny shares:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (city) {
      fetchShares(currentPage);
    }
  }, [city, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const total = pagination?.totalRecords || 0;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

  return (
    <div className="container px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:justify-between mt-6 sm:mt-12 gap-4 sm:gap-0">
        <div>
          <h2 className="Livvic-Bold text-4xl sm:text-5xl">
            Browse Nanny Shares <br className="hidden lg:block" />
            near {city}
          </h2>
        </div>

        <div className="sm:self-start">
          <NavLink to="/joinNow">
            <CustomButton
              btnText={"Explore More"}
              className="bg-[#FFADE1] text-[#00333B] w-full sm:w-auto"
            />
          </NavLink>
        </div>
      </div>

      {/* Cards */}
      <div className={` ${!loading && "min-h-screen"} space-y-4`}>
        {city !== "Oakland" ? (
         <WaitlistUI city={city}/>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="relative w-18 h-18 mb-8">
              <svg className="animate-spin w-[72px] h-[72px]" viewBox="0 0 72 72" fill="none">
                {/* <circle cx="36" cy="36" r="30" stroke="#e5e7eb" strokeWidth="4" fill="none"/> */}
                <path d="M36 6 A30 30 0 0 1 66 36" stroke="#FFAEE1" strokeWidth="4" strokeLinecap="round" fill="none" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <UsersIcon className="w-7 h-7" />
              </div>
            </div>
            <p className="text-2xl Livvic-Medium mb-2">Looking for matches</p>
            <p className="text-lg text-gray-500 Livvic mb-8 transition-all" id="loader-sub">
              Searching nanny share opportunities near you…
            </p>
            <div className="flex gap-2 justify-center">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-2 h-2 rounded-full bg-[#FFAEE1] animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
            <p className="text-lg text-gray-400 Livvic mt-8">Please wait, this may take a moment</p>
          </div>
        ) : shares.length > 0 ? (
          shares.map((share) => (
            <NannyShareBrowseCard key={share._id} share={share} />
          ))
        ) : (
          <p className="text-gray-600">
            No nanny share opportunities available in this city.
          </p>
        )}
      </div>

      {/* Pagination */}
      {!loading && shares.length > 0 && city === "oakland" && (
        <div className="flex justify-end mt-6">
          <p
            style={{ color: "#667085" }}
            className="mt-1 mr-4 Livvic-Medium text-sm Quicksand"
          >
            Showing {startItem}-{endItem} from {total}
          </p>

          <Pagination
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

export default Browse;
