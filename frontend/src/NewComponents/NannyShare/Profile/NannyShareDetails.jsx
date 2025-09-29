import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import Loader from "../../../Components/subComponents/loader";
import { Avatar } from "antd";
import { formatCreatedAt, formatTimeRange } from "../../../Config/helpFunction";
import { MapPin, Calendar, Clock, ArrowLeftIcon } from "lucide-react";
import { deleteNannyShareThunk, fetchNannyShareByIdThunk } from "../../../Components/Redux/nannyShareSlice";
import { SwalFireDelete } from "../../../swalFire";
import { Card, Tag, Spin } from "antd";
import { createChatThunk } from "../../../Components/Redux/chatSlice";
import { fireToastMessage } from "../../../toastContainer";
import CustomButton from "../../Button";
import { getSubscriptionStatusThunk } from "../../../Components/Redux/cardSlice";

function formatLocation(loc) {
  if (!loc?.format_location) return "Neighborhood";
  const parts = loc.format_location.split(",") || [];
  const city = parts.at(-3)?.trim();
  const state = parts.at(-2)?.trim().split(" ")[0];
  return city && state ? `${city}, ${state}` : "Neighborhood";
}

function NannyShareDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [share, setShare] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { data, isLoading } = useSelector((state) => state.postNannyShare);
  const title = `${formatLocation(data.user?.location)} • ${data.nannyShareType || data.otherShareTypeSpecify || "Nanny Share"}`;

  useEffect(() => {
    dispatch(fetchNannyShareByIdThunk(id));
  }, [dispatch, id]);

  const subscription = useSelector((state) => state.cardData.subscriptionStatus);
  const isSubscribed = subscription?.active;

  useEffect(() => {
    dispatch(getSubscriptionStatusThunk());
  }, [dispatch]);

  const handleDeleteClick = () => {
    const handleDelete = async () => {
      try {
        await dispatch(deleteNannyShareThunk(id));
        fireToastMessage({ message: "Nanny Share job deleted successfully" });
        navigate("/family/nannyShare");
      } catch (err) {
        fireToastMessage({ type: "error", message: err.message });
      }
    };
    SwalFireDelete({
      title: "Are you sure for delete this nanny share job",
      handleDelete,
    });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleMessage = async () => {
    try {
      const participants = [share?.user?._id, user._id];
      const { status } = await dispatch(createChatThunk({ participants })).unwrap();
      if (status === 201 || status === 200) {
        navigate(`/family/message/`);
      }
    } catch (error) {
      console.log(error);
      fireToastMessage({ type: "error", message: error.message });
    }
  };

  return (
    <div className="padding-navbar1 w-full flex flex-col items-center">
      {isLoading ? (
        <Loader />
      ) : (
        <div className="relative min-h-screen padding-navbar1 w-full flex flex-col items-center space-y-4 py-2">
          <div
            className="shadow-soft lg:fixed p-2 self-start rounded-full cursor-pointer z-30"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon className="w-9 h-9 " />
          </div>

          {!isSubscribed && data?.user?._id !== user._id  ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm">
              <div className="z-20 bg-white px-8 py-6 rounded-xl text-center w-[90%] max-w-[400px]">
                <p className="text-2xl text-center Livvic-SemiBold text-primary mb-2 whitespace-break-spaces">
                  Upgrade to see the <br/>Nanny share details
                </p>
                <p className="mb-4 text-center text-primary Livvic-Medium text-sm">
                  Upgrade now to see past messages and continue your conversation
                </p>
                <CustomButton
                  btnText={"Upgrade Now"}
                  action={() => navigate("/family/pricing")}
                  className="bg-[#D6FB9A] text-[#025747] Livvic-SemiBold text-sm"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="w-full flex flex-col items-center space-y-4 py-2">
                <div className="shadow-soft p-6 w-full lg:w-1/2 rounded-[20px] space-y-2">
                  <div className="flex justify-between items-center">
                    <h1 className="Livvic-SemiBold text-2xl text-primary">{title}</h1>
                    <div className="py-2 px-4 rounded-full bg-[#ECF1FF] Livvic-SemiBold text-sm">
                      {data?.user?.nannyShareType || "Other"}
                    </div>
                  </div>
                  <p className="Livvic-Medium items-center text-sm text-[#555555] flex gap-4">
                    <MapPin className="w-5 h-5" /> {formatLocation(data?.user?.location)}
                  </p>
                  {data.Seasonal?.startDate && data.Seasonal?.endDate && (
                    <p className="Livvic-Medium items-center text-sm text-[#555555] flex gap-4">
                      <Clock className="w-5 h-5" />
                      {`${new Date(data.Seasonal.startDate).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })} – ${new Date(data.Seasonal.endDate).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}`}
                    </p>
                  )}
                  {data?.numberOfChildren?.length > 0 && (
                    <p className="Livvic-Medium items-center text-sm text-[#555555] flex gap-4">
                      <img src="/care-person.svg" alt="nanny" /> {data?.numberOfChildren} kids (
                      {data?.childrenAges?.map((age) => `${age}yr`).join(", ")})
                    </p>
                  )}
                  <p className="Livvic-Medium items-center text-sm text-[#555555] flex gap-4">
                    <Calendar className="w-5 h-5" /> {formatCreatedAt(data.createdAt)}
                  </p>
                  <p className="Livvic-Medium items-center text-sm text-[#222222] flex gap-4">
                    <Avatar size={24} src={data.user?.imageUrl}>
                      {!data.user?.imageUrl &&
                        data.user?.name
                          ?.split(" ")
                          .map((word) => word[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                    </Avatar>
                    {data?.user?.name}
                  </p>
                </div>

                {/* Budget & Communication */}
                <div className="shadow-soft p-6 w-full lg:w-1/2 rounded-[20px] space-y-2">
                  <h1 className="Livvic-SemiBold text-2xl text-primary mb-4">Budget & Communication</h1>
                  <div className="text-sm text-gray-700 space-y-2">
                    {(data.communicationPreference || data.communicationSpecify) && (
                      <p className="text-[#555555] Livvic-Medium">
                        • Communication Preference
                        <span className="text-[#555555] Livvic-SemiBold">
                          {`: ${data.communicationPreference}, ${
                            data.communicationSpecify ? `${data.communicationSpecify} (specified)` : ""
                          }`}
                        </span>
                      </p>
                    )}
                    {(data.backupCare || data.backupCareSpecify) && (
                      <p className="text-[#555555] Livvic-Medium">
                        • Backup Care
                        <span className="text-[#555555] Livvic-SemiBold">
                          {`: ${data.backupCare}, ${
                            data.backupCareSpecify ? `${data.backupCareSpecify} (specified)` : ""
                          }`}
                        </span>
                      </p>
                    )}
                    {data.involvementLevel && (
                      <p className="text-[#555555] Livvic-Medium">
                        • Involvement
                        <span className="text-[#555555] Livvic-SemiBold">{`: ${data.involvementLevel}`}</span>
                      </p>
                    )}

                    {(data.hourlyBudget) && (
                      <div className="text-[#555555] Livvic-Medium space-y-2">
                        {data.hourlyBudget && (
                          <p className="text-[#555555] Livvic-Medium">
                            • Rate:{" "}
                            <span className="Livvic-SemiBold">{`$${data.hourlyBudget.min} – $${data.hourlyBudget.max}/hr`}</span>
                          </p>
                        )}
                        {data.hourlyBudget && (
                          <p className="text-[#555555] Livvic-Medium">
                            • Share:{" "}
                            <span className="Livvic-SemiBold">{`$${data.hourlyBudget.minShare} – $${data.hourlyBudget.maxShare}/hr per family`}</span>
                          </p>
                        )}
                        {data.hourlyBudgetSpecify && (
                          <p className="text-[#555555] Livvic-Medium">
                            • My share (specified):{" "}
                            <span className="Livvic-SemiBold">{`$${data.hourlyBudgetSpecify}/hr`}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="shadow-soft p-6 w-full lg:w-1/2 rounded-[20px] space-y-2">
                  <h1 className="Livvic-SemiBold text-2xl text-primary mb-4">Details</h1>
                  <div className="text-sm text-gray-700 space-y-2">
                    <p className="text-[#555555] Livvic-Medium">
                      • Flexibility
                      <span className="text-[#555555] Livvic-SemiBold">{data.flexibility ? `: ${data.flexibility}` : ""}</span>
                    </p>
                    <p className="text-[#555555] Livvic-Medium">
                      • Hosting
                      <span className="text-[#555555] Livvic-SemiBold">{data.hostingPreference ? `: ${data.hostingPreference}` : ""}</span>
                    </p>
                    {data.childrenSchools && (
                      <p className="text-[#555555] Livvic-Medium">
                        • Children Schools
                        <span className="text-[#555555] Livvic-SemiBold">{`: ${data.childrenSchools}`}</span>
                      </p>
                    )}
                    {data.allergiesHealth?.length > 0 && (
                      <p className="text-[#555555] Livvic-Medium">
                        • Allergies
                        <span className="text-[#555555] Livvic-SemiBold">
                          {`: ${data.allergiesHealth?.join(", ")}, ${data.allergiesHealthSpecify ? `${data.allergiesHealthSpecify} (specified)` : ""}`}
                        </span>
                      </p>
                    )}
                    {data.childResponsibilities?.length > 0 && (
                      <p className="text-[#555555] Livvic-Medium">
                        • Responsibilities
                        <span className="text-[#555555] Livvic-SemiBold">{`: ${data.childResponsibilities.join(", ")}`}</span>
                      </p>
                    )}
                    {data.householdAddOns?.length > 0 && (
                      <p className="text-[#555555] Livvic-Medium">
                        • Household AddOns
                        <span className="text-[#555555] Livvic-SemiBold">{`: ${data.householdAddOns.join(", ")}`}</span>
                      </p>
                    )}
                    {(data.parentingStyle?.length > 0 || data.parentingStyleSpecify) && (
                      <p className="text-[#555555] Livvic-Medium">
                        • Parenting Style
                        <span className="text-[#555555] Livvic-SemiBold">
                          {`: ${data.parentingStyle?.join(", ")}, ${data.parentingStyleSpecify ? `${data.parentingStyleSpecify} (specified)` : ""}`}
                        </span>
                      </p>
                    )}
                    {(data.houseRules?.length > 0 || data.houseRulesSpecify) && (
                      <p className="text-[#555555] Livvic-Medium">
                        • House Rules
                        <span className="text-[#555555] Livvic-SemiBold">
                          {`: ${data.houseRules?.join(", ")}, ${data.houseRulesSpecify ? `${data.houseRulesSpecify} (specified)` : ""}`}
                        </span>
                      </p>
                    )}
                    {data.dailyRoutine?.length > 0 && (
                      <p className="text-[#555555] Livvic-Medium">
                        • Daily Routine
                        <span className="text-[#555555] Livvic-SemiBold">{`: ${data.dailyRoutine?.join(", ")}`}</span>
                      </p>
                    )}
                    {(data.pets?.length > 0 || data.petsSpecify) && (
                      <p className="text-[#555555] Livvic-Medium">
                        • Pets
                        <span className="text-[#555555] Livvic-SemiBold">{`: ${data.pets?.join(", ")}, ${data.petsSpecify ? `${data.petsSpecify} (specified)` : ""}`}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Schedule */}
                <div className="shadow-soft p-6 w-full lg:w-1/2 rounded-[20px] space-y-2">
                  <h1 className="Livvic-SemiBold text-2xl text-primary mb-4">Schedule</h1>
                  {data?.specificDays &&
                    Object.entries(data.specificDays).map(([day, time], idx) => (
                      <div key={idx}>
                        <p className="text-[#555555] Livvic-SemiBold">• {day}</p>
                        <p className="text-[#666666] Livvic-Medium">{formatTimeRange(time.start, time.end)}</p>
                      </div>
                    ))}
                </div>

                {/* Care Description */}
                {data.careDescription && (
                  <div className="shadow-soft p-6 w-full lg:w-1/2 rounded-[20px] space-y-2">
                    <h1 className="Livvic-SemiBold text-2xl text-primary mb-4">Care Description</h1>
                    <div className="text-sm text-gray-700 space-y-2">
                      <p className="text-[#555555] Livvic-Medium">{data.careDescription}</p>
                    </div>
                  </div>
                )}

                {/* Open Note */}
                <div className="shadow-soft p-6 w-full lg:w-1/2 rounded-[20px] space-y-2">
                  <h1 className="Livvic-SemiBold text-2xl text-primary mb-4">Open Note for Family</h1>
                  <div className="text-sm text-gray-700 space-y-2">
                    {data.openNotes && <p className="text-[#555555] Livvic-Medium">{data.openNotes}</p>}
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-2 mt-4">
                {data?.user?._id !== user._id && (
                  <CustomButton btnText={"Message"} action={handleMessage} className="bg-[#AEC4FF]" />
                )}
                {data?.user?._id === user._id && (
                  <>
                    <CustomButton btnText={"Delete"} action={handleDeleteClick} className="bg-[#FF8484] text-white" />
                    <CustomButton
                      btnText={"Edit"}
                      action={() => navigate(`/family/nannyShareEdit/${id}`)}
                      className="text-[#555555] border border-[#EEEEEE]"
                    />
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default NannyShareDetails;
