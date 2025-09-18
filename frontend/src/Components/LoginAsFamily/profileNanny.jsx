import { useRef } from "react";
import {
  HeartOutlined,
  CheckOutlined,
  HeartFilled,
  CloseOutlined,
} from "@ant-design/icons";
import Ra from "../subComponents/rate";
import Prog from "./subcomponents/progress";
import Reviews from "./subcomponents/Reviews";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchNannyByIdThunk } from "../Redux/nannyData";
import { useCallback, useEffect, useState } from "react";
import Avatar from "react-avatar";
import { customFormat } from "../subComponents/toCamelStr";
import { addOrRemoveFavouriteThunk } from "../Redux/favouriteSlice";
import { refreshTokenThunk } from "../Redux/authSlice";
import {
  requestThunk,
  statusThunk,
  withDrawThunk,
} from "../Redux/bookHireSlice";
import { fireToastMessage } from "../../toastContainer";
import { fetchOtherReqThunk } from "../Redux/fetchOtherReq";
import { SwalFireDelete, SwalFireSuccess } from "../../swalFire";
import { createChatThunk } from "../Redux/chatSlice";
import { getSubscriptionStatusThunk } from "../Redux/cardSlice";
import { NavLink } from "react-router-dom";
import Button from "../../NewComponents/Button";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import CustomButton from "../../NewComponents/Button";

export default function ProfileNanny() {
  const { id } = useParams();
  const [status, setStatus] = useState();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const scrollRef = useRef(null);
  const subscription = useSelector(
    (state) => state.cardData.subscriptionStatus
  );
  const isSubscribed = subscription?.active;

  // 🔁 Fetch subscription status on component mount
  useEffect(() => {
    dispatch(getSubscriptionStatusThunk());
  }, [dispatch]);
  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        try {
          await dispatch(fetchNannyByIdThunk(id));
        } catch (error) {
          console.error("Error fetching nanny data:", error);
        }
      }
    };

    fetchData();
  }, [dispatch, id]);
  const { selectedNanny } = useSelector((s) => s.nannyData);
  const { user } = useSelector((s) => s.auth);

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const specificDaysAndTime = selectedNanny?.additionalInfo?.find(
    (info) => info.key === "specificDaysAndTime"
  )?.value;

  // Initialize state with `specificDaysAndTime` or empty times as `null`
  const [daysState, setDaysState] = useState(() => {
    return daysOfWeek.reduce((acc, day) => {
      const specificDay = specificDaysAndTime?.[day];
      acc[day] = {
        checked: !!specificDay,
        start: specificDay?.start || null, // Null if no start time exists
        end: specificDay?.end || null, // Null if no end time exists
      };
      return acc;
    }, {});
  });

  const isFavorited = user.favourite?.includes(id);
  const [buttonText, setButtonText] = useState("Book Now");
  const fetchStatus = useCallback(async () => {
    try {
      // Dispatch the thunk and unwrap the result
      const { data } = await dispatch(statusThunk({ nannyId: id })).unwrap();
      const fetchedStatus = data?.bookings;
      setStatus(fetchedStatus);

      // Set buttonText based on the fetched status
      if (fetchedStatus && fetchedStatus.length > 0) {
        const currentStatus = fetchedStatus[0];
        let newButtonText = "Book Now";

        if (currentStatus.status === "pending") {
          newButtonText =
            currentStatus.userRole === "requester"
              ? "With draw"
              : "Accept Request";
        } else if (currentStatus.status === "accepted") {
          newButtonText = "Cancel Booking";
        }
        // else if (currentStatus.status === 'completed' && !currentStatus?.booking?.isPaid) {
        //     newButtonText = 'Payment is due';
        // }
        // else if (currentStatus.status === 'completed' && !currentStatus?.booking?.nannyReview) {
        //     newButtonText = 'Waiting for review';
        // }
        else if (
          currentStatus.status === "completed" &&
          !currentStatus?.booking?.familyReview
        ) {
          newButtonText = "Give review";
        }
        setButtonText(newButtonText);
      } else {
        setButtonText("Book Now"); // Default text if no status
      }
    } catch (error) {
      setStatus(null);
      setButtonText("Book Now"); // Set default on error
    }
  }, [dispatch, id]); // Only recreate `fetchStatus` when `dispatch` or `id` change

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (!selectedNanny) {
    return <div>Loading...</div>; // You can customize this loading message or spinner
  }

  console.log(selectedNanny);

  const favourite = async () => {
    await dispatch(addOrRemoveFavouriteThunk({ favouriteUserId: id }));
    await dispatch(refreshTokenThunk());
  };

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const formatLocation = () => {
    if (!selectedNanny?.zipCode || !selectedNanny?.location?.format_location)
      return "";
    const parts = selectedNanny?.location?.format_location.split(",") || [];
    const city = parts.at(-3)?.trim();
    const state = parts.at(-2)?.trim().split(" ")[0];
    return city && state ? `${city}, ${state}` : "";
  };

  const handleMessage = async () => {
    try {
      const participants = [id, user._id];
      const { data, status } = await dispatch(
        createChatThunk({ participants })
      ).unwrap();
      if (status == 201 || status == 200) {
        navigate(`/family/message/`);
      }
    } catch (error) {
      fireToastMessage({ type: "error", message: error.message });
    }
  };

  const ratingCount = selectedNanny?.reviews?.reduce((acc, review) => {
    const rating = Math.floor(review.rating);
    acc[rating] = (acc[rating] || 0) + 1;
    return acc;
  }, {});

  const totalReviews = selectedNanny?.reviews?.length || 0;

  const ratingPercentages = [5, 4, 3, 2, 1].map((num) => {
    const count = ratingCount?.[num] || 0;
    const pro = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    return { num, pro };
  });

  const scrollAmount = 300; // adjust scroll distance as needed

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 md:gap-6 p-3 md:py-6 md:px-12  w-full justify-center">
      {/* Left Sidebar */}
      <div className="w-full lg:w-1/4 xl:w-1/3 2xl:w-1/4">
        {/* Profile Card */}
        <div className="shadow-soft p-4 md:p-6 lg:p-9 rounded-[20px]">
          <div
            onClick={favourite}
            className="flex justify-end items-center gap-x-1 cursor-pointer"
          >
            {" "}
            {isFavorited ? (
              <HeartFilled className="text-tertiary" />
            ) : (
              <Heart className="text-tertiary" height={20} width={20} />
            )}
          </div>
          <div className="flex flex-col items-center">
            {selectedNanny?.imageUrl ? (
              <img
                className="mx-auto rounded-[16px] w-20 md:w-24 object-contain"
                src={selectedNanny?.imageUrl}
                alt="img"
              />
            ) : (
              <Avatar
                className="rounded-[16px] text-black"
                size="96"
                color={"#38AEE3"}
                name={selectedNanny?.name
                  ?.split(" ") // Split by space
                  .slice(0, 2) // Take first 1–2 words
                  .join(" ")}
              />
            )}

            <div className="flex gap-2">
              <p className="my-2 text-primary Livvic-SemiBold text-xl md:text-2xl text-center flex gap-2">
                {selectedNanny?.name} <img src="/shield.svg" alt="" />
              </p>
            </div>
            {selectedNanny?.location?.format_location && (
              <p className="text-[#555555] text-center text-sm md:text-md Livvic-Medium">
                {formatLocation()}
              </p>
            )}
            <div className="flex gap-2 justify-center mt-2 w-full mb-4">
              <div className="p-4 border border-[#EEEEEE] rounded-[20px] w-[45%]">
                <p className="Livvic-Medium text-xs text-[#555555]">
                  Work Experience
                </p>
                <p className="Livvic-Bold text-lg text-[#001243]">
                  {
                    selectedNanny.additionalInfo?.find(
                      (info) => info.key === "experience"
                    )?.value?.option
                  }
                </p>
              </div>
              <div className="p-4 border border-[#EEEEEE] rounded-[20px] w-[45%]">
                <p className="Livvic-Medium text-xs text-[#555555]">Rate</p>
                <p className="Livvic-Bold text-lg text-[#001243]">
                  {(() => {
                    const salary = selectedNanny.additionalInfo?.find(
                      (info) => info.key === "salaryRange"
                    )?.value;

                    if (!salary?.min) return null; // Nothing to show if no min

                    return salary.max
                      ? `$${salary.min} - ${salary.max}/h`
                      : `$${salary.min}/h+`;
                  })()}
                </p>
              </div>
            </div>
            <Ra points={selectedNanny.averageRating} size={20} />
            <div className="mt-4 md:mt-6 w-full">
              {" "}
              <Button
                action={() => handleMessage()}
                btnText={`Message ${selectedNanny?.name}`}
                className="bg-primary w-full py-2 text-sm md:text-base"
              />
            </div>
          </div>
        </div>

        {/* Additional Info Card */}
        <div className="mt-4 md:mt-6 p-4 md:p-6 shadow-soft rounded-[20px]">
          {/* <div>
            <p className="Livvic-SemiBold text-base md:text-lg text-primary">
              Education
            </p>
            <ul className="list-disc pl-4 md:pl-6 space-y-2 mt-2">
              <li className="text-[#888888] text-sm md:text-base">
                <span className="text-[#555555] Livvic-Medium">
                  B.A. in Early Childhood Education –
                </span>
                <br /> University of Washington, 2020
              </li>
              <li className="text-[#888888] text-sm md:text-base">
                <span className="text-[#555555] Livvic-Medium">
                  Child Development Associate (CDA) Credential –
                </span>
                <br /> Council for Professional Recognition, 2021
              </li>
            </ul>
          </div>
          <hr className="my-4" /> */}
          <div>
            <p className="Livvic-SemiBold text-base md:text-lg text-primary">
              Language
            </p>
            <div className="mt-2">
              <p className="text-[#555555] Livvic-Medium text-sm md:text-base">
                {selectedNanny.additionalInfo
                  .find((info) => info.key === "language")
                  ?.value?.option?.map(
                    (lang) =>
                      lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase()
                  )
                  .join(", ")}
              </p>
            </div>
          </div>
          <hr className="my-4" />
          <div>
            <p className="Livvic-SemiBold text-base md:text-lg text-primary">
              Additional Details
            </p>
            <div className="mt-2">
              <ul className="list-disc pl-4 md:pl-6 space-y-2">
                {selectedNanny.additionalInfo
                  .find((info) => info.key === "additionalDetails")
                  ?.value?.option?.map((det, i) => (
                    <li
                      key={i}
                      className="text-[#555555] Livvic-Medium text-sm md:text-base"
                    >
                      {det.charAt(0).toUpperCase() +
                        det.slice(1, det.length - 1)}
                    </li>
                  ))}
                {/*               
                <li className="text-[#555555] Livvic-Medium text-sm md:text-base">
                  Does not smoke
                </li> */}
              </ul>
            </div>
          </div>
          <hr className="my-4" />
          <div>
            <p className="Livvic-SemiBold text-base md:text-lg text-primary">
              Verifications
            </p>
            <div className="mt-2 w-full">
              <ul className="space-y-2 w-full">
                <li className="flex gap-2 justify-between text-primary Livvic-SemiBold text-xs md:text-sm w-full onboarding-box">
                  <span className="text-primary Livvic-SemiBold text-sm">
                    Background Check
                  </span>
                  {selectedNanny?.verified?.nationalIDVer === "true"  && (
                    <img src="/check-circle.svg" alt="verified" />
                  )}
                </li>
                <li className="flex gap-2 justify-between text-primary Livvic-SemiBold text-xs md:text-sm w-full onboarding-box">
                  <span className="text-primary Livvic-SemiBold text-sm">
                    Phone Number Verification
                  </span>
                  {/* {user?.verified.phoneNumber !== "false" && <img src="/check-circle.svg" alt="verified" />} */}
                </li>
                <li className="flex gap-2 justify-between text-primary Livvic-SemiBold text-xs md:text-sm w-full onboarding-box">
                  <span className="text-primary Livvic-SemiBold text-sm">
                    National ID
                  </span>
                  {selectedNanny?.verified?.nationalIDVer === "true" && (
                    <img src="/check-circle.svg" alt="verified" />
                  )}
                </li>
                <li className="flex gap-2 justify-between text-primary Livvic-SemiBold text-xs md:text-sm w-full onboarding-box">
                  <span className="text-primary Livvic-SemiBold text-sm">
                    Passport
                  </span>
                  {/* <img src="/check-circle.svg" alt="verified" /> */}
                </li>
                <li className="flex gap-2 justify-between text-primary Livvic-SemiBold text-xs md:text-sm w-full onboarding-box">
                  <span className="text-primary Livvic-SemiBold text-sm">
                    Driving License
                  </span>
                  {/* <img src="/check-circle.svg" alt="verified" /> */}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative w-full lg:w-2/3 xl:w-2/3 2xl:w-1/2 space-y-4 md:space-y-6">
        {!isSubscribed && (
          <>
            <div className="absolute inset-0 z-10 backdrop-blur-sm bg-white/50  w-full h-full" />
            <div className="absolute z-20 top-[20%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-8 py-6 rounded-xl text-center w-[400px]">
              <img src="/nanny-profile.svg" alt="message" className="mx-auto mb-2" />
              <p className="text-2xl text-center Livvic-SemiBold text-primary mb-2 whitespace-break-spaces">
                Upgrade to see {selectedNanny?.name}’s profile informations
              </p>
              <p className="mb-4 text-center text-primary Livvic-Medium text-sm">
                Upgrade now to see past messages and continue your conversation
              </p>
              <CustomButton
                btnText={"Upgrade Now"}
                action={() => navigate("../pricing")}
                className="bg-[#D6FB9A] text-[#025747] Livvic-SemiBold text-sm"
              />
            </div>
          </>
        )}
        {/* About Me Section */}
        <div className="shadow-soft p-4 md:p-6 rounded-[20px]">
          <p className="Livvic-SemiBold text-base md:text-lg text-primary">
            About {selectedNanny.name}
          </p>
          <p className="Livvic text-sm md:text-md text-[#555555] mt-2">
            {
              selectedNanny.additionalInfo.find(
                (info) => info.key === "jobDescription"
              )?.value
            }
          </p>
          <hr className="my-4" />
          <p className="Livvic-SemiBold text-base md:text-lg text-primary">
            Work Experience -{" "}
            {
              selectedNanny.additionalInfo.find(
                (info) => info.key === "experience"
              )?.value?.option
            }
          </p>
          <ul className="mt-2 space-y-2">
            {selectedNanny.additionalInfo
              .find((info) => info.key === "ageGroupsExp")
              ?.value?.option.map((v, i) => (
                <p
                  key={i}
                  className="Livvic-Medium text-sm md:text-md text-[#555555]"
                >
                  <span className="Livvic-Medium text-sm md:text-md text-[#555555]">
                    {customFormat(v).split(" ")[0]}
                  </span>{" "}
                  {customFormat(v).split(" ").slice(1).join(" ")}
                </p>
              ))}
          </ul>
        </div>

        <div className="flex flex-col lg:flex-row w-full gap-4">
          <div className="shadow-soft p-4 md:p-6 rounded-[20px] lg:w-[49%] w-full">
            <p className="Livvic-SemiBold text-base md:text-lg text-primary">
              Weekly Schedule
            </p>
            <ul className="mt-2 space-y-2">
              {(() => {
                const specificDays = selectedNanny.additionalInfo?.find(
                  (info) => info.key === "specificDaysAndTime"
                )?.value;

                if (!specificDays) return null;

                return Object.entries(specificDays).map(([day, data]) => {
                  if (!data?.checked) return null;

                  const start = new Date(data.start).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  });

                  const end = new Date(data.end).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  });

                  return (
                    <li key={day}>
                      <p className="Livvic-SemiBold text-sm md:text-md text-[#555555]">
                        {day}
                      </p>
                      <p className="text-[#666666] Livvic-Medium text-sm">
                        {start} - {end}
                      </p>
                    </li>
                  );
                });
              })()}
            </ul>
          </div>
          {/* Hourly Rate Section */}
          <div className="shadow-soft p-4 md:p-6 rounded-[20px] lg:w-[49%] w-full">
            <p className="Livvic-SemiBold text-base md:text-lg text-primary">
              Services
            </p>
            <ul className="mt-2 space-y-2">
              <li className="Livvic-Medium text-sm md:text-md text-[#555555]">
                1 Child: $
                {
                  selectedNanny.additionalInfo.find(
                    (info) => info.key === "salaryExp"
                  )?.value?.firstChild
                }
                /h
              </li>
              <li className="Livvic-Medium text-sm md:text-md text-[#555555]">
                2 Child: $
                {
                  selectedNanny.additionalInfo.find(
                    (info) => info.key === "salaryExp"
                  )?.value?.secChild
                }
                /h
              </li>
              <li className="Livvic-Medium text-sm md:text-md text-[#555555]">
                3 Child: $
                {
                  selectedNanny.additionalInfo.find(
                    (info) => info.key === "salaryExp"
                  )?.value?.thirdChild
                }
                /h
              </li>
              <li className="Livvic-Medium text-sm md:text-md text-[#555555]">
                4 Child: $
                {
                  selectedNanny.additionalInfo.find(
                    (info) => info.key === "salaryExp"
                  )?.value?.fourthChild
                }
                /h
              </li>
              <li className="Livvic-Medium text-sm md:text-md text-[#555555]">
                5 Child Or More: $
                {
                  selectedNanny.additionalInfo.find(
                    (info) => info.key === "salaryExp"
                  )?.value?.fiveOrMoreChild
                }
                /h
              </li>
            </ul>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="shadow-soft p-4 md:p-6 rounded-[20px]">
          <p className="Livvic-SemiBold text-base md:text-lg text-primary">
            Reviews
          </p>
          {selectedNanny?.reviews && selectedNanny?.reviews.length > 0 ? (
            <div className="mt-4">
              <div className="flex flex-col items-center md:flex-row justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="space-y-2 text-center sm:text-left">
                    <p className="Livvic-Bold text-3xl md:text-4xl">
                      {selectedNanny?.averageRating}
                    </p>
                    <Ra points={selectedNanny?.averageRating} size={20} />
                    <p className="Livvic-SemiBold text-sm">
                      {user?.reviews.length} Reviews
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {ratingPercentages.map(({ num, pro }, i) => (
                      <Prog key={i} num={num} pro={pro} color={"#029E76"} />
                    ))}
                  </div>
                </div>
                <div className="flex self-center md:self-end gap-2 md:gap-4 justify-center">
                  <div
                    onClick={scrollLeft}
                    className="p-2 rounded-full border border-[#EEEEEE] cursor-pointer hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
                  </div>
                  <div
                    onClick={scrollRight}
                    className="p-2 rounded-full border border-[#EEEEEE] cursor-pointer hover:bg-gray-50"
                  >
                    <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
                  </div>
                </div>
              </div>
              <div className="flex justify-center md:justify-start">
                <div
                  ref={scrollRef}
                  className="mt-6 md:mt-10 flex flex-nowrap gap-3 md:gap-4 overflow-x-hidden scroll-smooth snap-x snap-mandatory overflow-y-hidden"
                >
                  {selectedNanny?.reviews?.map((v, i) => (
                    <Reviews
                      key={i}
                      size={13.5}
                      points={v?.rating}
                      para={v?.msg}
                      name={v?.userId?.name}
                      img={v?.userId?.imageUrl}
                      hr={i !== user?.reviews.length - 1}
                      created={v?.createdAt} // Only add <hr> if it's not the last item
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm md:text-base">No reviews available</p>
          )}
        </div>
      </div>
    </div>
    // <div className="padding-navbar1 Quicksand">
    //   <div className="shadow-xl border-[1px] border-[#D6DDEB] bg-white my-8 px-6 py-4 rounded-2xl text-center">
    //     <div
    //       onClick={favourite}
    //       className="flex justify-end items-center gap-x-1 text-red-600 cursor-pointer"
    //     >
    //       {isFavorited ? <HeartFilled /> : <HeartOutlined />}

    //       <p className="text-lg underline">Save</p>
    //     </div>

    //     <div className="flex justify-center">
    //       <div>
    //         {selectedNanny?.imageUrl ? (
    //           <img
    //             className="mx-auto rounded-full w-24 object-contain"
    //             src={selectedNanny?.imageUrl}
    //             alt="img"
    //           />
    //         ) : (
    //           <Avatar
    //             className="rounded-full text-black"
    //             size="96"
    //             color={"#38AEE3"}
    //             name={
    //               selectedNanny?.name
    //                 ?.split(" ") // Split by space
    //                 .slice(0, 2) // Take first 1–2 words
    //                 .join(" ") // Re-join them
    //             }
    //           />
    //         )}

    //         <p className="my-2 font-bold lg:text-3xl text-2xl">
    //           {selectedNanny?.name}
    //         </p>
    //         <p className="font-semibold text-lg">
    //           {selectedNanny?.location?.format_location}
    //         </p>
    //         {/* <p className='font-semibold text-lg'>{selectedNanny?.zipCode && `Zip Code: ${selectedNanny?.zipCode}`}</p> */}
    //         {(selectedNanny?.gender || selectedNanny?.age) && (
    //           <p className="mb-2 text-lg">
    //             {selectedNanny?.gender}{" "}
    //             {selectedNanny?.age && `| Age: ${selectedNanny?.age}`}
    //           </p>
    //         )}

    //         {selectedNanny?.additionalInfo[16]?.value.option ? (
    //           <p
    //             style={{ background: "#E7F6FD" }}
    //             className="mx-auto my-4 px-2 py-1 rounded-lg w-20 text-sm"
    //           >
    //             {selectedNanny?.additionalInfo[16]?.value.option}
    //           </p>
    //         ) : null}

    //         <Ra
    //           points={
    //             selectedNanny?.averageRating ? selectedNanny?.averageRating : 0
    //           }
    //           size={16}
    //         />
    //         <div className="my-4">
    //           <button
    //             onClick={handleMessage}
    //             style={{ border: "1px solid #38AEE3", color: "#38AEE3" }}
    //             className="bg-white mx-4 my-0 mt-2 px-6 py-2 rounded-full font-normal text-base hover:-translate-y-1 duration-700 delay-150 hover:scale-110"
    //           >
    //             Message
    //           </button>
    //         </div>
    //       </div>
    //     </div>
    //   </div>
    //   <div className="relative">
    //     {!isSubscribed && (
    //       <div className="absolute inset-0 backdrop-blur-[4px] bg-white/50 z-20 flex items-center justify-center rounded-2xl">
    //         <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-[350px] text-center mx-auto">
    //           <h2 className="text-xl font-semibold text-[#050A30] mb-2">
    //             Subscribe to Unlock
    //           </h2>
    //           <p className="text-gray-600 text-sm mb-4">
    //             Unlock Profile to Contact This Caregiver
    //           </p>
    //           <button
    //             onClick={() => navigate("/family/pricing")}
    //             className="bg-[#38AEE3] hover:opacity-90 text-white font-medium py-2 px-5 text-sm rounded-full transition-all"
    //           >
    //             Upgrade Now
    //           </button>
    //         </div>
    //       </div>
    //     )}
    //     <div className="relative border-[1px] border-[#D6DDEB] bg-white p-4 rounded-2xl">
    //       <p className="mb-2 font-bold text-2xl">Weekly Schedule</p>

    //       <div className="flex flex-wrap justify-left gap-x-10 gap-y-5">
    //         {days.map((day, index) => {
    //           const daySchedule = selectedNanny?.additionalInfo?.find(
    //             (info) => info.key === "specificDaysAndTime"
    //           )?.value?.[day];

    //           return (
    //             <div
    //               key={index}
    //               className={`pr-8 ${
    //                 index < days.length - 1 ? "schdule-Border" : ""
    //               }`}
    //             >
    //               <p className="font-semibold text-lg">{day}</p>
    //               {daySchedule && daySchedule.checked ? (
    //                 <>
    //                   <p>
    //                     Start{" "}
    //                     <span className="font-bold">
    //                       {new Date(daySchedule.start).toLocaleTimeString([], {
    //                         hour: "2-digit",
    //                         minute: "2-digit",
    //                         hour12: true,
    //                       })}
    //                     </span>
    //                   </p>
    //                   <p>
    //                     End{" "}
    //                     <span className="font-bold">
    //                       {new Date(daySchedule.end).toLocaleTimeString([], {
    //                         hour: "2-digit",
    //                         minute: "2-digit",
    //                         hour12: true,
    //                       })}
    //                     </span>
    //                   </p>
    //                 </>
    //               ) : (
    //                 <p className="w-28">I don't work on {day}</p>
    //               )}
    //             </div>
    //           );
    //         })}
    //       </div>
    //     </div>

    //     <div className="border-[1px] border-[#D6DDEB] bg-white my-8 p-4 rounded-2xl">
    //       <p className="mb-2 font-bold text-2xl">Services</p>

    //       <div className="flex flex-wrap justify-between gap-x-10 gap-y-5">
    //         {Object.entries(
    //           selectedNanny.additionalInfo.find(
    //             (info) => info.key === "salaryExp"
    //           )?.value
    //         )?.map(([key, value], i) => (
    //           <div
    //             key={key}
    //             className="flex justify-between border-2 px-4 py-1 rounded-3xl w-72 text-gray-500 cursor-pointer"
    //           >
    //             <p className="text-lg">{i + 1} Child</p>
    //             <p className="font-bold text-black text-lg">${value}/hr</p>
    //           </div>
    //         ))}
    //       </div>
    //     </div>

    //     <div className="flex flex-wrap gap-x-4 gap-y-6 w-full">
    //       <div className="border-[1px] border-[#D6DDEB] bg-white p-4 rounded-2xl width-div">
    //         {" "}
    //         {/* 75% width */}
    //         <p className="mb-2 font-bold text-2xl">About Me</p>
    //         <p className="leading-5">
    //           {
    //             selectedNanny?.additionalInfo.find(
    //               (info) => info.key === "jobDescription"
    //             )?.value
    //           }
    //         </p>
    //       </div>
    //       <div className="border-[1px] border-[#D6DDEB] bg-white p-4 rounded-2xl width-2div">
    //         {" "}
    //         {/* 25% width */}
    //         <p className="mb-2 font-bold text-2xl">Looking For</p>
    //         <div>
    //           <p className="text-base">
    //             <span className="font-semibold text-lg Quicksand">
    //               Availability:
    //             </span>{" "}
    //             {
    //               selectedNanny?.additionalInfo.find(
    //                 (info) => info.key === "avaiForWorking"
    //               )?.value?.option
    //             }
    //           </p>

    //           <p className="text-base">
    //             <span className="font-semibold text-lg Quicksand">Start:</span>{" "}
    //             {
    //               selectedNanny?.additionalInfo.find(
    //                 (info) => info.key === "availability"
    //               )?.value?.option
    //             }
    //           </p>

    //           <p className="text-base">
    //             <span className="font-semibold text-lg Quicksand">
    //               Age group:
    //             </span>{" "}
    //             {selectedNanny?.additionalInfo
    //               .find((info) => info.key === "ageGroupsExp")
    //               ?.value?.option.map((v, i) => (
    //                 <span key={i}>
    //                   {customFormat(v).split(" ")[0]}
    //                   {i <
    //                   selectedNanny?.additionalInfo.find(
    //                     (info) => info.key === "ageGroupsExp"
    //                   )?.value?.option.length -
    //                     1
    //                     ? ", "
    //                     : ""}
    //                 </span>
    //               ))}
    //           </p>
    //         </div>
    //       </div>
    //     </div>

    //     <div className="flex flex-wrap gap-x-4 gap-y-6 my-8 w-full">
    //       <div className="border-[1px] border-[#D6DDEB] bg-white p-4 rounded-2xl width-div">
    //         {" "}
    //         {/* 75% width */}
    //         <p className="mb-2 font-bold text-2xl">Qualifications</p>
    //         <div>
    //           <p className="text-base">
    //             <span className="font-semibold text-lg Quicksand">
    //               Certifications:{" "}
    //             </span>
    //             {selectedNanny?.additionalInfo
    //               .find((info) => info.key === "certification")
    //               ?.value?.option.map((v, i) => (
    //                 <span key={i}>
    //                   {customFormat(v)}
    //                   {i <
    //                   selectedNanny?.additionalInfo.find(
    //                     (info) => info.key === "certification"
    //                   )?.value?.option.length -
    //                     1
    //                     ? ", "
    //                     : ""}
    //                 </span>
    //               ))}
    //           </p>
    //           <p className="text-base">
    //             <span className="font-semibold text-lg Quicksand">
    //               Languages:{" "}
    //             </span>
    //             {selectedNanny?.additionalInfo
    //               .find((info) => info.key === "language")
    //               ?.value?.option.map((v, i) => (
    //                 <span key={i}>
    //                   {customFormat(v)}
    //                   {i <
    //                   selectedNanny?.additionalInfo.find(
    //                     (info) => info.key === "language"
    //                   )?.value?.option.length -
    //                     1
    //                     ? ", "
    //                     : ""}
    //                 </span>
    //               ))}
    //           </p>
    //           <p className="text-base">
    //             <span className="font-semibold text-lg Quicksand">Others:</span>{" "}
    //             {`${customFormat(
    //               user.additionalInfo.find((info) => info.key === "ableToCook")
    //                 ?.value?.option || ""
    //             )}, ${customFormat(
    //               user.additionalInfo.find(
    //                 (info) => info.key === "helpWithHousekeeping"
    //               )?.value?.option || ""
    //             )}`}
    //           </p>
    //         </div>
    //       </div>
    //       <div className="border-[1px] border-[#D6DDEB] bg-white p-4 rounded-2xl width-2div">
    //         <p className="mb-2 font-bold text-2xl">Work Experience</p>
    //         <div>
    //           <p className="font-semibold text-lg Quicksand">
    //             {
    //               selectedNanny?.additionalInfo.find(
    //                 (info) => info.key === "experience"
    //               )?.value?.option
    //             }{" "}
    //             of experience caring for:
    //           </p>
    //           {selectedNanny?.additionalInfo
    //             .find((info) => info.key === "ageGroupsExp")
    //             ?.value?.option.map((v, i) => (
    //               <p key={i} className="text-base">
    //                 <span className="font-semibold text-lg Quicksand">
    //                   {customFormat(v).split(" ")[0]}:
    //                 </span>{" "}
    //                 {customFormat(v).split(" ").slice(1).join(" ")}
    //               </p>
    //             ))}
    //         </div>
    //       </div>
    //     </div>
    //     <div className="flex flex-wrap gap-x-4 gap-y-6 my-8 w-full">
    //       <div className="border-[1px] border-[#D6DDEB] bg-white p-4 rounded-2xl width-div">
    //         <p className="mb-2 font-bold text-2xl">Reviews</p>
    //         {selectedNanny?.reviews && selectedNanny?.reviews?.length > 0 ? (
    //           <div>
    //             <div className="flex gap-4">
    //               <div>
    //                 {selectedNanny?.averageRating && (
    //                   <p className="font-bold text-4xl text-center Quicksand">
    //                     {selectedNanny?.averageRating}
    //                   </p>
    //                 )}

    //                 <Ra
    //                   points={
    //                     selectedNanny?.averageRating
    //                       ? selectedNanny?.averageRating
    //                       : 0
    //                   }
    //                   size={8}
    //                 />
    //                 <p style={{ fontSize: 8 }}>
    //                   {selectedNanny?.reviews?.length} Reviews
    //                 </p>
    //               </div>
    //               <div>
    //                 <Prog num={5} pro={100} color={"#029E76"} />
    //                 <Prog num={4} pro={70} color={"#029E76"} />
    //                 <Prog num={3} pro={60} color={"#FEA500"} />
    //                 <Prog num={2} pro={40} color={"#FF5269"} />
    //                 <Prog num={1} pro={30} color={"#FF5269"} />
    //               </div>
    //             </div>

    //             <div className="mt-10 pr-10 max-h-48 overflow-auto">
    //               {selectedNanny?.reviews.map((v, i) => (
    //                 <Reviews
    //                   key={i}
    //                   size={8}
    //                   points={v?.rating}
    //                   para={v?.msg}
    //                   name={v?.userId?.name}
    //                   img={v?.userId?.imageUrl}
    //                   hr={i !== selectedNanny?.reviews.length - 1} // Only add <hr> if it's not the last item
    //                 />
    //               ))}
    //             </div>
    //           </div>
    //         ) : (
    //           <p>No reviews available</p>
    //         )}
    //       </div>

    //       <div className="border-[1px] border-[#D6DDEB] bg-white p-4 rounded-2xl h-40 width-2div">
    //         <p className="mb-2 font-bold text-2xl">Verified Info</p>
    //         <div className="flex">
    //           <p className="w-52 font-semibold text-lg Quicksand">
    //             Phone Number
    //           </p>
    //           {selectedNanny?.phoneNo ? <CheckOutlined /> : <CloseOutlined />}
    //         </div>

    //         <div className="flex">
    //           <p className="w-52 font-semibold text-lg Quicksand">
    //             National ID
    //           </p>
    //           {selectedNanny?.verified?.nationalIDVer == "true" ? (
    //             <CheckOutlined />
    //           ) : (
    //             <CloseOutlined />
    //           )}
    //         </div>

    //         <div className="flex">
    //           <p className="w-52 font-semibold text-lg Quicksand">Email</p>
    //           {selectedNanny?.verified?.emailVer ? (
    //             <CheckOutlined />
    //           ) : (
    //             <CloseOutlined />
    //           )}
    //         </div>
    //       </div>
    //     </div>
    //   </div>
    // </div>
  );
}
