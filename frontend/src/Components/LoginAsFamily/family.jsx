import { Outlet, useLocation } from "react-router-dom";
import FilterSliders from "../subComponents/filter";
import ProfileList from "./subcomponents/paginationforprofileData";
import s1 from "../../assets/images/s1.png";
import FrequentAskQuestion from "../subComponents/frequentAskQues";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { CustomSelect } from "../subComponents/customSelect";
import CustomButton from "../../NewComponents/Button";
import { useNavigate } from "react-router-dom";
import { getSubscriptionStatusThunk } from "../Redux/cardSlice";

export default function Family() {
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((s) => s.auth);
  const isLoading = useSelector((state) => state.nannyData);
  const budgetRange = user?.additionalInfo
    .find((info) => info.key === "totalBudget")
    ?.value.option.split("to")
    .map((value) => parseFloat(value.trim()));

  const [location, setLocation] = useState(5);
  const [priceRange, setPriceRange] = useState(
    budgetRange ? (budgetRange ? [0, budgetRange[1]] : [0, 100]) : [0, 100]
  );
  const [availability, setAvailability] = useState([]);
  const [careOptions, setCareOptions] = useState([]);
  const [services, setServices] = useState([]);
  const [start, setStart] = useState([]);
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

  const handleAvailabilityChange = (value) => {
    setAvailability(value);
  };

  const handleCareChange = (value) => {
    setCareOptions(value);
  };

  const handleStartChange = (value) => {
    setStart(value);
  };

  const handleServicesChange = (value) => {
    setServices(value);
  };

  // Check if the current path is a child route
  const isChildRoute = pathname.includes("/family/");
  const faq = [
    {
      question:
        "Is Famlink only for finding nannies, or can I hire other types of caregivers?",
      answer:
        "Famlink helps families connect with a variety of caregivers, including private educators, swim instructors, music teachers, and household managers.Whether you need a full- time nanny, a part - time tutor, or a weekend babysitter, you can find the right fit for your needs.",
    },
    {
      question:
        "Can I hire a caregiver who also teaches my child a skill, like a second language or piano?",
      answer:
        "Absolutely! Many caregivers on Famlink offer additional skills beyond childcare. You can specify your preferences when posting a job or searching for candidates.",
    },
    {
      question: " Can I see caregiver rates before messaging them?",
      answer:
        "Yes! Caregiver profiles display their hourly rates, availability, and any additional services they offer, helping you make an informed decision before reaching out.",
    },
    {
      question:
        "What happens if I hire someone and later decide they’re not the right fit? ",
      answer:
        "If you need to make a change, Famlink allows you to keep your job posting active and find a new caregiver easily. We also provide contract templates to help set clear expectations upfront.",
    },
  ];
  return (
    <div className="w-full">
      {/* Render content only if it's NOT a child route */}
      {!isChildRoute && (
        <div className="padding-navbar1 Quicksand w-full">
          <div className="lg:flex flex-wrap justify-between items-center">
            {/* <div className="flex justify-end max-lg:mb-4">
              <CustomSelect
                placeholder="Recently Posted"
                options={["1 day ago", "7 days ago", "15 days ago"]}
              />
            </div> */}
          </div>
          <div className="flex items-start max-lg:flex-col gap-y-4 w-full">
            <FilterSliders
              onLocationChange={handleLocationChange}
              onPriceChange={handlePriceChange}
              onAvailabilityChange={handleAvailabilityChange}
              onCareChange={handleCareChange}
              onServicesChange={handleServicesChange}
              onStartChange={handleStartChange}
            />
            <div className="relative min-h-[600px] w-full">
              {(!isSubscribed || !isLoading) && (
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
              )}

              <ProfileList
                location={location}
                priceRange={priceRange}
                availability={availability}
                services={services}
                careOptions={careOptions}
              />
            </div>
          </div>
        </div>
      )}
      <Outlet />
    </div>
  );
}
