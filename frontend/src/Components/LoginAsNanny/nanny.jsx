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

  console.log("user", user);

  return (
    <div>
     <VerifyEmailPrompt user={user} />

      {/* Render content only if it's NOT a child route */}
      {!isChildRoute && (
        <div className="padding-navbar1 Quicksand">
          <div className="lg:flex flex-wrap justify-between items-center">
            {/* <p className="lg:my-8 mb-8 font-semibold text-4xl">Find your Perfect Job</p> */}
            {/* <div className="flex justify-end max-lg:mb-4">
              <CustomSelect
                placeholder="Recently Posted"
                options={["1 day ago", "7 days ago", "15 days ago"]}
              />
            </div> */}
          </div>
          <div className="flex items-start max-lg:flex-col gap-y-4">
            <FilterSlidersJobPost
              onLocationChange={handleLocationChange}
              onPriceChange={handlePriceChange}
              onAvailabilityChange={handleAvailabilityChange}
              onCareChange={handleCareChange}
              onServicesChange={handleServicesChange}
              maxChildrenChange={handleMaxAgeChange}
            />

            <div className="relative min-h-[600px] w-full">
              {/* {!isSubscribed ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                  <div className="z-20 bg-white px-8 py-6 rounded-xl text-center w-[90%] max-w-[400px]">
                    <p className="text-2xl text-center Livvic-SemiBold text-primary mb-2 whitespace-break-spaces">
                      Upgrade to see profiles that matches with you
                    </p>
                    <p className="mb-4 text-center text-primary Livvic-Medium text-sm">
                      Upgrade now to see past messages and continue your
                      conversation
                    </p>
                    <CustomButton
                      btnText={"Upgrade Now"}
                      action={() => navigate("pricing")}
                      className="bg-[#D6FB9A] text-[#025747] Livvic-SemiBold text-sm"
                    />
                  </div>
                </div>
              ) : ( */}
              <ProfileList
                location={location}
                priceRange={priceRange}
                availability={availability}
                services={services}
                careOptions={careOptions}
                maxChildren={maxChildren}
              />
              {/* )} */}
            </div>
          </div>
        </div>
      )}
      <Outlet />
    </div>
  );
}
