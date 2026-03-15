import React, { useEffect, useState } from "react";
import CustomButton from "../../Button";
import { NavLink } from "react-router-dom";
import NannyShareBrowseCard from "./NannyShareBrowseCard";
import { Pagination } from "antd";
import { api } from "../../../Config/api";

function Browse({ city }) {
  const [shares, setShares] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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

  console.log("Shares", shares)

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
          <h1 className="Livvic-Bold text-4xl sm:text-5xl">
            Browse Nanny Shares <br className="hidden lg:block" />
            near {city}
          </h1>
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
      <div className="mt-12 min-h-screen space-y-4">
        {loading ? (
          <p>Loading...</p>
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
      {!loading && shares.length > 0 && (
        <div className="flex justify-end mt-6">
          <p
            style={{ color: "#667085" }}
            className="mt-1 mr-4 font-medium text-sm Quicksand"
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
