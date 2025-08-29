import { Heart } from "lucide-react";
import { HeartFilled } from "@ant-design/icons";
import star from "../../assets/images/star.png";
import Avatar from "react-avatar";
import { addOrRemoveFavouriteThunk } from "../Redux/favouriteSlice";
import { useDispatch, useSelector } from "react-redux";
import { refreshTokenThunk } from "../Redux/authSlice";
import { NavLink } from "react-router-dom";
import Ra from "./rate";
import { formatCreatedAt } from "../../Config/helpFunction";
import { useState } from "react";

function formatJobTitle(jobType) {
  if (!jobType) return "Nanny Share Needed";

  const withSpaces = jobType.replace(/([a-z])([A-Z])/g, "$1 $2");
  const capitalized = withSpaces
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return `${capitalized} Needed`;
}

export default function ProfileCard({
  nanny,
  img,
  time,
  name,
  intro,
  loc,
  hr,
  exp,
  rate,
  zipCode,
  averageRating,
  totalRatings,
}) {
  const formatLocation = () => {
    if (!zipCode || !loc?.format_location) return loc;
    const parts = loc.format_location.split(",") || [];
    const city = parts.at(-3)?.trim();
    const state = parts.at(-2)?.trim().split(" ")[0];
    return city && state ? `${city}, ${state}` : "";
  };
  return (
    <div className="p-6 border rounded-[20px] border-[#EEEEEE] bg-white space-y-2 h-[311px] w-[330px]">
      <div className="flex justify-between gap-4">
        {img ? (
          <img
            className="bg-black rounded-full w-20 h-20 object-contain"
            src={img}
            alt="img"
          />
        ) : (
          <Avatar
            className="rounded-full text-black"
            size="80"
            color={"#38AEE3"}
            name={name
              ?.split(" ") // Split by space
              .slice(0, 2) // Take first 1–2 words
              .join(" ")}
          />
        )}
        <div className="flex flex-col items-end gap-2">
          <div className="py-2 px-4 bg-[#ECF1FF] text-primary rounded-full w-fit Livvic-SemiBold text-xs">
            {time}
          </div>
          <div className="flex gap-2">
            {totalRatings > 0 && (
              <>
                <Ra points={averageRating} size={20} />{" "}
                <span className="Livvic-SemiBold text-[#555555] text-sm">
                  {totalRatings}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <p className="Livvic-SemiBold text-lg flex gap-2 mt-2">
        {name} <img src="/shield.svg" alt="" />
      </p>
      <p className="Livvic-Medium text-sm text-[#555555]">{formatLocation()}</p>
      <p className="Livvic-Medium text-sm text-[#555555]">
        {exp && exp !== "N/A" && exp !== "0" && `${exp} of experience`}
      </p>
      <p className="text-sm text-[#777777]">
        {intro.length > 150 ? `${intro.substring(0, 150)}...` : intro}
      </p>
    </div>
    // <div
    //   className={`flex flex-col justify-between shadow-custom-shadow border-[#D6DDEB] w-full min-h-96 bg-white p-4 rounded-2xl Quicksand`}
    // >
    //   <div className="max-lg:w-full">
    //     <div className="flex justify-between">
    //       {img ? (
    //         <img
    //           className="bg-black rounded-full w-20 h-20 object-contain"
    //           src={img}
    //           alt="img"
    //         />
    //       ) : (
    //         <Avatar
    //           className="rounded-full text-black"
    //           size="80"
    //           color={"#38AEE3"}
    //           name={name
    //             ?.split(" ") // Split by space
    //             .slice(0, 2) // Take first 1–2 words
    //             .join(" ")}
    //         />
    //       )}

    //       <div>
    //         {time && (
    //           <p
    //             style={{ background: "#E7F6FD" }}
    //             className="px-2 py-1 rounded-lg text-sm"
    //           >
    //             {time}
    //           </p>
    //         )}
    //       </div>
    //     </div>
    //     <p className="my-2 font-bold text-2xl">{name}</p>
    //   </div>

    //   <p className="font-medium flex-1">
    //     {intro.length > 400 ? `${intro.substring(0, 400)}...` : intro}
    //   </p>

    //   <div>
    //     {loc && (
    //       <p className="my-2 font-semibold text-lg">{loc?.format_location}</p>
    //     )}
    //     {/* {zipCode && <p className="my-2 font-semibold text-lg">{zipCode}</p>} */}

    //     <div className="flex justify-between items-center">
    //       {!nanny ? (
    //         <p>
    //           {hr && (
    //             <span className="font-semibold">
    //               {hr}hr <span className="font-normal">with kids | </span>
    //             </span>
    //           )}
    //           <span className="font-semibold">{exp}</span> experience
    //         </p>
    //       ) : (
    //         <p>
    //           <span className="font-semibold">
    //             {hr} <span className="font-normal">kids</span>
    //           </span>
    //         </p>
    //       )}
    //       {rate && (
    //         <div
    //           style={{ background: "#FBF5DE" }}
    //           className="flex gap-x-1 px-2 rounded-xl"
    //         >
    //           <p>{rate}</p>
    //           <img className="object-contain" src={star} alt="star" />
    //         </div>
    //       )}
    //     </div>
    //   </div>
    // </div>
  );
}

export function ProfileCard1({
  id,
  nanny,
  img,
  name,
  intro,
  loc,
  hr,
  time,
  rate,
  imageNot,
  jobType,
  zipCode,
  created,
  fav,
  nannyShareView,
}) {
  const { user, accessToken } = useSelector((state) => state.auth);
  const [isFavorited, setIsFavorited] = useState(user.favourite?.includes(id));
  const dispatch = useDispatch();
  const favourite = () => {
    dispatch(
      addOrRemoveFavouriteThunk({ favouriteUserId: id, accessToken })
    );
    dispatch(refreshTokenThunk());
    setIsFavorited((prev) => !prev)
  };
    const formatLocation = () => {
    if (!zipCode || !loc?.format_location) return "";
    const parts = loc.format_location.split(",") || [];
    const city = parts.at(-3)?.trim();
    const state = parts.at(-2)?.trim().split(" ")[0];
    return city && state ? `${city}, ${state}` : "";
  };
  return (
    <NavLink
      to={
        fav
          ? `/nanny/jobDescription/${id}`
          : nannyShareView
          ? `/family/nannyShareView/${id}`
          : `jobDescription/${id}`
      }
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <div className="onboarding-box">
        <div className="flex justify-between">
          <h1 className="onboarding-subHead">{formatJobTitle(jobType)}</h1>
          <div className="flex gap-2 items-center">
            {time && (
              <p
                style={{ background: "#E7F6FD" }}
                className="Livvic-SemiBold text-primary bg-primary px-4 py-2 rounded-full text-sm"
              >
                {time}
              </p>
            )}
            <div
              className="p-2 h-9 flex justify-center items-center w-9 rounded-full bg-[#F6F3EE]"
              onClick={(e) => {
                e.stopPropagation(); // ← prevent bubbling to NavLink
                e.preventDefault(); // ← prevent navigation if inside a <NavLink>
                favourite();
              }}
            >
              {isFavorited ? (
                <HeartFilled className="text-tertiary" />
              ) : (
                <Heart className="text-tertiary" height={20} width={20} />
              )}
            </div>
          </div>
        </div>
        <p className="Livvic text-md text-secondary mt-4">
          {intro.length > 300 ? `${intro.substring(0, 300)}...` : intro}
        </p>
        <p className="onboarding-form-label mt-4 flex flex-wrap items-center gap-x-2 text-[#555555]">
          <span className="onboarding-form-label underline">{name}</span>
          <span className="onboarding-form-label">|</span>
          <span className="onboarding-form-label">{hr} kids</span>
          <span className="onboarding-form-label">|</span>
          <span className="onboarding-form-label">{formatLocation()}</span>
          <span className="onboarding-form-label">|</span>
          <span className="onboarding-form-label">{formatCreatedAt(created)}</span>
        </p>
      </div>
    </NavLink>
  );
}
