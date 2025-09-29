import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  deleteNannyShareThunk,
  fetchNannyShareByIdThunk,
  updateNannyShareThunk,
} from "../../Redux/nannyShareSlice";
import Loader from "../../subComponents/loader";
import Avatar from "react-avatar";
import {
  checkEmptyFields,
  findMatchingRate,
  parseHourlyRate,
  step10Data,
  step11Data,
  step12Data,
  step13Data,
  step2Data,
  step3Data,
  step4Data,
  step5Data,
  step6Data,
  step7Data,
  step8Data,
  step9Data,
} from "../../../Config/helpFunction";
import { Checkbox, Input, Radio, TimePicker } from "antd";
import moment from "moment";
import { fireToastMessage } from "../../../toastContainer";
import { SwalFireDelete } from "../../../swalFire";
import { createChatThunk } from "../../Redux/chatSlice";
import Button from "../../../NewComponents/Button";
import CustomButton from "../../../NewComponents/Button";

export const NannyShareView = () => {
  const { id } = useParams();
  const { TextArea } = Input;
  const dispatch = useDispatch();
  const [editMode, setEditMode] = useState(false);
  const [editableData, setEditableData] = useState({});
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const requiredFields = [
    "jobDescription",
    "schedule",
    "noOfChildren",
    "style",
    "responsibility",
    "hourlyRate",
    "pets",
    "communicate",
    "backupCare",
    "involve",
    "activity",
    "scheduleAndArrangement",
    "healthConsideration",
    "guideline",
  ];
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const { data, isLoading } = useSelector((state) => state.postNannyShare);
  const subscription = useSelector(
    (state) => state.cardData.subscriptionStatus
  );
  const isSubscribed = subscription?.active;

  const [daysState, setDaysState] = useState(() => {
    return days.reduce((acc, day) => {
      const specificDay = data?.specificDays?.[day];
      acc[day] = {
        checked: !!specificDay,
        start: specificDay?.start || null,
        end: specificDay?.end || null,
      };
      return acc;
    }, {});
  });

  const handleCheckboxChange = (day) => {
    setDaysState((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        checked: !prev[day]?.checked,
      },
    }));
  };

  console.log("Nanny share", data);

  const handleTimeChange = (day, type, time) => {
    setDaysState((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [type]: time ? time.toISOString() : null,
      },
    }));
  };

  useEffect(() => {
    dispatch(fetchNannyShareByIdThunk(id));
  }, [id]);

  useEffect(() => {
    if (editMode && data) {
      setEditableData(data);
      const initialDaysState = days.reduce((acc, day) => {
        const dayData = data.specificDays[day];
        acc[day] = {
          checked: !!dayData?.checked,
          start: dayData?.start || null,
          end: dayData?.end || null,
        };
        return acc;
      }, {});
      setDaysState(initialDaysState);
    }
  }, [editMode, data]);

  const handleEditClick = async () => {
    if (!editMode) {
      setEditMode(true);
    } else {
      const checkedDays = Object.entries(daysState)
        .filter(([day, data]) => data.checked) // Keep only those with checked: true
        .reduce((acc, [day, data]) => {
          // Convert start and end times to string (ISO format or any preferred format)
          const start = moment(data.start).toISOString(); // Convert to ISO string
          const end = moment(data.end).toISOString(); // Convert to ISO string

          acc[day] = {
            ...data,
            start, // Replace the start time with a string
            end, // Replace the end time with a string
          };
          return acc;
        }, {});

      const selectedDays = Object.entries(checkedDays).filter(
        ([day, { checked }]) => checked
      );

      if (selectedDays.length === 0) {
        fireToastMessage({
          type: "error",
          message: "At least one day must be selected.",
        });
        return;
      }

      let allValid = true; // Flag to check if all selected days have valid start and end times
      let invalidDays = [];

      // Loop through selected days to ensure each has a valid start and end time
      selectedDays.forEach(([day, { start, end }]) => {
        // Convert start and end to moment objects if they are strings in ISO format
        const parsedStart = moment(start);
        const parsedEnd = moment(end);

        // Check if the moment objects are valid
        if (!parsedStart.isValid() || !parsedEnd.isValid()) {
          allValid = false;
          invalidDays.push(day); // Collect days with invalid start or end times
        } else if (parsedStart.isSame(parsedEnd)) {
          allValid = false;
          invalidDays.push(day); // Collect days where start and end are the same
        } else if (parsedEnd.isBefore(parsedStart)) {
          // Error if end time is before start time
          allValid = false;
          invalidDays.push(day); // Collect days where end is before start
        }
      });

      if (!allValid) {
        fireToastMessage({
          type: "error",
          message: `The following selected days have invalid start or end times: ${invalidDays.join(
            ", "
          )}`,
        });
        return;
      }
      const updatedPayload = {
        ...editableData,
        specificDays: checkedDays,
      };
      const emptyFields = checkEmptyFields(updatedPayload, requiredFields);
      if (emptyFields.length > 0) {
        fireToastMessage({
          type: "error",
          message: `The following fields cannot be empty: ${emptyFields.join(
            ", "
          )}`,
        });
        return;
      }
      try {
        const { message } = await dispatch(
          updateNannyShareThunk({ id, body: updatedPayload })
        ).unwrap();
        fireToastMessage({ message: message });
        setEditMode(false);
      } catch (err) {
        fireToastMessage({ type: "error", message: err.message });
      }
    }
  };

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
  const handleMessage = async () => {
    console.log(data?.user?._id, user._id);
    try {
      const participants = [data?.user?._id, user._id];
      const { status } = await dispatch(
        createChatThunk({ participants })
      ).unwrap();
      if (status == 201 || status == 200) {
        navigate(`/family/message/`);
      }
    } catch (error) {
      console.log(error);
      fireToastMessage({ type: "error", message: error.message });
    }
  };
  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="relative padding-navbar1 Quicksand">
          {!isSubscribed && data?.user?._id !== user._id && (
            <>
              <div className="absolute inset-0 z-10 backdrop-blur-sm bg-white/50 w-full h-full min-h-full" />
              <div className="absolute z-20 top-[20%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-8 py-6 rounded-xl shadow-xl text-center w-[400px]">
                <p className="text-2xl Livvic-SemiBold text-primary mb-2 whitespace-break-spaces">
                  Upgrade to see the Nanny share details
                </p>
                <p className="mb-4 text-primary Livvic-Medium text-sm">
                  Unlock full details and messaging
                </p>
                <CustomButton
                  btnText={"Upgrade Now"}
                  action={() => navigate("../pricing")}
                  className="bg-[#D6FB9A] text-[#025747] Livvic-SemiBold text-sm"
                />
              </div>
            </>
          )}
          <p className="lg:text-4xl lg:mb-4 mb-2 text-2xl Livvic-SemiBold text-primary">
            Nanny Share
          </p>
          <div className="flex flex-col justify-between shadow-custom-shadow lg:p-8 p-4 rounded-2xl bg-white">
            {data?.user?.imageUrl ? (
              <img
                className="bg-black rounded-full w-20 h-20 object-contain"
                src={data?.user?.imageUrl}
                alt="img"
              />
            ) : (
              <Avatar
                className="rounded-full text-black"
                size="80"
                color={"#38AEE3"}
                name={
                  data?.user?.name
                    ?.split(" ") // Split by space
                    .slice(0, 2) // Take first 1–2 words
                    .join(" ") // Re-join them
                }
              />
            )}
            <p className="my-2 Livvic-SemiBold text-2xl">{data?.user?.name}</p>

            <div className="lg:my-4 my-2">
              <p className="Livvic-SemiBold text-lg">Job Description</p>

              {editMode ? (
                <div className="lg:mt-4 mt-2">
                  <TextArea
                    className="w-full border rounded-md p-2 mt-1 !resize-none"
                    rows={4}
                    placeholder="Write job description..."
                    value={editableData?.jobDescription || ""}
                    onChange={(e) =>
                      setEditableData((prev) => ({
                        ...prev,
                        jobDescription: e.target.value,
                      }))
                    }
                  />
                </div>
              ) : (
                <p className="text-[#555555] text-justify leading-5 lg:my-4 my-2 max-lg:text-sm">
                  {data?.jobDescription}
                </p>
              )}
            </div>
            <hr />

            <div className="lg:my-4 my-2">
              <p className="Livvic-SemiBold text-lg">Specific Days</p>
              <div className="flex flex-wrap justify-left gap-x-10 gap-y-5 lg:my-4 my-2">
                {editMode ? (
                  // ✅ Editable View
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {days.map((day) => (
                      <div className="flex mb-4" key={day}>
                        <div>
                          <Checkbox
                            checked={daysState[day]?.checked || false}
                            onChange={() => handleCheckboxChange(day)}
                            className="mr-4"
                          >
                            <span className="font-semibold text-lg">{day}</span>
                          </Checkbox>

                          <div className="flex items-center gap-4 mt-2">
                            <TimePicker
                              value={
                                daysState[day]?.start
                                  ? moment(daysState[day].start)
                                  : null
                              }
                              placeholder="Start"
                              onChange={(time) =>
                                handleTimeChange(day, "start", time)
                              }
                              disabled={!daysState[day]?.checked}
                              format="h:mm A"
                              className="rounded-lg date-picker1"
                            />
                            <span className="font-medium text-base">to</span>
                            <TimePicker
                              value={
                                daysState[day]?.end
                                  ? moment(daysState[day].end)
                                  : null
                              }
                              placeholder="End"
                              onChange={(time) =>
                                handleTimeChange(day, "end", time)
                              }
                              disabled={!daysState[day]?.checked}
                              format="h:mm A"
                              className="rounded-lg date-picker1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // 🔒 Read-Only View
                  <div className="flex flex-wrap justify-left gap-x-10 gap-y-5">
                    {data?.specificDays &&
                      days.map((day, index) => {
                        const dayData = data.specificDays[day];
                        return (
                          <div
                            key={index}
                            className={`pr-8 mt-2 ${
                              index < days.length - 1 ? "schdule-Border" : ""
                            }`}
                          >
                            <p className="text-lg text-[#55555] Livvic-SemiBold">
                              {day}
                            </p>
                            {dayData && dayData.checked ? (
                              <div className="flex gap-4">
                                <p>
                                  <span className="text-[#666666]">
                                    {new Date(dayData.start).toLocaleTimeString(
                                      [],
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                      }
                                    )}
                                  </span>
                                </p>
                                -
                                <p>
                                  <span className="text-[#666666]">
                                    {new Date(dayData.end).toLocaleTimeString(
                                      [],
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                      }
                                    )}
                                  </span>
                                </p>
                              </div>
                            ) : (
                              <p className="w-28  text-[#666666]">
                                I don't work on {day}
                              </p>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
            <hr />

            <div className="lg:my-4 my-2">
              <p className="text-lg Livvic-SemiBold">
                How flexible are you with scheduling and arrangements?
              </p>
              {editMode ? (
                <>
                  <Checkbox.Group
                    options={step2Data.map((option) => ({
                      label: option.name,
                      value: option.val,
                    }))}
                    value={editableData?.schedule || []}
                    onChange={(checkedValues) =>
                      setEditableData((prev) => ({
                        ...prev,
                        schedule: checkedValues,
                      }))
                    }
                  />
                  <div className="mt-4">
                    <p className="font-semibold">
                      Schedule Specify (optional):
                    </p>
                    <TextArea
                      value={editableData?.scheduleSpecify || ""}
                      onChange={(e) =>
                        setEditableData((prev) => ({
                          ...prev,
                          scheduleSpecify: e.target.value,
                        }))
                      }
                      className="w-full border rounded-md p-2 mt-1 !resize-none"
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="font-medium text-justify leading-5 lg:my-4 my-2 max-lg:text-sm px-4 py-2 border border-[#EEEEEE] rounded-full w-fit text-[#555555]">
                    {data?.schedule}
                  </p>
                  {data?.scheduleSpecify && (
                    <p className="font-medium text-justify leading-5 lg:mb-4 mb-2 max-lg:text-sm">
                      Schedule Specify: {data?.scheduleSpecify}
                    </p>
                  )}
                </>
              )}
            </div>
            <hr />

            <div className="lg:my-4 my-2">
              <p className="text-lg Livvic-SemiBold">
                Do you have a specific parenting style or philosophy?
              </p>
              {editMode ? (
                <>
                  <Radio.Group
                    options={step3Data.map((option) => ({
                      label: option.name,
                      value: option.val,
                    }))}
                    onChange={(e) =>
                      setEditableData((prev) => ({
                        ...prev,
                        style: e.target.value,
                      }))
                    }
                    value={editableData?.style}
                  />
                  <div className="mt-4">
                    <p className="font-semibold">Style Specify (optional):</p>
                    <TextArea
                      value={editableData?.styleSpecify || ""}
                      onChange={(e) =>
                        setEditableData((prev) => ({
                          ...prev,
                          styleSpecify: e.target.value,
                        }))
                      }
                      className="w-full border rounded-md p-2 mt-1 !resize-none"
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="font-medium text-justify leading-5 lg:my-4 my-2 max-lg:text-sm px-4 py-2 border border-[#EEEEEE] rounded-full w-fit text-[#555555]">
                    {data?.style}
                  </p>
                  {data?.styleSpecify && (
                    <p className="font-medium text-justify leading-5 lg:mb-4 mb-2 max-lg:text-sm">
                      Style Specify: {data?.styleSpecify}
                    </p>
                  )}
                </>
              )}
            </div>
            <hr />

            <div className="lg:my-4 my-2">
              <p className="text-lg Livvic-SemiBold">
                What responsibilities would you like the nanny to handle?
              </p>
              {editMode ? (
                <>
                  <Checkbox.Group
                    options={step4Data.map((option) => ({
                      label: option.name,
                      value: option.val,
                    }))}
                    value={editableData?.responsibility || []}
                    onChange={(checkedValues) =>
                      setEditableData((prev) => ({
                        ...prev,
                        responsibility: checkedValues,
                      }))
                    }
                  />
                  <div className="mt-4">
                    <p className="font-semibold">
                      Responsibility Specify (optional):
                    </p>
                    <TextArea
                      value={editableData?.responsibilitySpecify || ""}
                      onChange={(e) =>
                        setEditableData((prev) => ({
                          ...prev,
                          responsibilitySpecify: e.target.value,
                        }))
                      }
                      className="w-full border rounded-md p-2 mt-1 !resize-none"
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex gap-x-4 gap-y-2 flex-wrap lg:my-4 my-2">
                    {data?.responsibility &&
                      data?.responsibility?.map((v, i) => (
                        <p
                          key={i}
                          className="font-medium text-justify leading-5 max-lg:text-sm px-4 py-2 border border-[#EEEEEE] rounded-full w-fit text-[#555555]"
                        >
                          {v}
                        </p>
                      ))}
                  </div>
                  {data?.responsibilitySpecify && (
                    <p className="font-medium text-justify leading-5 lg:mb-4 mb-2 max-lg:text-sm">
                      Responsibility Specify: {data?.responsibilitySpecify}
                    </p>
                  )}
                </>
              )}
            </div>
            <hr />

            <div className="lg:my-4 my-2">
              <p className="text-lg Livvic-SemiBold">
                What is your hourly budget for a nanny share?
              </p>
              <p className="text-wrap">
                This is the total hourly rate for the nanny. If split between
                two families, you will each pay half of the selected amount.
              </p>
              {editMode ? (
                <>
                  <Radio.Group
                    options={step5Data.map((option) => ({
                      label: option.name,
                      value: option.val,
                    }))}
                    onChange={(e) =>
                      setEditableData((prev) => ({
                        ...prev,
                        hourlyRate: parseHourlyRate(e.target.value),
                      }))
                    }
                    value={findMatchingRate(editableData?.hourlyRate)}
                  />
                  <div className="mt-4">
                    <p className="font-semibold">
                      Hourly rate Specify (optional):
                    </p>
                    <TextArea
                      value={editableData?.hourlyRateSpecify || ""}
                      onChange={(e) =>
                        setEditableData((prev) => ({
                          ...prev,
                          hourlyRateSpecify: e.target.value,
                        }))
                      }
                      className="w-full border rounded-md p-2 mt-1 !resize-none"
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  {data?.hourlyRate && (
                    <p className="text-[#666666] text-justify lg:my-4 my-2 leading-5 max-lg:text-sm">
                      {findMatchingRate(data?.hourlyRate) || "Not specified"}
                    </p>
                  )}
                  {data?.hourlyRateSpecify && (
                    <p className="font-medium text-justify leading-5 lg:mb-4 mb-2 max-lg:text-sm">
                      Style Specify: {data?.hourlyRateSpecify}
                    </p>
                  )}
                </>
              )}
            </div>
            <hr />

            <div className="lg:my-4 my-2">
              <p className="text-lg Livvic-SemiBold">
                Do you have pets? If so, what kind?
              </p>

              {editMode ? (
                <>
                  <Radio.Group
                    options={step6Data.map((option) => ({
                      label: option.name,
                      value: option.val,
                    }))}
                    onChange={(e) =>
                      setEditableData((prev) => ({
                        ...prev,
                        pets: e.target.value,
                      }))
                    }
                    value={editableData?.pets}
                  />
                  <div className="mt-4">
                    <p className="font-semibold">Pets Specify (optional):</p>
                    <TextArea
                      value={editableData?.petsSpecify || ""}
                      onChange={(e) =>
                        setEditableData((prev) => ({
                          ...prev,
                          petsSpecify: e.target.value,
                        }))
                      }
                      className="w-full border rounded-md p-2 mt-1 !resize-none"
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="font-medium text-justify leading-5 lg:my-4 my-2 max-lg:text-sm">
                    {data?.pets}
                  </p>
                  {data?.petsSpecify && (
                    <p className="font-medium text-justify leading-5 lg:mb-4 mb-2 max-lg:text-sm">
                      Pets Specify: {data?.petsSpecify}
                    </p>
                  )}
                </>
              )}
            </div>
            <hr />

            <div className="lg:my-4 my-2">
              <p className="text-lg Livvic-SemiBold">
                How do you prefer to communicate and coordinate with another
                family?
              </p>

              {editMode ? (
                <>
                  <Radio.Group
                    options={step7Data.map((option) => ({
                      label: option.name,
                      value: option.val,
                    }))}
                    onChange={(e) =>
                      setEditableData((prev) => ({
                        ...prev,
                        communicate: e.target.value,
                      }))
                    }
                    value={editableData?.communicate}
                  />
                  <div className="mt-4">
                    <p className="font-semibold">
                      Communicate Specify (optional):
                    </p>
                    <TextArea
                      value={editableData?.communicateSpecify || ""}
                      onChange={(e) =>
                        setEditableData((prev) => ({
                          ...prev,
                          communicateSpecify: e.target.value,
                        }))
                      }
                      className="w-full border rounded-md p-2 mt-1 !resize-none"
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="font-medium text-justify leading-5 lg:my-4 my-2 max-lg:text-sm">
                    {data?.communicate}
                  </p>
                  {data?.communicateSpecify && (
                    <p className="font-medium text-justify leading-5 lg:mb-4 mb-2 max-lg:text-sm">
                      Communicate Specify: {data?.communicateSpecify}
                    </p>
                  )}
                </>
              )}
            </div>
            <hr />

            <div className="lg:my-4 my-2">
              <p className="text-lg Livvic-SemiBold">
                Do you have any backup care options in case the nanny is
                unavailable?
              </p>
              {editMode ? (
                <>
                  <Radio.Group
                    options={step8Data.map((option) => ({
                      label: option.name,
                      value: option.val,
                    }))}
                    onChange={(e) =>
                      setEditableData((prev) => ({
                        ...prev,
                        backupCare: e.target.value,
                      }))
                    }
                    value={editableData?.backupCare}
                  />
                  <div className="mt-4">
                    <p className="font-semibold">
                      Backup Care Specify (optional):
                    </p>
                    <TextArea
                      value={editableData?.backupCareSpecify || ""}
                      onChange={(e) =>
                        setEditableData((prev) => ({
                          ...prev,
                          backupCareSpecify: e.target.value,
                        }))
                      }
                      className="w-full border rounded-md p-2 mt-1 !resize-none"
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="font-medium text-justify leading-5 lg:my-4 my-2 max-lg:text-sm">
                    {data?.backupCare}
                  </p>
                  {data?.backupCareSpecify && (
                    <p className="font-medium text-justify leading-5 lg:mb-4 mb-2 max-lg:text-sm">
                      Backup Care Specify: {data?.backupCareSpecify}
                    </p>
                  )}
                </>
              )}
            </div>
            <hr />

            <div className="lg:my-4 my-2">
              <p className="text-lg Livvic-SemiBold">
                How involved do you want to be in daily activities and
                decision-making?
              </p>
              {editMode ? (
                <>
                  <Radio.Group
                    options={step9Data.map((option) => ({
                      label: option.name,
                      value: option.val,
                    }))}
                    onChange={(e) =>
                      setEditableData((prev) => ({
                        ...prev,
                        involve: e.target.value,
                      }))
                    }
                    value={editableData?.involve}
                  />
                  <div className="mt-4">
                    <p className="font-semibold">Involve Specify (optional):</p>
                    <TextArea
                      value={editableData?.involveSpecify || ""}
                      onChange={(e) =>
                        setEditableData((prev) => ({
                          ...prev,
                          involveSpecify: e.target.value,
                        }))
                      }
                      className="w-full border rounded-md p-2 mt-1 !resize-none"
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="font-medium text-justify leading-5 lg:my-4 my-2 max-lg:text-sm">
                    {data?.involve}
                  </p>
                  {data?.involveSpecify && (
                    <p className="font-medium text-justify leading-5 lg:mb-4 mb-2 max-lg:text-sm">
                      Involve Specify: {data?.involveSpecify}
                    </p>
                  )}
                </>
              )}
            </div>
            <hr />

            <div className="lg:my-4 my-2">
              <p className="text-lg Livvic-SemiBold">
                What is your daily routine and any specific activities you want
                to include?
              </p>

              {editMode ? (
                <>
                  <Checkbox.Group
                    options={step10Data.map((option) => ({
                      label: option.name,
                      value: option.val,
                    }))}
                    value={editableData?.activity || []}
                    onChange={(checkedValues) =>
                      setEditableData((prev) => ({
                        ...prev,
                        activity: checkedValues,
                      }))
                    }
                  />
                  <div className="mt-4">
                    <p className="font-semibold">
                      Activity Specify (optional):
                    </p>
                    <TextArea
                      value={editableData?.activitySpecify || ""}
                      onChange={(e) =>
                        setEditableData((prev) => ({
                          ...prev,
                          activitySpecify: e.target.value,
                        }))
                      }
                      className="w-full border rounded-md p-2 mt-1 !resize-none"
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex gap-x-4 gap-y-2 flex-wrap lg:my-4 my-2">
                    {data?.activity &&
                      data?.activity.map((v) => (
                        <p className="font-medium text-justify leading-5 max-lg:text-sm">
                          {v}
                        </p>
                      ))}
                  </div>
                  {data?.activitySpecify && (
                    <p className="font-medium text-justify leading-5 lg:mb-4 mb-2 max-lg:text-sm">
                      Activity Specify: {data?.activitySpecify}
                    </p>
                  )}
                </>
              )}
            </div>
            <hr />

            <div className="lg:my-4 my-2">
              <p className="text-lg Livvic-SemiBold">
                Do you have specific house rules or guidelines?
              </p>
              {editMode ? (
                <>
                  <Checkbox.Group
                    options={step11Data.map((option) => ({
                      label: option.name,
                      value: option.val,
                    }))}
                    value={editableData?.guideline || []}
                    onChange={(checkedValues) =>
                      setEditableData((prev) => ({
                        ...prev,
                        guideline: checkedValues,
                      }))
                    }
                  />
                  <div className="mt-4">
                    <p className="font-semibold">
                      Guideline Specify (optional):
                    </p>
                    <TextArea
                      value={editableData?.guidelineSpecify || ""}
                      onChange={(e) =>
                        setEditableData((prev) => ({
                          ...prev,
                          guidelineSpecify: e.target.value,
                        }))
                      }
                      className="w-full border rounded-md p-2 mt-1 !resize-none"
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex gap-x-4 gap-y-2 flex-wrap lg:my-4 my-2">
                    {data?.guideline &&
                      data?.guideline.map((v, i) => (
                        <p
                          key={i}
                          className="font-medium text-justify leading-5 max-lg:text-sm"
                        >
                          {v}
                        </p>
                      ))}
                  </div>
                  {data?.guidelineSpecify && (
                    <p className="font-medium text-justify leading-5 lg:mb-4 mb-2 max-lg:text-sm">
                      Guideline Specify: {data?.guidelineSpecify}
                    </p>
                  )}
                </>
              )}
            </div>
            <hr />

            <div className="lg:my-4 my-2">
              <p className="text-lg Livvic-SemiBold">
                Are there any allergies or health considerations the nanny
                should be aware of?
              </p>

              {editMode ? (
                <>
                  <Checkbox.Group
                    options={step12Data.map((option) => ({
                      label: option.name,
                      value: option.val,
                    }))}
                    value={editableData?.healthConsideration || []}
                    onChange={(checkedValues) =>
                      setEditableData((prev) => ({
                        ...prev,
                        healthConsideration: checkedValues,
                      }))
                    }
                  />
                  <div className="mt-4">
                    <p className="font-semibold">
                      Health Consideration Specify (optional):
                    </p>
                    <TextArea
                      value={editableData?.healthConsiderationSpecify || ""}
                      onChange={(e) =>
                        setEditableData((prev) => ({
                          ...prev,
                          healthConsiderationSpecify: e.target.value,
                        }))
                      }
                      className="w-full border rounded-md p-2 mt-1 !resize-none"
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex gap-x-4 gap-y-2 flex-wrap lg:my-4 my-2">
                    {data?.healthConsideration &&
                      data?.healthConsideration.map((v) => (
                        <p className="font-medium text-justify leading-5 max-lg:text-sm">
                          {v}
                        </p>
                      ))}
                  </div>
                  {data?.healthConsiderationSpecify && (
                    <p className="font-medium text-justify leading-5 lg:mb-4 mb-2 max-lg:text-sm">
                      Health Consideration Specify:{" "}
                      {data?.healthConsiderationSpecify}
                    </p>
                  )}
                </>
              )}
            </div>

            <hr />
            <div className="lg:mt-4 mt-2">
              <p className="text-lg Livvic-SemiBold">
                How flexible are you with scheduling and arrangements?
              </p>
              {editMode ? (
                <>
                  <Radio.Group
                    options={step13Data.map((option) => ({
                      label: option.name,
                      value: option.val,
                    }))}
                    onChange={(e) =>
                      setEditableData((prev) => ({
                        ...prev,
                        scheduleAndArrangement: e.target.value,
                      }))
                    }
                    value={editableData?.scheduleAndArrangement}
                  />
                  <div className="mt-4">
                    <p className="font-semibold">
                      Schedule & Arrangement Specify (optional):
                    </p>
                    <TextArea
                      value={editableData?.scheduleAndArrangementSpecify || ""}
                      onChange={(e) =>
                        setEditableData((prev) => ({
                          ...prev,
                          scheduleAndArrangementSpecify: e.target.value,
                        }))
                      }
                      className="w-full border rounded-md p-2 mt-1 !resize-none"
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="font-medium text-justify leading-5 lg:my-4 my-2 max-lg:text-sm">
                    {data?.scheduleAndArrangement}
                  </p>
                  {data?.scheduleAndArrangementSpecify && (
                    <p className="font-medium text-justify leading-5 lg:mb-4 mb-2 max-lg:text-sm">
                      Style Specify: {data?.scheduleAndArrangementSpecify}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex justify-center gap-2 lg:my-8 my-4">
            {user?._id == data?.user?._id && (
              <Button
                btnText={"Delete Job"}
                action={() => handleDeleteClick()}
                className="bg-[#FF8484] text-white"
              />
            )}

            <Button
              btnText={"Go Back"}
              action={() =>
                editMode ? setEditMode((prev) => !prev) : navigate(-1)
              }
              className="text-[#555555] border border-[#EEEEEE]"
            />
            {user?._id == data?.user?._id && (
              // <button
              //   onClick={handleEditClick}
              //   className=" bg-[#38AEE3] text-white lg:w-32 w-24 h-10 border-none rounded-full font-normal text-base transition hover:-translate-y-1 duration-700 delay-150 ease-in-out hover:scale-110"
              // >
              //   {editMode ? "Update Share" : "Edit Share"}
              // </button>
              <Button
                btnText={editMode ? "Update Share" : "Edit Share"}
                action={() => handleEditClick()}
                className="bg-[#AEC4FF]"
              />
            )}
            {user?._id != data?.user?._id && (
              // <button
              //   onClick={handleMessage}
              //   className=" text-[#38AEE3] bg-white border border-[#38AEE3] lg:w-32 w-24 h-10 rounded-full font-normal text-base transition hover:opacity-60 duration-700 delay-150 ease-in-out"
              // >
              //   Message
              // </button>
              <Button
                btnText={"Message"}
                action={() => handleMessage()}
                className="bg-[#AEC4FF]"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};
