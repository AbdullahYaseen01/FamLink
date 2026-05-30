import { Baby, Ban, Briefcase, Check, DollarSign, Heart, Loader2, LockKeyhole, MapPin, MessageCircle, User, Users2, X } from "lucide-react";
import { HeartFilled } from "@ant-design/icons";
import Avatar from "react-avatar";
import { addOrRemoveFavouriteThunk } from "../Redux/favouriteSlice";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { refreshTokenThunk } from "../Redux/authSlice";
import { NavLink } from "react-router-dom";
import Ra from "./rate";
import { formatCreatedAt } from "../../Config/helpFunction";
import { useState } from "react";
// import CustomButton from "../../NewComponents/Button";
import {
  Clock,
  Home,
  Calendar,
  ChevronRight,
  Users,
} from "lucide-react";
import CustomButton from "../../NewComponents/Button";
import { acceptIncomingRequestThunk } from "../Redux/matchSlice";
import { fireToastMessage } from "../../toastContainer";
import { createChatThunk } from "../Redux/chatSlice";

const handleRequestAccept = async (
  matchId,
  setIsLoading,
  dispatch,
  setMatchRequestSuccessModal,
  userId,
  setChatUserId
) => {
  console.log("ACCEPT CLICKED");

  setIsLoading((prev) => ({ ...prev, accept: true }));

  try {
    console.log("Before dispatch");

    await dispatch(
      acceptIncomingRequestThunk({ matchId })
    ).unwrap();

    console.log("After dispatch");

    setMatchRequestSuccessModal(true);
    setChatUserId(userId);

    console.log("Modal triggered");
  } catch (error) {
    console.log("ERROR", error);

    fireToastMessage({
      type: "error",
      message: "Server error",
    });
  } finally {
    setIsLoading((prev) => ({ ...prev, accept: false }));
  }
};

const handleRequestReject = async (matchId, setIsLoading, dispatch) => {
  setIsLoading((prev) => ({ ...prev, reject: true }));
  try {
    await dispatch(acceptIncomingRequestThunk({ matchId: matchId })).unwrap();
    return null
  } catch (error) {
    fireToastMessage({
      type: "error",
      message: "Server error"
    })
  } finally {
    setIsLoading((prev) => ({ ...prev, reject: false }));
  }
}

export const FamilyProfile = ({ name, userId, id, sharedRate, soloRate, ages, hasNanny, img, careType, schedule, location, hosting, start, shareLocation, setIsMatchRequestDenied, handleMatchRequest, setIsProfileComplete, setIsRequestSubmitModal, status, requestType, matchId, setMatchRequestSuccessModal, setChatUserId }) => {
  const { user, accessToken } = useSelector((state) => state.auth);
  const navigate = useNavigate()
  const [isFavorited, setIsFavorited] = useState(user.favourite?.includes(id));
  const dispatch = useDispatch();
  const isProfileComplete = user?.nannyProfileCompleted
  const [isLoading, setIsLoading] = useState({
    accept: false,
    reject: false
  })

  console.log(
  "Received setter",
  setMatchRequestSuccessModal
);

  // const handleMessage = async () => {
  //   try {
  //     const participants = [userId, user._id];
  //     const { status } = await dispatch(
  //       createChatThunk({ participants }),
  //     ).unwrap();
  //     if (status === 201 || status === 200) {
  //       navigate(`/dashboard/message/`);
  //     }
  //   } catch (error) {
  //     // console.log(error);
  //     fireToastMessage({ type: "error", message: error.message });
  //   }
  // };

  const favourite = (e) => {
    e.stopPropagation();
    e.preventDefault();
    dispatch(addOrRemoveFavouriteThunk({ favouriteUserId: id, accessToken }));
    dispatch(refreshTokenThunk());
    setIsFavorited((prev) => !prev);
  };

  const careTypeLabels = {
    "full-time care": "Full-Time",
    "part-time care": "Part-Time",
    "after-school care": "After-School",
    "summer/seasonal": "Summer/Seasonal",
    "weekend nanny share": "Weekend Nanny Share",
  };

  // Meta items JSX — shared between mobile (full-width below avatar row) and desktop (inline)
  const metaItems = (
    <>
      {careType && (
        <div className="flex items-center gap-2 min-w-0">
          <Clock className="flex-shrink-0" />
          <div className="flex flex-col justify-between leading-tight min-w-0">
            <span className="text-sm sm:text-base Livvic-Medium text-[#202020] capitalize truncate">
              {careTypeLabels[careType]}
            </span>
            <span className="text-xs sm:text-sm text-[#888] Livvic-Medium truncate">
              {formatScheduleDays(schedule)}
            </span>
          </div>
        </div>
      )}

      {(location?.neighborhood || location?.city) && (
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="flex-shrink-0" />
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-sm sm:text-base Livvic-Medium text-[#202020] truncate">
              {location?.neighborhood},
            </span>
            <span className="text-xs sm:text-sm Livvic-Medium text-[#888] truncate">
              {location?.city}
            </span>
          </div>
        </div>
      )}

      {hosting && (
        <div className="flex items-center gap-2 min-w-0">
          <Home className="flex-shrink-0" />
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-sm sm:text-base Livvic-Medium text-[#202020] truncate">
              {hosting?.toLowerCase().replace(/\b\w/g, char => char.toUpperCase())}
            </span>
            {shareLocation && (
              <span className="text-xs sm:text-sm Livvic-Medium text-[#888] truncate">
                {shareLocation}
              </span>
            )}
          </div>
        </div>
      )}

      {start && (
        <div className="flex items-center gap-2 min-w-0">
          <Calendar className="flex-shrink-0" />
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-sm sm:text-base Livvic-Medium text-[#202020]">
              Starting
            </span>
            <span className="text-xs sm:text-sm Livvic-Medium text-[#888] capitalize truncate">
              {start}
            </span>
          </div>
        </div>
      )}

      {(soloRate || sharedRate) && (
        <div className="flex items-center gap-2 min-w-0">
          <DollarSign className="flex-shrink-0" />
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-sm sm:text-base Livvic-Medium text-[#202020]">
              {soloRate}
            </span>
            {sharedRate && (
              <span className="text-xs sm:text-sm Livvic-Medium text-[#888] truncate">
                {sharedRate}
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );

  const ButtonAreaText = () => {
    switch (status) {
      // case "pending":
      //   return (
      //     <div>
      //       Pending
      //     </div>
      //   );

      case "accepted":
        return (
          <div className="flex sm:flex-col items-center sm:items-stretch gap-2 sm:w-full">
            <CustomButton
              btnText={
                <div className="flex items-center justify-center gap-2 h-full">
                  <MessageCircle size={18} />
                  <p className="Livvic-Medium whitespace-nowrap">Chat</p>
                </div>
              }
              className="
      bg-[#38AEE3] 
      text-white 
      !px-4 
      !py-2 
      !h-[44px] 
      min-w-[100px]
      sm:w-full
      flex 
      items-center 
      justify-center
    "
            // action={() => handleMessage()}
            // isLoading={isLoading.accept}
            // loadingBtnText={...}
            />

            <CustomButton
              btnText={
                <div className="text-primary flex items-center justify-center gap-2 h-full">
                  <Ban size={18} />
                  <p className="Livvic-Medium whitespace-nowrap">Block</p>
                </div>
              }
              className="
      bg-white 
      border-2 
      border-gray-300 
      !px-4 
      !py-2 
      !h-[44px] 
      min-w-[100px]
      sm:w-full
      flex 
      items-center 
      justify-center
    "
              // action={() => handleMatchBlock(matchId, setIsLoading, dispatch)}
              isLoading={isLoading.block}
              loadingBtnText={
                <div className="flex items-center justify-center gap-2 h-full">
                  <p className="Livvic-Medium whitespace-nowrap">Waiting...</p>
                </div>
              }
            />
          </div>
        );

      default:
        return (
          handleMatchRequest ? (
            <CustomButton
              action={() =>
                handleMatchRequest(
                  user,
                  user._id,
                  userId,
                  setIsMatchRequestDenied,
                  setIsProfileComplete,
                  setIsRequestSubmitModal
                )
              }
              btnText={
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Users size={16} className="flex-shrink-0" />
                  <span className="Livvic-SemiBold text-sm sm:text-base whitespace-nowrap">
                    Request a Match
                  </span>
                  {!isProfileComplete && (
                    <LockKeyhole
                      size={16}
                      className="flex-shrink-0"
                    />
                  )}
                </div>
              }
              className="bg-[#38AEE3] text-white px-3 sm:px-5 md:px-6 py-2.5 sm:py-3 md:py-4 !rounded-xl"
            />
          ) : requestType === "incoming" ? (
            <div className="flex sm:flex-col items-center sm:items-stretch gap-2 sm:w-full">
              <CustomButton
                btnText={
                  <div className="flex items-center justify-center gap-2 h-full">
                    <Check size={18} />
                    <p className="Livvic-Medium whitespace-nowrap">Accept</p>
                  </div>
                }
                className="
      bg-green-500 
      text-white 
      !px-4 
      !py-2 
      !h-[44px] 
      min-w-[100px]
      sm:w-full
      flex 
      items-center 
      justify-center
    "
                action={() => handleRequestAccept(matchId, setIsLoading, dispatch, setMatchRequestSuccessModal, userId, setChatUserId)}
                isLoading={isLoading.accept}
                loadingBtnText={
                  <div className="flex items-center justify-center gap-2 h-full">
                    <p className="Livvic-Medium whitespace-nowrap">Accepting...</p>
                  </div>
                }
              />

              <CustomButton
                btnText={
                  <div className="text-primary flex items-center justify-center gap-2 h-full">
                    <X size={18} />
                    <p className="Livvic-Medium whitespace-nowrap">Not a fit</p>
                  </div>
                }
                className="
      bg-white 
      border-2 
      border-gray-300 
      !px-4 
      !py-2 
      !h-[44px] 
      min-w-[100px]
      sm:w-full
      flex 
      items-center 
      justify-center
    "
                action={() => handleRequestReject(matchId, setIsLoading, dispatch)}
                isLoading={isLoading.reject}
                loadingBtnText={
                  <div className="flex items-center justify-center gap-2 h-full">
                    <p className="Livvic-Medium whitespace-nowrap">Waiting...</p>
                  </div>
                }
              />
            </div>
          ) : (
            <div>
              Awaiting Response
            </div>
          )
        );
    }
  };


  return (
    <div className="max-w-[1400px] bg-white border border-[#ECECEC] rounded-3xl overflow-hidden">

      {/* ── CARD INNER ── */}
      <div className="flex flex-col md:flex-row md:items-stretch">

        {/* ── LEFT ── */}
        <div className="flex flex-col flex-1 px-4 py-4 sm:px-6 sm:py-5 md:px-7 md:py-6 min-w-0">

          {/* Avatar + top content row */}
          <div className="flex gap-3 sm:gap-5">

            {/* Avatar */}
            <div className="flex-shrink-0">
              {img ? (
                <img
                  src={img}
                  alt={name}
                  className="w-28 h-28 sm:w-24 sm:h-24 md:w-36 md:h-36 lg:w-48 lg:h-48 rounded-2xl object-cover"
                />
              ) : (
                <Avatar name={name} round color="#38AEE3" className="!w-28 !h-28 sm:!w-24 sm:!h-24 md:!w-36 md:!h-36 lg:!w-48 lg:!h-48 !rounded-2xl" />
              )}
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 min-w-0">

              {/* Top row: Badge + Heart (mobile only) */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 Livvic-Medium bg-[#d9f0ff] text-[#5fbfff] rounded-full px-3 py-1 text-xs sm:text-sm flex-shrink-0">
                  <Users size={12} className="sm:hidden" />
                  <Users size={13} className="hidden sm:block" />
                  Family
                  <span className="opacity-30">•</span>
                  <span className="Livvic-Medium">
                    {hasNanny === "no" ? "Looking for a share" : "Has Nanny to Share"}
                  </span>
                </span>

                {/* Heart button — mobile only (top-right of content) */}
                <button
                  onClick={favourite}
                  aria-label={isFavorited ? "Remove from favourites" : "Add to favourites"}
                  className="md:hidden bg-transparent border-none cursor-pointer p-1 flex-shrink-0"
                >
                  <Heart
                    size={20}
                    className={isFavorited ? "text-red-500 fill-red-500" : "text-[#0D134C]"}
                  />
                </button>
              </div>

              {/* Family name */}
              <h2 className="text-lg sm:text-xl md:text-2xl Livvic-SemiBold text-[#0D134C] mb-1 truncate">
                {`${name?.split(" ")[0] || ""}${name?.split(" ")[1]
                  ? ` ${name.split(" ")[1][0].toUpperCase()}.`
                  : ""
                  }`}
              </h2>
              {/* Children info */}
              <p className="text-sm text-[#5D5D5D] mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="Livvic-Medium text-sm sm:text-base text-[#202020]">
                  {ages.length} Child{ages.length > 1 && "ren"}
                </span>
                <span>•</span>
                <span className="Livvic-Medium text-sm sm:text-base text-[#202020] break-words">
                  {ages?.map((age) => {
                    const ageNum = parseFloat(age);
                    if (ageNum % 1 !== 0) {
                      const months = Math.round(ageNum * 12);
                      return `${months} month${months > 1 ? "s" : ""}`;
                    }
                    return `${ageNum} year${ageNum > 1 ? "s" : ""}`;
                  }).join(", ")}
                </span>
              </p>

              {/* Meta items — desktop inline (md+), hidden on mobile */}
              <div className="hidden md:flex flex-wrap gap-x-6 gap-y-3">
                {metaItems}
              </div>

            </div>
          </div>

          {/* Meta items — mobile full-width below avatar row (hidden on md+) */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-3 md:hidden">
            {metaItems}
          </div>

        </div>

        {/* ── VERTICAL DIVIDER (desktop only) ── */}
        <div className="hidden md:block w-px bg-[#E9E9E9] my-4 flex-shrink-0" />

        {/* ── HORIZONTAL DIVIDER (mobile only) ── */}
        <div className="block md:hidden h-px bg-[#E9E9E9] mx-4 sm:mx-5" />

        {/* ── RIGHT PANEL ── */}
        <div className="
          flex items-center justify-between gap-2 px-4 py-3 
          md:flex-col md:justify-start md:p-4
          md:w-[260px] lg:w-[300px] md:gap-3
          flex-shrink-0
        ">

          {/* Heart — desktop only (top-right) */}
          <button
            onClick={favourite}
            aria-label={isFavorited ? "Remove from favourites" : "Add to favourites"}
            className="
              hidden md:block
              bg-transparent border-none cursor-pointer p-1 md:self-end md:mb-4
            "
          >
            <Heart
              className={isFavorited ? "text-red-500 fill-red-500" : "text-[#0D134C]"}
            />
          </button>

          {/* View Details */}
          <button className="
            flex items-center gap-1 bg-transparent border-none cursor-pointer
            text-primary Livvic-SemiBold text-sm whitespace-nowrap mb-2
          ">
            View Details
            <ChevronRight size={16} />
          </button>

          {/* Request Match */}
          <ButtonAreaText />

        </div>
      </div>
    </div>
  );
};

export const NannyProfile = ({
  id,
  userId,
  sharedRate,
  rateType,
  ages,
  goal,
  schedule,
  careType,
  start,
  img,
  name,
  experience,
  soloRate,
  distance,
  location,
  setIsMatchRequestDenied,
  handleMatchRequest,
  setIsProfileComplete,
  setIsRequestSubmitModal,
  status,
  requestType,
  setMatchRequestSuccessModal,
  setChatUserId,
  matchId,
  created,
}) => {
  const { user, accessToken } = useSelector((state) => state.auth);
  const [isFavorited, setIsFavorited] = useState(user.favourite?.includes(id));
  const dispatch = useDispatch();
  const navigate = useNavigate()

  const isProfileComplete = user?.nannyProfileCompleted;
  const [isLoading, setIsLoading] = useState({
    accept: false,
    reject: false
  })

  const favourite = (e) => {
    e.stopPropagation();
    e.preventDefault();
    dispatch(addOrRemoveFavouriteThunk({ favouriteUserId: id, accessToken }));
    dispatch(refreshTokenThunk());
    setIsFavorited((prev) => !prev);
  };

  const ageLabels = {
    "toddlers (1–3)": "Toddlers (1–3 years)",
    "preschool (3–5)": "Preschool (3–5 years)",
    "infants (0–1)": "Infants (0–1 years)",
    "school-age (5+)": "School Age (5+ years)",
  };

  const formattedAges = ages.map((age) => ageLabels[age] || age).join(", ");

  const rateLabel = rateType === "hourly" ? "hr" : "wk";

  // Meta items JSX — shared between mobile (full-width below avatar row) and desktop (inline)
  const metaItems = (
    <>
      {careType && (
        <div className="flex items-center gap-2 min-w-0">
          <Clock
            className="flex-shrink-0"
          />
          <div className="flex flex-col justify-between leading-tight min-w-0">
            <span className="text-sm sm:text-base Livvic-Medium text-[#202020] capitalize truncate">
              {careType}
            </span>
            <span className="text-xs sm:text-sm text-[#888] Livvic-Medium truncate">
              {formatScheduleDays(schedule)}
            </span>
          </div>
        </div>
      )}

      {(location?.neighborhood || location?.city) && (
        <div className="flex items-center gap-2 min-w-0">
          <MapPin
            className="flex-shrink-0"
          />
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-sm sm:text-base Livvic-Medium text-[#202020] truncate">
              {location?.neighborhood},
            </span>
            <span className="text-xs sm:text-sm Livvic-Medium text-[#888] truncate">
              {location?.city}
            </span>
          </div>
        </div>
      )}

      {sharedRate && (
        <div className="flex items-center gap-2 min-w-0">
          <DollarSign
            className="flex-shrink-0"
          />
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-sm sm:text-base Livvic-Medium text-[#202020]">
              ${sharedRate}/{rateLabel}
            </span>
            {soloRate && (
              <span className="text-xs sm:text-sm Livvic-Medium text-[#888] truncate">
                ~${soloRate}/{rateLabel} per family
              </span>
            )}
          </div>
        </div>
      )}

      {start && (
        <div className="flex items-center gap-2 min-w-0">
          <Calendar
            className="flex-shrink-0"
          />
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-sm sm:text-base Livvic-Medium text-[#202020]">
              Available
            </span>
            <span className="text-xs sm:text-sm Livvic-Medium text-[#888] capitalize truncate">
              {start}
            </span>
          </div>
        </div>
      )}
    </>
  );

  const ButtonAreaText = () => {
    switch (status) {
      // case "pending":
      //   return (
      //     <div>
      //       Pending
      //     </div>
      //   );

      case "accepted":
        return (
          <div className="flex sm:flex-col items-center sm:items-stretch gap-2 sm:w-full">
            <CustomButton
              btnText={
                <div className="flex items-center justify-center gap-2 h-full">
                  <MessageCircle size={18} />
                  <p className="Livvic-Medium whitespace-nowrap">Chat</p>
                </div>
              }
              className="
      bg-[#38AEE3] 
      text-white 
      !px-4 
      !py-2 
      !h-[44px] 
      min-w-[100px]
      sm:w-full
      flex 
      items-center 
      justify-center
    "
            // action={() => handleMessage()}
            // isLoading={isLoading.accept}
            // loadingBtnText={...}
            />

            <CustomButton
              btnText={
                <div className="text-primary flex items-center justify-center gap-2 h-full">
                  <Ban size={18} />
                  <p className="Livvic-Medium whitespace-nowrap">Block</p>
                </div>
              }
              className="
      bg-white 
      border-2 
      border-gray-300 
      !px-4 
      !py-2 
      !h-[44px] 
      min-w-[100px]
      sm:w-full
      flex 
      items-center 
      justify-center
    "
              // action={() => handleMatchBlock(matchId, setIsLoading, dispatch)}
              isLoading={isLoading.block}
              loadingBtnText={
                <div className="flex items-center justify-center gap-2 h-full">
                  <p className="Livvic-Medium whitespace-nowrap">Waiting...</p>
                </div>
              }
            />
          </div>
        );

      default:
        return (
          handleMatchRequest ? (
            <CustomButton
              action={() =>
                handleMatchRequest(
                  user,
                  user._id,
                  userId,
                  setIsMatchRequestDenied,
                  setIsProfileComplete,
                  setIsRequestSubmitModal
                )
              }
              btnText={
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Users size={16} className="flex-shrink-0" />
                  <span className="Livvic-SemiBold text-sm sm:text-base whitespace-nowrap">
                    Request a Match
                  </span>
                  {!isProfileComplete && (
                    <LockKeyhole
                      size={16}
                      className="flex-shrink-0"
                    />
                  )}
                </div>
              }
              className="bg-[#38AEE3] text-white px-3 sm:px-5 md:px-6 py-2.5 sm:py-3 md:py-4 !rounded-xl"
            />
          ) : requestType === "incoming" ? (
            <div className="flex sm:flex-col items-center sm:items-stretch gap-2 sm:w-full">
              <CustomButton
                btnText={
                  <div className="flex items-center justify-center gap-2 h-full">
                    <Check size={18} />
                    <p className="Livvic-Medium whitespace-nowrap">Accept</p>
                  </div>
                }
                className="
      bg-green-500 
      text-white 
      !px-4 
      !py-2 
      !h-[44px] 
      min-w-[100px]
      sm:w-full
      flex 
      items-center 
      justify-center
    "
                action={() => handleRequestAccept(matchId, setIsLoading, dispatch, setMatchRequestSuccessModal, userId, setChatUserId)}
                isLoading={isLoading.accept}
                loadingBtnText={
                  <div className="flex items-center justify-center gap-2 h-full">
                    <p className="Livvic-Medium whitespace-nowrap">Accepting...</p>
                  </div>
                }
              />

              <CustomButton
                btnText={
                  <div className="text-primary flex items-center justify-center gap-2 h-full">
                    <X size={18} />
                    <p className="Livvic-Medium whitespace-nowrap">Not a fit</p>
                  </div>
                }
                className="
      bg-white 
      border-2 
      border-gray-300 
      !px-4 
      !py-2 
      !h-[44px] 
      min-w-[100px]
      sm:w-full
      flex 
      items-center 
      justify-center
    "
                action={() => handleRequestReject(matchId, setIsLoading, dispatch)}
                isLoading={isLoading.reject}
                loadingBtnText={
                  <div className="flex items-center justify-center gap-2 h-full">
                    <p className="Livvic-Medium whitespace-nowrap">Waiting...</p>
                  </div>
                }
              />
            </div>
          ) : (
            <div>
              Awaiting Response
            </div>
          )
        );
    }
  };


  return (
    <div className="max-w-[1400px] bg-white border border-[#ECECEC] rounded-3xl overflow-hidden">

      {/* ── CARD INNER ── */}
      <div className="flex flex-col md:flex-row md:items-stretch">

        {/* ── LEFT ── */}
        <div className="flex flex-col flex-1 px-4 py-4 sm:px-6 sm:py-5 md:px-7 md:py-6 min-w-0">

          {/* Avatar + top content row */}
          <div className="flex gap-3 sm:gap-5">

            {/* Avatar */}
            <div className="flex-shrink-0">
              {img ? (
                <img
                  src={img}
                  alt={name}
                  className="w-28 h-28 sm:w-24 sm:h-24 md:w-36 md:h-36 lg:w-48 lg:h-48 rounded-2xl object-cover"
                />
              ) : (
                <Avatar name={name} round color="#38AEE3" className="!w-28 !h-28 sm:!w-24 sm:!h-24 md:!w-36 md:!h-36 lg:!w-48 lg:!h-48 !rounded-2xl" />
              )}
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 min-w-0">

              {/* Top row: Badge + Heart (mobile only) */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 Livvic-Medium bg-[#FFF3EA] text-[#C4621A] rounded-full px-3 py-1 text-xs sm:text-sm Livvic-Medium flex-shrink-0">
                  <Users size={12} className="sm:hidden" />
                  <Users size={13} className="hidden sm:block" />
                  Nanny
                  <span className="opacity-30">•</span>
                  <span className="Livvic-Medium">{goal}</span>
                </span>

                {/* Heart button — mobile only (top-right of content) */}
                <button
                  onClick={favourite}
                  aria-label={isFavorited ? "Remove from favourites" : "Add to favourites"}
                  className="md:hidden bg-transparent border-none cursor-pointer p-1 flex-shrink-0"
                >
                  <Heart
                    size={20}
                    className={isFavorited ? "text-red-500 fill-red-500" : "text-[#0D134C]"}
                  />
                </button>
              </div>

              {/* Name */}
              <h2 className="text-lg sm:text-xl md:text-2xl Livvic-SemiBold text-[#0D134C] mb-1 truncate">
                {name.split(" ")[0]}
              </h2>

              {/* Experience + Ages */}
              <p className="text-sm text-[#5D5D5D] mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
                {experience && (
                  <span className="Livvic-Medium text-sm sm:text-base text-[#202020]">
                    {experience} experience
                  </span>
                )}
                {experience && formattedAges && <span>•</span>}
                {formattedAges && (
                  <span className="Livvic-Medium text-sm sm:text-base text-[#202020] break-words">
                    {formattedAges}
                  </span>
                )}
              </p>

              {/* Meta items — desktop inline (md+), hidden on mobile */}
              <div className="hidden md:flex flex-wrap gap-x-6 gap-y-3 mt-4">
                {metaItems}
              </div>

            </div>
          </div>

          {/* Meta items — mobile full-width below avatar row (hidden on md+) */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-3 md:hidden">
            {metaItems}
          </div>

        </div>

        {/* ── VERTICAL DIVIDER (desktop only) ── */}
        <div className="hidden md:block w-px bg-[#E9E9E9] my-4 flex-shrink-0" />

        {/* ── HORIZONTAL DIVIDER (mobile only) ── */}
        <div className="block md:hidden h-px bg-[#E9E9E9] mx-4 sm:mx-5" />

        {/* ── RIGHT PANEL ── */}
        {/* Mobile: action buttons in a row. Desktop: vertical column */}
        <div className="
          flex items-center justify-between gap-2 px-4 py-3 
          md:flex-col md:justify-start md:p-4
          md:w-[260px] lg:w-[300px] md:gap-3
          flex-shrink-0
        ">

          {/* Heart — desktop only (top-right) */}
          <button
            onClick={favourite}
            aria-label={isFavorited ? "Remove from favourites" : "Add to favourites"}
            className="
              hidden md:block
              bg-transparent border-none cursor-pointer p-1 md:self-end md:mb-4
            "
          >
            <Heart
              className={isFavorited ? "text-red-500 fill-red-500" : "text-[#0D134C]"}
            />
          </button>

          {/* View Details */}
          <button className="
            flex items-center gap-1 bg-transparent border-none cursor-pointer
            text-primary Livvic-SemiBold text-sm whitespace-nowrap mb-2
          ">
            View Details
            <ChevronRight size={16} />
          </button>

          {/* Request Match */}
          <ButtonAreaText />

        </div>
      </div>
    </div>
  );
};

/* ── Helper: metadata cell ── */
const formatScheduleDays = (schedule) => {
  if (!schedule) return "";

  const dayOrder = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const shortDays = {
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
    Sunday: "Sun",
  };

  const activeDays = dayOrder.filter(
    (day) => schedule?.[day]?.checked
  );

  if (!activeDays.length) return "";

  const indexes = activeDays.map((day) => dayOrder.indexOf(day));

  const ranges = [];
  let start = indexes[0];
  let prev = indexes[0];

  for (let i = 1; i < indexes.length; i++) {
    if (indexes[i] !== prev + 1) {
      ranges.push([start, prev]);
      start = indexes[i];
    }

    prev = indexes[i];
  }

  ranges.push([start, prev]);

  return ranges
    .map(([s, e]) =>
      s === e
        ? shortDays[dayOrder[s]]
        : `${shortDays[dayOrder[s]]}–${shortDays[dayOrder[e]]}`
    )
    .join(", ");
};


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
            className="bg-black rounded-full w-20 h-20 object-cover"
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
    //     <p className="my-2 Livvic-Bold text-2xl">{name}</p>
    //   </div>

    //   <p className="Livvic-Medium flex-1">
    //     {intro.length > 400 ? `${intro.substring(0, 400)}...` : intro}
    //   </p>

    //   <div>
    //     {loc && (
    //       <p className="my-2 Livvic-SemiBold text-lg">{loc?.format_location}</p>
    //     )}
    //     {/* {zipCode && <p className="my-2 Livvic-SemiBold text-lg">{zipCode}</p>} */}

    //     <div className="flex justify-between items-center">
    //       {!nanny ? (
    //         <p>
    //           {hr && (
    //             <span className="Livvic-SemiBold">
    //               {hr}hr <span className="font-normal">with kids | </span>
    //             </span>
    //           )}
    //           <span className="Livvic-SemiBold">{exp}</span> experience
    //         </p>
    //       ) : (
    //         <p>
    //           <span className="Livvic-SemiBold">
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
          <span className=" flex items-center gap-1">
            <span className="Livvic-Medium items-center text-sm text-[#222222] flex gap-4">
              {img ? (
                <img
                  className="bg-black mx-auto rounded-full w-6 h-6 object-cover"
                  src={img}
                  alt="img"
                />
              ) : (
                <Avatar
                  className="rounded-full text-black"
                  size="24"
                  color={"#38AEE3"}
                  name={name
                    ?.split(" ") // Split by space
                    .slice(0, 2) // Take first 1–2 words
                    .join(" ")}
                />
              )}
            </span>
            <span className="underline onboarding-form-label">{name}</span>
          </span>
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

// export const NannyProfile = ({
//   type,
//   goal,
//   name,
//   id,
//   sharedRate,
//   rateType,
//   location,
//   bio,
//   experience,
//   distance,
//   roles,
//   img,
//   created,
// }) => {
//   const { user, accessToken } = useSelector((state) => state.auth);
//   const [isFavorited, setIsFavorited] = useState(user.favourite?.includes(id));
//   const dispatch = useDispatch();
//   const favourite = () => {
//     dispatch(
//       addOrRemoveFavouriteThunk({ favouriteUserId: id, accessToken })
//     );
//     dispatch(refreshTokenThunk());
//     setIsFavorited((prev) => !prev)
//   };
//   return (
//       <div className="onboarding-box w-full max-w-[700px] h-auto">
//         <div className="flex flex-col sm:flex-row gap-4">
//           {img ? (
//             <img
//               className="bg-black w-full sm:w-[200px] md:w-[250px] h-[200px] sm:h-[280px] md:h-[340px] object-cover rounded-2xl flex-shrink-0"
//               src={img}
//               alt="img"
//             />
//           ) : (
//             <div className="flex-shrink-0 flex justify-center sm:justify-start">
//               <Avatar
//                 className="rounded-full text-black"
//                 size="24"
//                 color={"#38AEE3"}
//                 name={name
//                   ?.split(" ")
//                   .slice(0, 2)
//                   .join(" ")}
//               />
//             </div>
//           )}

//           <div className="w-full min-w-0">
//             <div className="flex justify-between w-full mb-0 sm:mb-2">
//               <div className="flex gap-2 items-center flex-wrap">
//                 <div className="rounded-full py-1 px-4 bg-[#FAF5FF] text-[#F06292] flex gap-2">
//                   <span className="text-md Livvic-Medium ">{type}</span> <span className="text-md Livvic-Medium ">●</span> <span className="text-md Livvic-Medium ">{goal}</span>
//                 </div>
//               </div>
//               <div
//                 className="p-2 flex justify-center items-center rounded-full flex-shrink-0 ml-2"
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   e.preventDefault();
//                   favourite();
//                 }}
//               >
//                 {isFavorited ? (
//                   <HeartFilled className="text-red-500 cursor-pointer" style={{ fontSize: '30px' }} />
//                 ) : (
//                   <Heart className="text-secondary cursor-pointer" height={30} width={30} />
//                 )}
//               </div>
//             </div>

//             <p className="Livvic-Bold text-xl md:text-2xl leading-loose truncate">{name}</p>
//             <p className="Livvic text-base md:text-lg text-gray-400 line-clamp-2 sm:line-clamp-1">
//               {bio?.substring(0, 40)}...
//             </p>

//             <div className="flex flex-wrap gap-4 my-3">
//               <div className="flex gap-2 items-center text-gray-500">
//                 <Briefcase size={20} />
//                 <p className=" Livvic-Medium text-sm md:text-base">{experience}</p>
//               </div>
//               <div className="flex gap-1 items-center text-gray-500">
//                 <MapPin size={20} />
//                 <p className=" Livvic-Medium text-sm md:text-base">{location.neighborhood ?? distance}</p>
//               </div>
//               <div className="flex gap-1 items-center text-gray-500">
//                 <DollarSign size={20} />
//                 <p className=" Livvic-Medium text-sm md:text-base">${sharedRate}/{rateType === "hourly" ? "hr" : "wk"}</p>
//               </div>
//             </div>

//             <hr />

//             <div className="mt-2 mb-4">
//               <p className="Livvic-SemiBold text-gray-700 mb-2 text-sm md:text-base">Expertise</p>
//               <div className="flex flex-wrap gap-2">
//                 {roles.length > 0 &&
//                   roles.map((role, i) => (
//                     <div
//                       key={i}
//                       className="px-3 py-1 Livvic-Medium bg-[#FAF5FF] text-[#F06292] rounded-full text-xs md:text-sm"
//                     >
//                       {role}
//                     </div>
//                   ))}
//               </div>
//             </div>
//           </div>
//         </div>
//         <div className="flex gap-4 justify-center mt-4">
//           <CustomButton btnText={"View Profile"} className="border border-gray-300 w-1/2 !rounded-lg !py-3" />
//           <CustomButton btnText={<div className="flex justify-center gap-2 items-center">
//             <LockKeyhole size={20} className="text-white" />
//             <p className="Livvic-Medium text-white">Request Match</p>
//           </div>} className="bg-[#3AAAE4] w-1/2 !rounded-lg !py-3" />
//         </div>
//       </div>
//   );
// } 