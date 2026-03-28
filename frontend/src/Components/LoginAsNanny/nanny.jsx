import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import FilterSlidersJobPost from "./Profile/filterSlide";
import ProfileList from "./Profile/profileList";
import { getSubscriptionStatusThunk } from "../Redux/cardSlice";
import VerifyEmailPrompt from "../../NewComponents/VerifyEmailDialogBox";

export default function Nanny() {
  const { user } = useSelector((s) => s.auth); // Fetching user from Redux state
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [location, setLocation] = useState(5);
  const [priceRange, setPriceRange] = useState([5, 50]);
  const [availability, setAvailability] = useState([]);
  const [careOptions, setCareOptions] = useState([]);
  const [services, setServices] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleBackdropClick = () => setIsFilterOpen(false);
  // const [start, setStart] = useState([]);
  const [maxChildren, setMaxChildren] = useState(null);

  const subscription = useSelector(
    (state) => state.cardData.subscriptionStatus,
  );
  const isSubscribed = subscription?.active;

  // 🔁 Fetch subscription status on component mount
  useEffect(() => {
    dispatch(getSubscriptionStatusThunk());
  }, [dispatch]);

  const handleLocationChange = (value) => {
    setLocation(value);
  };

  const handlePriceChange = (value) => {
    setPriceRange(value);
  };

  const handleAvailabilityChange = (value) => {
    setAvailability(value);
  };

  // const handleStartChange = (value) => {
  //   setStart(value);
  // };

  const handleMaxAgeChange = (value) => {
    setMaxChildren(value);
  };
  const handleCareChange = (value) => {
    setCareOptions(value);
  };

  const handleServicesChange = (value) => {
    setServices(value);
  };

  // Check if the current path is a child route
  const isChildRoute = pathname.includes("/nanny/");


  return (
    <div>
      <VerifyEmailPrompt user={user} />

      {/* Render content only if it's NOT a child route */}
      {!isChildRoute && (
        <div className="padding-navbar1 Quicksand">
          <div className="lg:flex flex-wrap justify-between items-center"></div>

          {/* Mobile Filter Toggle Button */}
          <div className="lg:hidden flex justify-end mb-3">
            <button
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-2 bg-white border border-[#AEC4FF] text-primary font-semibold py-2 px-4 rounded-full shadow-sm transition hover:bg-[#AEC4FF]/20"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="11" y1="18" x2="13" y2="18" />
              </svg>
              Filters
            </button>
          </div>

          {/* Mobile Filter Drawer Backdrop */}
          {isFilterOpen && (
            <div
              className="fixed inset-0 bg-black/40 z-30 lg:hidden"
              onClick={handleBackdropClick}
            />
          )}

          <div className="flex items-start max-lg:flex-col gap-y-4">
            {/* Filter Drawer */}
            <div
              className={`
        fixed top-0 left-0 h-full z-40 bg-white shadow-xl overflow-y-auto
        transition-transform duration-300 ease-in-out w-[85vw] max-w-xs p-4
        lg:static lg:h-auto lg:shadow-none lg:z-auto lg:bg-transparent lg:overflow-visible
        lg:w-auto lg:max-w-none lg:p-0 lg:translate-x-0
        ${isFilterOpen ? "translate-x-0" : "-translate-x-full"}
      `}
            >
              {/* Drawer Header (mobile only) */}
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <span className="font-bold text-lg Livvic-SemiBold text-primary">
                  Filters
                </span>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100 transition"
                  aria-label="Close filters"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-gray-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <FilterSlidersJobPost
                onLocationChange={handleLocationChange}
                onPriceChange={handlePriceChange}
                onAvailabilityChange={handleAvailabilityChange}
                onCareChange={handleCareChange}
                onServicesChange={handleServicesChange}
                maxChildrenChange={handleMaxAgeChange}
              />
            </div>

            <div className="relative min-h-[600px] w-full">
              <ProfileList
                location={location}
                priceRange={priceRange}
                availability={availability}
                services={services}
                careOptions={careOptions}
                maxChildren={maxChildren}
              />
            </div>
          </div>
        </div>
      )}
      <Outlet />
    </div>
  );
}
