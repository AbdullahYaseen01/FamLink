import { useRef } from "react";
import CardForInfo from "../LoginAsFamily/subcomponents/cardForInfo";
import Reviews from "../LoginAsFamily/subcomponents/Reviews";
import Ra from "../subComponents/rate";
import Prog from "../LoginAsFamily/subcomponents/progress";
import image from "../../assets/images/s1.png";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import Avatar from "react-avatar";
import { format, parseISO } from "date-fns";
import { customFormat } from "../subComponents/toCamelStr";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { fireToastMessage } from "../../toastContainer";
import { ChevronLeft, ChevronRight, HeartIcon, Info, Link } from "lucide-react";
import Button from "../../NewComponents/Button";

export default function Profile() {
  const { user } = useSelector((s) => s.auth);
  const location = window.location.origin;

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const timingKey = "specificDaysAndTime"; // The key you want to access
  const timingValue = user?.additionalInfo.find(
    (info) => info.key === timingKey
  )?.value; // Access the specific object based on the key

  let timingText = "";
  if (timingValue && typeof timingValue === "object") {
    timingText = Object.keys(timingValue)
      .filter((day) => timingValue[day]?.checked) // Only include days where checked is true
      .map((day) => {
        const { start, end } = timingValue[day]; // Destructure start and end from the day object

        // Format the start and end times
        const formattedStart = format(parseISO(start), "hh:mm a"); // Convert start time
        const formattedEnd = format(parseISO(end), "hh:mm a"); // Convert end time

        return `${day} ${formattedStart} - ${formattedEnd}`; // Format the string as "day start - end"
      })
      .join(", "); // Join all the strings with a comma
  }

  const jobDescriptionKey = "jobDescription"; // The key you want to access
  const jobDescriptionValue = user?.additionalInfo.find(
    (info) => info.key === jobDescriptionKey
  )?.value;

  const salaryExp = user?.additionalInfo.find(
    (info) => info.key === "salaryExp"
  )?.value;

  const ratingCount = user?.reviews?.reduce((acc, review) => {
    const rating = Math.floor(review.rating);
    acc[rating] = (acc[rating] || 0) + 1;
    return acc;
  }, {});

  const totalReviews = user?.reviews?.length || 0;

  const ratingPercentages = [5, 4, 3, 2, 1].map((num) => {
    const count = ratingCount?.[num] || 0;
    const pro = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    return { num, pro };
  });

  const scrollRef = useRef(null);
  const scrollAmount = 300; // adjust scroll distance as needed

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const formatLocation = () => {
    if (!user?.zipCode || !user?.location?.format_location) return "";
    const parts = user?.location?.format_location.split(",") || [];
    const city = parts.at(-3)?.trim();
    const state = parts.at(-2)?.trim().split(" ")[0];
    return city && state ? `${city}, ${state}` : "";
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 md:gap-6 p-3 md:py-6 md:px-12  w-full justify-center">
      {/* Left Sidebar */}
      <div className="w-full lg:w-1/4 xl:w-1/3 2xl:w-1/4">
        {/* Profile Card */}
        <div className="shadow-soft p-4 md:p-6 lg:p-9 rounded-[20px]">
          <div className="flex flex-col items-center">
            {user?.imageUrl ? (
              <img
                className="mx-auto rounded-[16px] w-20 md:w-24 object-contain"
                src={user?.imageUrl}
                alt="img"
              />
            ) : (
              <Avatar
                className="rounded-[16px] text-black"
                size="96"
                color={"#38AEE3"}
                name={user?.name
                  ?.split(" ") // Split by space
                  .slice(0, 2) // Take first 1–2 words
                  .join(" ")}
              />
            )}

            <div className="flex gap-2">
              <p className="my-2 text-primary Livvic-SemiBold text-xl md:text-2xl text-center">
                {user.name}
              </p>
            </div>
            {user?.location?.format_location && (
              <p className="text-[#555555] text-center text-sm md:text-md Livvic-Medium">
                {formatLocation()}
              </p>
            )}
            <div className="mt-4 md:mt-6 w-full">
              <NavLink
                to="/nanny/edit"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                {" "}
                <Button
                  btnText={"Edit Profile"}
                  className="bg-primary w-full py-2 text-sm md:text-base"
                />
              </NavLink>
              <div className="relative w-full">
                <Button
                  btnText={
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <Link className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 text-[#555555]" />
                      <span
                        className="text-[
#555555] Livvic-Medium text-sm md:text-base"
                      >
                        Copy Profile Link
                      </span>
                    </div>
                  }
                  className="w-full py-2 sm:py-2.5 md:py-3 mt-2 border border-gray-200 text-[#555555] Livvic-Medium text-xs sm:text-sm md:text-base lg:text-lg"
                  action={() => {
                    const fullUrl = `${window.location.origin}/family/profileNanny/${user?._id}`;
                    navigator.clipboard
                      .writeText(fullUrl)
                      .then(() => {
                        fireToastMessage({
                          type: "success",
                          message: "Link copied",
                        });
                      })
                      .catch(() => {
                        fireToastMessage({
                          type: "error",
                          message: "Failed to copy link",
                        });
                      });
                  }}
                />
              </div>
              {/* <div className="bg-yellow-100 rounded-full px-4 py-1 w-fit mx-auto mt-2 flex gap-2 items-center">
                <Info className="text-yellow-400" size={20} />
                <p className="text-yellow-400">working on copy feature</p>
              </div> */}
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
                {user.additionalInfo
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
                {user.additionalInfo
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
                  {/* {user?.additionalInfo.find(
                    (info) => info.key === "backgroundCheck"
                  )?.value?.option?.length > 0 && (
                    <img src="/check-circle.svg" alt="verified" />
                  )} */}
                </li>
                <li className="flex gap-2 justify-between text-primary Livvic-SemiBold text-xs md:text-sm w-full onboarding-box">
                  <span className="text-primary Livvic-SemiBold text-sm">
                    Phone Number Verification
                  </span>
                  {user?.verified.phoneVer && <img src="/check-circle.svg" alt="verified" />}
                </li>
                <li className="flex gap-2 justify-between text-primary Livvic-SemiBold text-xs md:text-sm w-full onboarding-box">
                  <span className="text-primary Livvic-SemiBold text-sm">
                    National ID
                  </span>
                  {user?.verified?.nationalIDVer === "true" && (
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
      <div className="w-full lg:w-2/3 xl:w-2/3 2xl:w-1/2 space-y-4 md:space-y-6">
        {/* About Me Section */}
        <div className="shadow-soft p-4 md:p-6 rounded-[20px]">
          <p className="Livvic-SemiBold text-base md:text-lg text-primary">
            About Me
          </p>
          <p className="Livvic text-sm md:text-md text-[#555555] mt-2">
            {
              user.additionalInfo.find((info) => info.key === "jobDescription")
                ?.value
            }
          </p>
          <hr className="my-4" />
          <p className="Livvic-SemiBold text-base md:text-lg text-primary">
            Work Experience -{" "}
            {
              user.additionalInfo.find((info) => info.key === "experience")
                ?.value?.option
            }
          </p>
          <ul className="mt-2 space-y-2">
            {user.additionalInfo
              .find((info) => info.key === "ageGroupsExp")
              ?.value?.option?.map((v, i) => (
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
          <hr className="my-4" />
          <p className="Livvic-SemiBold text-base md:text-lg text-primary">
            Looking For
          </p>
          <ul className="mt-2 space-y-2">
            <li className="Livvic-Medium text-sm md:text-md text-[#555555]">
              Availability:{" "}
              {
                user.additionalInfo.find(
                  (info) => info.key === "interestedChildcare"
                )?.value?.option
              }
            </li>
            <li className="Livvic-Medium text-sm md:text-md text-[#555555]">
              Start:{" "}
              {
                user.additionalInfo.find((info) => info.key === "avaiForWorking" )
                  ?.value?.option
              }
            </li>
            <li className="Livvic-Medium text-sm md:text-md text-[#555555]">
              Age Group:{" "}
              <span className="text-[#555555] Livvic-Medium">
                {user.additionalInfo
                  .find((info) => info.key === "ageGroupsExp")
                  ?.value?.option?.map((v) => v.split(" (")[0])
                  .join(", ")}
              </span>
            </li>
          </ul>
        </div>

        {/* Hourly Rate Section */}
        <div className="shadow-soft p-4 md:p-6 rounded-[20px]">
          <p className="Livvic-SemiBold text-base md:text-lg text-primary">
            Hourly Rate
          </p>
          <ul className="mt-2 space-y-2">
            <li className="Livvic-Medium text-sm md:text-md text-[#555555]">
              1 Child: $
              {
                user.additionalInfo.find((info) => info.key === "salaryExp")
                  ?.value?.firstChild
              }
              /h
            </li>
            <li className="Livvic-Medium text-sm md:text-md text-[#555555]">
              2 Child: $
              {
                user.additionalInfo.find((info) => info.key === "salaryExp")
                  ?.value?.secChild
              }
              /h
            </li>
            <li className="Livvic-Medium text-sm md:text-md text-[#555555]">
              3 Child: $
              {
                user.additionalInfo.find((info) => info.key === "salaryExp")
                  ?.value?.thirdChild
              }
              /h
            </li>
            <li className="Livvic-Medium text-sm md:text-md text-[#555555]">
              4 Child: $
              {
                user.additionalInfo.find((info) => info.key === "salaryExp")
                  ?.value?.fourthChild
              }
              /h
            </li>
            <li className="Livvic-Medium text-sm md:text-md text-[#555555]">
              5 Child Or More: $
              {
                user.additionalInfo.find((info) => info.key === "salaryExp")
                  ?.value?.fiveOrMoreChild
              }
              /h
            </li>
          </ul>
        </div>

        {/* Reviews Section */}
        <div className="shadow-soft p-4 md:p-6 rounded-[20px]">
          <p className="Livvic-SemiBold text-base md:text-lg text-primary">
            Reviews
          </p>
          {user?.reviews && user?.reviews.length > 0 ? (
            <div className="mt-4">
              <div className="flex flex-col items-center md:flex-row justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="space-y-2 text-center sm:text-left">
                    <p className="Livvic-Bold text-3xl md:text-4xl">
                      {user?.averageRating}
                    </p>
                    <Ra points={user?.averageRating} size={20} />
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
                  {user?.reviews?.map((v, i) => (
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
  );
}
