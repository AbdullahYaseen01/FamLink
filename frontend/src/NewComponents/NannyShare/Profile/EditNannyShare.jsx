import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchNannyShareByIdThunk,
  updateNannyShareThunk,
} from "../../../Components/Redux/nannyShareSlice";
import Loader from "../../../Components/subComponents/loader";
import CustomButton from "../../Button";
import { Input, Select, Checkbox, TimePicker, Form, Space } from "antd";
import StartEndDatePicker from "../PostANannyShare/StartEndDatePicker";
import OnboardingDaySelector from "../../Caregivers/Onboarding/OnboardingDaySelector";
import SelectChildrenAge from "../PostANannyShare/SelectChildrenAge";
import { fireToastMessage } from "../../../toastContainer";

const parseTime = async (time) => {
  const { default: moment } = await import("moment");
  return time ? moment(time) : null;
};


const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function EditNannyShare() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data, isLoading } = useSelector((state) => state.postNannyShare);
  const [selectedValue, setSelectedValue] = useState(null);
  const updateSelectedValue = (updatedSelectedValue) => {
    setSelectedValue(updatedSelectedValue);
  };

  // Initialize the state in the parent component
  const [daysState, setDaysState] = useState(
    daysOfWeek.reduce((acc, day) => {
      acc[day] = { checked: false, start: null, end: null };
      return acc;
    }, {})
  );

  const [form] = Form.useForm();

  // local state for seasonal dates
  const [seasonalStart, setSeasonalStart] = useState(null);
  const [seasonalEnd, setSeasonalEnd] = useState(null);

  useEffect(() => {
    dispatch(fetchNannyShareByIdThunk(id));
  }, [dispatch, id]);

  console.log("Data", data);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (data) {
      const initialValues = {};

      // Only include fields that exist
      if (data.nannyShareType || data.otherShareTypeSpecify) {
        initialValues.nannyShareType = data.nannyShareType || "Other";
        initialValues.otherShareTypeSpecify = data.otherShareTypeSpecify || "";
      }
      if (data.flexibility) initialValues.flexibility = data.flexibility;
      if (data.hostingPreference)
        initialValues.hostingPreference = data.hostingPreference;
      if (data.numberOfChildren != null) {
        initialValues.numberOfChildren = data.numberOfChildren;
        setSelectedValue(data.numberOfChildren);
      }
      if (data.childrenAges?.length)
        initialValues.childrenAges = data.childrenAges;
      if (data.childrenSchools)
        initialValues.childrenSchools = data.childrenSchools;
      if (data.allergiesHealth?.length)
        initialValues.allergiesHealth = data.allergiesHealth;
      if (data.allergiesHealthSpecify)
        initialValues.allergiesHealthSpecify = data.allergiesHealthSpecify;
      if (data.careDescription)
        initialValues.careDescription = data.careDescription;
      if (data.openNotes) initialValues.openNotes = data.openNotes;
      if (data.hourlyBudget) {
        initialValues.hourlyBudget = {
          min: data.hourlyBudget.min,
          max: data.hourlyBudget.max,
          minShare: data.hourlyBudget.minShare,
          maxShare: data.hourlyBudget.maxShare,
        };
      }
      if (data.hourlyBudgetSpecify)
        initialValues.hourlyBudgetSpecify = data.hourlyBudgetSpecify;
      if (data.Seasonal?.startDate) {
        initialValues.seasonalStart = data.Seasonal.startDate;
        setSeasonalStart(new Date(data.Seasonal.startDate));
      }
      if (data.Seasonal?.endDate) {
        initialValues.seasonalEnd = data.Seasonal.endDate;
        setSeasonalEnd(new Date(data.Seasonal.endDate));
      }
      if (data.specificDays) {
        setDaysState(
          Object.fromEntries(
            daysOfWeek.map((day) => [
              day,
              {
                checked: data.specificDays[day]?.checked || false,
                start: data.specificDays[day]?.start
                  ? parseTime(data.specificDays[day].start)
                  : null,
                end: data.specificDays[day]?.end
                  ? parseTime(data.specificDays[day].end)
                  : null,
              },
            ])
          )
        );
      }

      form.setFieldsValue(initialValues);
    }
  }, [data, form]);

  const handleFinish = async (values) => {
    try {
      const childrenAges = Object.entries(values)
        .filter(([key, val]) => key.includes("_age") && val) // only ChildX_age keys with values
        .map(([key, ageStr]) => {
          const childIndex = key.split("_")[0]; // e.g., "Child1"
          const unitKey = `${childIndex}_unit`;
          const unit = values[unitKey] || "years"; // default to years if missing

          const num = Number(ageStr);

          // Validation: age must be > 0
          if (isNaN(num) || num <= 0) {
            fireToastMessage({
              type: "error",
              message: `Each child’s age must be greater than 0`,
            });
            throw new Error("stop-processing");
          }

          // Normalize to years
          if (unit === "months") {
            return `${(num / 12).toFixed(2)} yrs`; // convert months to years, keep 2 decimals
          }
          return `${num} yrs`;
        });

      const selectedDays = Object.entries(daysState).filter(
        ([day, { checked }]) => checked
      );

      if (selectedDays.length === 0) {
        fireToastMessage({
          type: "error",
          message: "Atleast select one day and time.",
        });
        return;
      }
      let allValid = true; // Flag to check if all selected days have valid start and end times
      let invalidDays = [];

      // Loop through selected days to ensure each has a valid start and end time
      selectedDays.forEach(([day, { start, end }]) => {
        if (!start || !end) {
          allValid = false;
          invalidDays.push(day); // Collect days with missing start or end times
        } else if (start.isSame(end)) {
          allValid = false;
          invalidDays.push(day); // Collect days where start and end are the same
        } else if (end.isBefore(start)) {
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
      const checkedDays = Object.entries(daysState)
        .filter(([day, data]) => data.checked) // Keep only those with checked: true
        .reduce((acc, [day, data]) => {
          // Convert start and end times to string (ISO format or any preferred format)
          const start = data.start.toISOString(); // Assuming start is a date object
          const end = data.end.toISOString(); // Assuming end is a date object

          acc[day] = {
            ...data,
            start, // Replace the start time with a string
            end, // Replace the end time with a string
          };
          return acc;
        }, {});

      const updatePayload = {
        ...values,
        childrenAges, // structured properly
        numberOfChildren: childrenAges.length,
        Seasonal: {
          startDate: values.seasonalStart?.toISOString(),
          endDate: values.seasonalEnd?.toISOString(),
        },
        specificDays: checkedDays,
      };

      // Strip out the raw ChildX_age/unit keys so they don't leak into payload
      Object.keys(updatePayload).forEach((key) => {
        if (
          key.includes("Child") &&
          (key.includes("_age") || key.includes("_unit"))
        ) {
          delete updatePayload[key];
        }
      });

      console.log("New update payload", updatePayload);

      const { message } = await dispatch(
        updateNannyShareThunk({ id, body: updatePayload })
      ).unwrap();
      fireToastMessage({ message: message });
      navigate(-1);
    } catch (err) {
      if (err.message !== "stop-processing") console.error(err);
    }
  };

  if (isLoading || !data) return <Loader />;

  return (
    <div className="padding-navbar1 w-full flex flex-col items-center">
      <div className="shadow-soft p-6 w-full lg:w-1/2 rounded-[20px]">
        <h1 className="Livvic-SemiBold text-2xl text-primary mb-4">
          Edit Nanny Share
        </h1>
        <Form
          layout="vertical"
          form={form}
          onFinish={handleFinish}
          className="space-y-4"
        >
          {/* Share Type */}
          {data.nannyShareType && (
            <Form.Item label="Share Type" name="nannyShareType">
              <Select
                options={[
                  { value: "Full-time", label: "Full-time" },
                  { value: "Part-time", label: "Part-time" },
                  { value: "Pickup/Drop-off", label: "Pickup/Drop-off" },
                  { value: "After-school", label: "After-school" },
                  { value: "Summer/Seasonal", label: "Summer/Seasonal" },
                  { value: "Other", label: "Other" },
                ]}
              />
            </Form.Item>
          )}

          {data.otherShareTypeSpecify && (
            <Form.Item label="Specify Other Type" name="otherShareTypeSpecify">
              <Input />
            </Form.Item>
          )}

          {data.flexibility && (
            <Form.Item label="Flexibility" name="flexibility">
              <Select
                options={[
                  { value: "Very flexible", label: "Very flexible" },
                  { value: "Somewhat flexible", label: "Somewhat flexible" },
                  { value: "Not flexible", label: "Not flexible" },
                ]}
              />
            </Form.Item>
          )}

          {data.hostingPreference && (
            <Form.Item label="Hosting Preference" name="hostingPreference">
              <Select
                options={[
                  { value: "Your home", label: "Your home" },
                  { value: "Other home", label: "Other home" },
                  {
                    value: "Rotating between homes",
                    label: "Rotating between homes",
                  },
                  { value: "Neutral", label: "Neutral" },
                ]}
              />
            </Form.Item>
          )}

          {/* {data.numberOfChildren && (
            <Form.Item label="Number of Children" name="numberOfChildren">
              <Input type="number" min={0} />
            </Form.Item>
          )}

          {data.childrenAges?.length > 0 && (
            <Form.Item label="Children Ages" name="childrenAges">
              <Select mode="tags" placeholder="Enter ages as numbers" />
            </Form.Item>
          )} */}

          {data.childrenAges?.length > 0 && (
            <SelectChildrenAge
              form={form}
              opt={Array.from({ length: 4 }, (_, i) => i + 1)}
              selectedValue={selectedValue}
              handleSelectChange={updateSelectedValue}
            />
          )}

          {data.childrenSchools && (
            <Form.Item label="Children Schools" name="childrenSchools">
              <Input />
            </Form.Item>
          )}

          {data.allergiesHealth?.length > 0 && (
            <Form.Item label="Allergies" name="allergiesHealth">
              <Select mode="tags" placeholder="Enter allergies" />
            </Form.Item>
          )}
          {data.allergiesHealthSpecify && (
            <Form.Item label="Specify Allergies" name="allergiesHealthSpecify">
              <Input />
            </Form.Item>
          )}

          {data.careDescription && (
            <Form.Item label="Care Description" name="careDescription">
              <Input.TextArea rows={3} />
            </Form.Item>
          )}

          {data.openNotes && (
            <Form.Item label="Open Notes" name="openNotes">
              <Input.TextArea rows={3} />
            </Form.Item>
          )}

          {data.hourlyBudget && (
            <>
              <h2 className="text-lg font-semibold">Budget</h2>
              <Space>
                <Form.Item label="Min Rate" name={["hourlyBudget", "min"]}>
                  <Input type="number" />
                </Form.Item>
                <Form.Item label="Max Rate" name={["hourlyBudget", "max"]}>
                  <Input type="number" />
                </Form.Item>
              </Space>
              <Space>
                <Form.Item
                  label="Min Share"
                  name={["hourlyBudget", "minShare"]}
                >
                  <Input type="number" />
                </Form.Item>
                <Form.Item
                  label="Max Share"
                  name={["hourlyBudget", "maxShare"]}
                >
                  <Input type="number" />
                </Form.Item>
              </Space>
            </>
          )}

          {data.hourlyBudgetSpecify && (
            <Form.Item label="My Share (Specify)" name="hourlyBudgetSpecify">
              <Input type="number" />
            </Form.Item>
          )}

          {/* Schedule */}
          {data.specificDays && (
            <>
              <h2 className="text-lg font-semibold">Schedule</h2>
              <OnboardingDaySelector
                daysState={daysState}
                setDaysState={setDaysState}
                head="Select Days"
                subHead="Choose your preferred schedule"
              />
            </>
          )}

          {/* Seasonal */}
          {seasonalStart && seasonalEnd && (
            <StartEndDatePicker
              startDate={seasonalStart}
              endDate={seasonalEnd}
              setStartDate={setSeasonalStart}
              setEndDate={setSeasonalEnd}
            />
          )}

          <div className="flex gap-2 mt-4">
            <CustomButton
              btnText="Cancel"
              action={() => {
                navigate(-1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="bg-gray-200"
            />
            <CustomButton
              btnText="Save"
              htmlType="submit"
              className="bg-[#AEC4FF]"
            />
          </div>
        </Form>
      </div>
    </div>
  );
}

export default EditNannyShare;
