import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import FilterSlidersNannyShare from "./NannyShare/FilterSlide";
import ProfileList from "./NannyShare/ProfileList";
import { useNavigate } from "react-router-dom";
import { getSubscriptionStatusThunk } from "../Redux/cardSlice";
import { postNannyShare } from "../Redux/nannyShareSlice"; // 👈 import your thunk
import { fireToastMessage } from "../../toastContainer";
import { editUserThunk } from "../Redux/authSlice";
import VerifyEmailPrompt from "../../NewComponents/VerifyEmailDialogBox";

export default function NannyShareComponent() {
  const { user } = useSelector((s) => s.auth);
    const { pathname } = useLocation();
  const budgetRange = user?.additionalInfo
    .find((info) => info.key === "totalBudget")
    ?.value.option.split("to")
    .map((value) => parseFloat(value.trim()));

  const [location, setLocation] = useState(5);
  const [maxChildren, setMaxChildren] = useState(null);
  const [priceRange, setPriceRange] = useState(
    budgetRange ? [0, budgetRange[1]] : [0, 100]
  );
  const [availability, setAvailability] = useState([]);
  const [careOptions, setCareOptions] = useState([]);
  const [careTypeOptions, setCareTypeOptions] = useState([]);
  const [services, setServices] = useState([]);
  const [start, setStart] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [hasPostedFromSheet, setHasPostedFromSheet] = useState(false);

  // 👇 New state for sheet-based auto-post
  const [sheetUserData, setSheetUserData] = useState(null);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const subscription = useSelector(
    (state) => state.cardData.subscriptionStatus
  );
  const isSubscribed = subscription?.active;

  useEffect(() => {
    dispatch(getSubscriptionStatusThunk());
  }, [dispatch]);

  // 👇 Retrieve sheet record on mount if id is present
  useEffect(() => {
    const retrieveSheetRecord = async () => {
      if (!user.sheetId && !user.hasSubmittedSheetResponse) return;

      const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
      if (!scriptUrl) {
        fireToastMessage({ type: "error", message: "Google Script URL is missing." });
        return;
      }

      try {
        setSheetLoading(true);
        const response = await fetch(
          `${scriptUrl}?recordId=${encodeURIComponent(user.sheetId)}`
        );
        const result = await response.json();
        if (result.status === "success" && result.record) {
          const details = result.record["Details"]; // 👈 Details is inside result.record
          setSheetUserData(JSON.parse(details));
        } else {
          fireToastMessage({
            type: "error",
            message: result.message || "Could not load saved data",
          });
        }
      } catch (error) {
        console.error("Sheet retrieval error:", error);
        fireToastMessage({ type: "error", message: "Failed to load record." });
      } finally {
        setSheetLoading(false);
      }
    };

    retrieveSheetRecord();
  }, [user.hasSubmittedSheetResponse, user.sheetId]);

  // 👇 Auto-post handler using sheetUserData
  const handlePostFromSheet = async () => {
    if (!sheetUserData) {
      fireToastMessage({ type: "error", message: "No sheet data loaded yet." });
      return;
    }

    const formData = new FormData();
    try {
      setIsPosting(true);

      // sheetUserData is already a flat object from the spreadsheet,
      // matching the shape your postNannyShare thunk expects.
      const { data } = await dispatch(
        postNannyShare({ ...sheetUserData })
      ).unwrap();

      fireToastMessage({ success: true, message: data.message });
      formData.append("hasSubmittedSheetResponse", true);
      const { status, user } = await dispatch(editUserThunk(formData)).unwrap();
      // 👇 hide button after successful post
      setHasPostedFromSheet(true);
      // 👇 trigger ProfileList re-fetch
      setRefreshTrigger((prev) => prev + 1);
      navigate("/family/nannyShare");
    } catch (err) {
      fireToastMessage({ type: "error", message: err.message });
    } finally {
      setIsPosting(false);
    }
  };

  const handleBackdropClick = () => setIsFilterOpen(false);
  const handleLocationChange = (value) => setLocation(value);
  const handlePriceChange = (value) => setPriceRange(value);
  const handleCareChange = (value) => setCareOptions(value);
  const handleCareTypeChange = (value) => setCareTypeOptions(value);
  const handleMaxAgeChange = (value) => setMaxChildren(value);

    // Check if the current path is a child route
  const isChildRoute = pathname.includes("/family/");
  return (
    <div className="relative">
      <VerifyEmailPrompt/>
      {!isChildRoute && (
        <div className="padding-navbar1 Quicksand">
          {/* Header Card */}
          <div className="lg:my-8 my-4 flex flex-col justify-center items-center lg:p-8 p-6 bg-white rounded-3xl">
            <p className="font-bold lg:text-4xl text-2xl Livvic-SemiBold">
              Post a Nanny Share
            </p>
            <p className="text-center lg:text-lg lg:mt-6 lg:mb-8 mt-3 mb-4 leading-5 text-[#555555]">
              Looking for another family to share a nanny with? Post your nanny
              share listing to
              <br className="max-lg:hidden" />
              connect with like-minded families and create the perfect childcare
              arrangement.
            </p>

            {/* 👇 Button row */}
            <div className="flex flex-wrap justify-center gap-3">
              <NavLink
                to={"/family/post-a-nannyShare"}
                className="bg-[#AEC4FF] Livvic-SemiBold text-primary py-2 px-4 border-none rounded-full font-normal lg:text-lg transition duration-700 delay-150 ease-in-out"
              >
                Post a Nanny Share
              </NavLink>

              {/* 👇 New button — only shown if a sheet id is in the user */}
              {user.sheetId && !user.hasSubmittedSheetResponse && !hasPostedFromSheet && (
                <div className="flex flex-col items-start gap-3">
                  {sheetLoading ? (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl">
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <p className="Livvic-SemiBold text-sm lg:text-base text-[#1F2937] mb-0">
                        Loading your responses...
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={handlePostFromSheet}
                      disabled={isPosting || sheetLoading || !sheetUserData}
                      className={`${!isPosting && "border border-[#777777]"} Livvic-SemiBold text-primary py-2 px-4 rounded-full font-normal lg:text-lg flex items-center gap-4`}
                    >
                      {isPosting && (
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      )}

                      <span className=" Livvic-SemiBold text-primary lg:text-lg">{isPosting ? "Posting..." : "Post Based on Responses"}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

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

          {/* Main Content Row */}
          <div className="flex items-start max-lg:flex-col gap-y-4">
            <div
              className={`
              fixed top-0 left-0 h-full z-40 bg-white shadow-xl overflow-y-auto
              transition-transform duration-300 ease-in-out w-[85vw] max-w-xs p-4
              lg:static lg:h-auto lg:shadow-none lg:z-auto lg:bg-transparent lg:overflow-visible
              lg:w-auto lg:max-w-none lg:p-0 lg:translate-x-0
              ${isFilterOpen ? "translate-x-0" : "-translate-x-full"}
            `}
            >
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

              <FilterSlidersNannyShare
                onLocationChange={handleLocationChange}
                onPriceChange={handlePriceChange}
                onCareChange={handleCareChange}
                onCareTypeChange={handleCareTypeChange}
                maxChildrenChange={handleMaxAgeChange}
              />
            </div>

            <ProfileList
              maxChildren={maxChildren}
              refreshTrigger={refreshTrigger}
              location={location}
              priceRange={priceRange}
              careOptions={careOptions}
              careTypeOptions={careTypeOptions}
            />
          </div>
        </div>)}
      <Outlet />
    </div>
  );
}