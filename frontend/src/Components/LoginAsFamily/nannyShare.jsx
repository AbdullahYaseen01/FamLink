import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState , useEffect} from "react";
import { useSelector , useDispatch} from "react-redux";
import FilterSlidersNannyShare from "./NannyShare/FilterSlide";
import ProfileList from "./NannyShare/ProfileList";
import { useNavigate } from "react-router-dom";
import { getSubscriptionStatusThunk } from "../Redux/cardSlice";

export default function NannyShareComponent() {

  const { user } = useSelector((s) => s.auth);
  const budgetRange = user?.additionalInfo
    .find((info) => info.key === "totalBudget")
    ?.value.option.split("to")
    .map((value) => parseFloat(value.trim()));

  const [location, setLocation] = useState(5);
  const [maxChildren, setMaxChildren] = useState(null);
  const [priceRange, setPriceRange] = useState(
    budgetRange ? (budgetRange ? [0, budgetRange[1]] : [0, 100]) : [0, 100]
  );
  const [availability, setAvailability] = useState([]);
  const [careOptions, setCareOptions] = useState([]);
  const [services, setServices] = useState([]);
  const [start, setStart] = useState([]);
    const dispatch = useDispatch();
    const navigate = useNavigate();
  
    const subscription = useSelector(
      (state) => state.cardData.subscriptionStatus
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

  // const handleAvailabilityChange = (value) => {
  //   setAvailability(value);
  // };

  const handleCareChange = (value) => {
    setCareOptions(value);
  };

  // const handleStartChange = (value) => {
  //   setStart(value);
  // };

  // const handleServicesChange = (value) => {
  //   setServices(value);
  // };

  
  const handleMaxAgeChange = (value) => {
    setMaxChildren(value);
  };

  // Check if the current path is a child route
  return (
    <div className="relative">
      {!isSubscribed && (
        <div className="absolute top-0 left-0 w-full h-full backdrop-blur-[4px] bg-white/50 z-20 flex items-center justify-center rounded-xl">
             <div className="bg-white shadow-xl rounded-2xl p-8 w-[90%] max-w-md text-center">
            <h2 className="text-2xl font-semibold text-[#050A30] mb-3">
              Subscribe to Unlock
            </h2>
            <p className="text-gray-600 mb-6">
              Join Premium to Match with Families for Nanny Share.
            </p>
            <button
              onClick={() => navigate("/family/pricing")}
              className="bg-[#38AEE3] hover:opacity-90 text-white font-medium py-2 px-6 rounded-full transition-all"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}
      {/* Render content only if it's NOT a child route */}
      {(
        <div className="padding-navbar1 Quicksand">

          <div className="lg:my-8 my-4 flex flex-col justify-center items-center lg:p-8 p-6 bg-white rounded-3xl">
            <p className="font-bold lg:text-4xl text-2xl Livvic-SemiBold">Post a Nanny Share</p>
            <p className="text-center lg:text-lg lg:mt-6 lg:mb-8 mt-3 mb-4 leading-5 text-[#555555]">Looking for another family to share a nanny with? Post your nanny share listing to<br className="max-lg:hidden" />connect with like-minded families and create the perfect childcare arrangement.</p>
            <NavLink
              to={'/family/post-a-nannyShare'}
              className=" bg-[#AEC4FF] Livvic-SemiBold text-primary py-2 px-4  border-none rounded-full font-normal lg:text-lg transition hover:-translate-y-1 duration-700 delay-150 ease-in-out hover:scale-110"
            >
              Post a Nanny Share
            </NavLink>
          </div>
          <div className="flex items-start max-lg:flex-col gap-y-4">
            <FilterSlidersNannyShare
              onLocationChange={handleLocationChange}
              onPriceChange={handlePriceChange}
              // onAvailabilityChange={handleAvailabilityChange}
              onCareChange={handleCareChange}
              maxChildrenChange={handleMaxAgeChange}
              // onServicesChange={handleServicesChange}
              // onStartChange={handleStartChange}
            />
            <ProfileList
              maxChildren={maxChildren}
              location={location}
              priceRange={priceRange}
              // availability={availability}
              // services={services}
              careOptions={careOptions}
         
            />
          </div>
        </div>
      )}
    </div>
  );
}
