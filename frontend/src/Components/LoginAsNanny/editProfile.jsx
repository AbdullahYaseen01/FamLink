import { useCallback, useEffect, useState } from "react";
import cameraIcons from "../../assets/images/cameraIcon.png";
import { Form, Input, Checkbox, Select, Button, TimePicker, Spin } from "antd";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "react-avatar";
import { fireToastMessage } from "../../toastContainer";
import { editUserThunk } from "../Redux/authSlice";
import Autocomplete from "react-google-autocomplete";
import OptionSelector from "../subComponents/LanguageSelector";
// import moment from "moment";
import dayjs from "dayjs";

const parseTime = (time) => {
  // const { default: moment } = await import("moment");
  return time ? dayjs(time) : null;
};

export default function EditProfileNanny() {
  const { TextArea } = Input;
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [zipCode, setZipCode] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const [form] = Form.useForm();
  const options = [
    "English",
    "Spanish",
    "French",
    "Mandarin",
    "Cantonese",
    "Arabic",
  ];
  const languageSkills = user?.additionalInfo?.find(
    (info) => info.key === "language",
  )?.value;

  const defaultCheckedValues = languageSkills?.option;

  useEffect(() => {
    if (defaultCheckedValues) {
      form.setFieldsValue({ language: defaultCheckedValues });
    }
  }, [defaultCheckedValues, form]);

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  useEffect(() => {
    const getCurrentLocation = async () => {
      if (!location) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${
                import.meta.env.VITE_GOOGLE_KEY
              }`,
            );
            const data = await response.json();

            if (data.status === "OK") {
              const address = data.results[0].formatted_address;
              const components = data.results[0].address_components;

              const zipObj = components.find((comp) =>
                comp.types.includes("postal_code"),
              );
              const zip = zipObj ? zipObj.long_name : "";

              if (!zip) {
                fireToastMessage({
                  message:
                    "Zip code is not available for the selected location. Please try another location.",
                  type: "error",
                });
                return;
              }

              setLocation(address);
              setZipCode(zip);

              form.setFieldsValue({
                location: address,
                zipCode: zip,
              });

              const { lat, lng } = data.results[0].geometry.location;
              setCoordinates({
                lat,
                lng,
                formatted: address,
              });
            }
          } catch (error) {
            fireToastMessage({
              message: "Failed to fetch location details.",
              type: "error",
            });
          }
        });
      }
    };

    getCurrentLocation();
  }, []);

  const specificDaysAndTime = user?.additionalInfo?.find(
    (info) => info.key === "specificDaysAndTime",
  )?.value;

  // Handle individual day checkbox change

  const handleCheckboxChange = useCallback((day) => {
    setDaysState((prevState) => ({
      ...prevState,
      [day]: {
        ...prevState[day],
        checked: !prevState[day].checked,
      },
    }));
  }, []);

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

  const handleTimeChange = (day, field, time) => {
    setDaysState((prevState) => ({
      ...prevState,
      [day]: {
        ...prevState[day],
        [field]: time ? time.toISOString() : null, // Set to ISO string or null
      },
    }));
  };

  const [image, setImage] = useState(user.imageUrl); // Default image
  const [file, setFile] = useState(null);
  // Function to handle image change
  const handleImageChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const imageUrl = URL.createObjectURL(selectedFile);
      setImage(imageUrl); // Preview the image
      setFile(selectedFile); // Store the file for upload
    }
  };

  const options2 = [
    { value: "Full-time", label: "Full-time" },
    { value: "Part-time", label: "Part-time" },
    { value: "Occasional", label: "Occasional" },
    { value: "Weekends only", label: "Weekends only" },
    { value: "Nights only", label: "Nights only" },
    { value: "Flexible", label: "Flexible" },
  ]; // Example age options

  const defaultCheckedValues2 = user?.additionalInfo.find(
    (info) => info.key === "avaiForWorking",
  )?.value.option;

  const options3 = [
    { value: "Immediate", label: "Immediate" },
    { value: "Start within 1 month", label: "Start within 1 month" },
    { value: "Flexible start date", label: "Flexible start date" },
  ]; // Example age options

  const defaultCheckedValues3 = user?.additionalInfo.find(
    (info) => info.key === "availability",
  )?.value.option;

  const options4 = [
    { value: "Less than 1 year", label: "Less than 1 year" },
    { value: "1-3 years", label: "1-3 years" },
    { value: "3-5 years", label: "3-5 years" },
    { value: "Over 5 years", label: "Over 5 years" },
  ]; // Example age options

  const defaultCheckedValues4 = user?.additionalInfo.find(
    (info) => info.key === "experience",
  )?.value.option;

  const options5 = [
    "Newborns (0-12 months)",
    "Toddlers (1-3 years)",
    "Preschoolers (3-5 years)",
    "School-age (5-12 years)",
    "Teenagers (12+ years)",
  ];

  const options6 = [
    "Full-Time Hours?",
    "Meal Prep?",
    "Light Housekeeping?",
    "Special needs experience?",
    "Have a car?",
    "Driver's License?",
    "Speak English Fluently?",
    "Speak Spanish Fluently?",
    "Care for a 0-11 years old?",
    "Care for a 1-3 years old?",
    "Care for 4-9 years old?",
    "Care for 10+ years old?",
    "First Aid Certified?",
    "CPR Certified?",
  ];

  const defaultCheckedValues5 = user?.additionalInfo?.find(
    (info) => info.key === "ageGroupsExp",
  )?.value?.option;
  const defaultCheckedValues6 = user?.additionalInfo?.find(
    (info) => info.key === "additionalDetails",
  )?.value?.option;
  const transformObject = (obj) => {
    const additionalInfo = [];
    const keysSet = new Set(); // To track added keys

    // Add existing array properties to additionalInfo
    for (const key in obj) {
      const value = obj[key];

      // Check if the value is an array and has more than 0 elements
      if (Array.isArray(value) && value.length > 0) {
        // Check if any element in the array is defined
        if (value.some((item) => item !== undefined) && !keysSet.has(key)) {
          additionalInfo.push({
            key: key,
            value: {
              option: value,
            },
          });
          keysSet.add(key); // Add key to the set
        }
      }
    }

    // Add additional properties that are not arrays and not undefined
    const additionalProperties = [
      "language",
      "avaiForWorking",
      "availability",
      "experience",
      "ageGroupsExp",
      "additionalDetails",
    ];

    additionalProperties.forEach((prop) => {
      if (obj[prop] !== undefined && obj[prop] !== null) {
        // Check if the property is defined and not null
        // If it's an array, check if it has defined values
        if (
          Array.isArray(obj[prop]) &&
          obj[prop].some((item) => item !== undefined) &&
          !keysSet.has(prop)
        ) {
          additionalInfo.push({
            key: prop,
            value: {
              option: obj[prop],
            },
          });
          keysSet.add(prop); // Add key to the set
        } else if (typeof obj[prop] === "string" && !keysSet.has(prop)) {
          // If it's a string, add it directly
          additionalInfo.push({
            key: prop,
            value: {
              option: obj[prop],
            },
          });
          keysSet.add(prop); // Add key to the set
        }
      }
    });

    // Add languageSkills under specificReqForCaregiver

    return { additionalInfo };
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const transformedObject = transformObject(values);
      const salaryExpObject = {
        key: "salaryExp",
        value: {
          firstChild: values.firstChild,
          secChild: values.secChild,
          thirdChild: values.thirdChild,
          fourthChild: values.fourthChild,
          fiveOrMoreChild: values.fiveOrMoreChild,
        },
      };

      const salaryRange = {
        key: "salaryRange",
        value: {
          min: Number(values.firstChild),
          max: Number(values.fiveOrMoreChild),
        },
      };

      const checkedDays = Object.entries(daysState)
        .filter(([_, data]) => data.checked === true)
        .reduce((acc, [day, data]) => {
          acc[day] = {
            checked: true,
            start: data.start ? parseTime(data.start).toISOString() : null,
            end: data.end ? parseTime(data.end).toISOString() : null,
          };
          return acc;
        }, {});

      const selectedDays = Object.entries(checkedDays);
      if (selectedDays.length === 0) {
        return fireToastMessage({
          type: "error",
          message: "At least one day must be selected.",
        });
      }

      const invalidDays = selectedDays
        .filter(([_, { start, end }]) => {
          const parsedStart = parseTime(start);
          const parsedEnd = parseTime(end);
          return (
            !parsedStart ||
            !parsedEnd ||
            !parsedStart.isValid() ||
            !parsedEnd.isValid() ||
            parsedStart.isSame(parsedEnd) ||
            parsedEnd.isBefore(parsedStart)
          );
        })
        .map(([day]) => day);

      if (invalidDays.length > 0) {
        return fireToastMessage({
          type: "error",
          message: `The following selected days have invalid start or end times: ${invalidDays.join(
            ", ",
          )}`,
        });
      }

      const specificDaysAndTime = {
        key: "specificDaysAndTime",
        value: checkedDays,
      };

      let addData = transformedObject;
      addData?.additionalInfo.push(
        salaryExpObject,
        specificDaysAndTime,
        salaryRange,
      );
      if (values.jobDescription) {
        addData.additionalInfo.push({
          key: "jobDescription",
          value: values.jobDescription,
        });
      }

      const formData = new FormData();

      // ✅ Rely on state values set in onPlaceSelected
      if (!zipCode) {
        return fireToastMessage({
          type: "error",
          message: "Zip code is missing. Please enter a Zip Code.",
        });
      }

      if (coordinates) {
        const location1 = {
          type: "Point",
          coordinates: [coordinates.lng, coordinates.lat],
          format_location: coordinates.formatted,
        };

        formData.append("location", JSON.stringify(location1));
      }
      formData.append("zipCode", zipCode);

      if (values.fullName) formData.append("name", values.fullName);
      if (values.age) formData.append("age", values.age);
      if (values.gender) formData.append("gender", values.gender);
      if (addData)
        formData.append(
          "additionalInfo",
          JSON.stringify(addData.additionalInfo),
        );
      if (file) formData.append("imageUrl", file);

      const { status, user } = await dispatch(editUserThunk(formData)).unwrap();
      if (status === 200) {
        fireToastMessage({
          success: true,
          message: "User updated successfully",
        });
        setLocation(user?.location?.format_location || "");
        setZipCode(user?.zipCode || "");
      } else {
        return fireToastMessage({
          success: false,
          message: "Failed to update user.",
        });
      }
    } catch (error) {
      return fireToastMessage({
        success: false,
        message: "Failed to update user.",
      });
    } finally {
      setLoading(false);
    }
  };

  const salaryExp = user?.additionalInfo?.find(
    (info) => info.key === "salaryExp",
  )?.value;
  useEffect(() => {
    setLocation(user?.location?.format_location || "");
    setZipCode(user?.zipCode || "");
  }, [user]);

  useEffect(() => {
    if (zipCode) {
      form.setFieldsValue({ zipCode });
    }
  }, [zipCode, form]);
  return (
    <div className="padding-navbar1">
      <div className=" bg-white my-10">
        <p className="Livvic-SemiBold lg:text-3xl text-2xl ">Edit Profile</p>
        <div className="mt-6">
          <div className="relative w-24">
            {/* Profile Picture */}
            {image ? (
              <img
                src={image}
                alt="Profile"
                className="rounded-full w-32 h-32 object-cover"
              />
            ) : (
              <Avatar
                className="rounded-full text-black"
                size="96"
                color={"#38AEE3"}
                name={user.name
                  ?.split(" ") // Split by space
                  .slice(0, 2) // Take first 1–2 words
                  .join(" ")}
              />
            )}

            <label className="right-0 bottom-0 absolute flex justify-center items-center bg-gray-200 rounded-full w-8 h-8 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              <img src={cameraIcons} alt="cameraIcons" />
            </label>
          </div>
          <p className="my-5 Livvic-SemiBold text-lg text-primary">
            Basic Information
          </p>
          <div>
            <Form
              onFinish={onFinish}
              autoComplete="off"
              form={form}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // stops Enter from triggering submit
                }
              }}
            >
              <div className="flex flex-wrap gap-6">
                {/* Full Name */}
                <div className="relative w-72">
                  <Form.Item
                    style={{ margin: 0, padding: 0 }}
                    name="fullName"
                    initialValue={user?.name}
                  >
                    <Input
                      id="fullName"
                      type="text"
                      defaultValue={user?.name}
                      className="peer border border-[#EEEEEE] rounded-[10px] px-4 pt-7 pb-2 w-full placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Full Name"
                    />
                  </Form.Item>
                  <label
                    htmlFor="fullName"
                    className="absolute left-4 top-2 text-sm text-gray-500 bg-white px-1 z-10"
                  >
                    Full Name
                  </label>
                </div>

                {/* Address */}
                <div className="relative w-72">
                  <Form.Item
                    name="location"
                    initialValue={user?.location}
                    rules={[{ required: true, message: "Address is required" }]}
                  >
                    <Spin spinning={loading} size="small">
                      <Autocomplete
                        className="peer"
                        apiKey={import.meta.env.VITE_GOOGLE_KEY}
                        style={{
                          width: "100%",
                          borderRadius: "10px",
                          padding: "1.7rem 0.75rem 0.75rem 0.75rem",
                          border: "1px solid #D6DDEB",
                        }}
                        value={location || ""}
                        onPlaceSelected={(place) => {
                          const address = place.formatted_address;
                          const components = place?.address_components || [];

                          const zipObj = components.find((comp) =>
                            comp.types.includes("postal_code"),
                          );
                          const zip = zipObj ? zipObj.long_name : "";

                          if (!zip) {
                            fireToastMessage({
                              message:
                                "Zip code is not available for the selected location. Please try another location.",
                              type: "error",
                            });
                            setLocation("");
                            setZipCode("");
                            form.setFieldsValue({ location: "", zipCode: "" });
                            return;
                          }

                          const lat = place?.geometry?.location?.lat();
                          const lng = place?.geometry?.location?.lng();

                          if (lat && lng) {
                            setCoordinates({
                              lat,
                              lng,
                              formatted: address,
                            });
                          }

                          setLocation(address);
                          setZipCode(zip);

                          form.setFieldsValue({
                            location: address,
                            zipCode: zip,
                          });

                          setLoading(false);
                        }}
                        onChange={(e) => {
                          setLocation(e.target.value);
                          setLoading(e.target.value.length > 0);
                        }}
                        onBlur={() => setLoading(false)}
                        options={{
                          types: ["address"],
                          componentRestrictions: { country: "us" },
                        }}
                      />
                    </Spin>
                  </Form.Item>
                  <label
                    htmlFor="address"
                    className="absolute left-4 top-2 text-sm text-gray-500 bg-white px-1 z-10"
                  >
                    Address
                  </label>
                </div>

                {/* Gender */}
                <div className="relative w-72">
                  <Form.Item
                    name="gender"
                    initialValue={user?.gender}
                    style={{ margin: 0, padding: 0 }}
                  >
                    <Select
                      bordered={false}
                      defaultValue={user?.gender}
                      className="peer w-full pt-6 pb-2 px-2 border border-[#EEEEEE] rounded-[10px]"
                      style={{
                        height: "64px",
                      }}
                      placeholder="Gender"
                    >
                      <Select.Option value="Male">
                        {" "}
                        <span className="Livvic-SemiBold text-sm text-primary">
                          Male
                        </span>
                      </Select.Option>
                      <Select.Option value="Female">
                        {" "}
                        <span className="Livvic-SemiBold text-sm text-primary">
                          Female
                        </span>
                      </Select.Option>
                    </Select>
                  </Form.Item>
                  <label className="absolute left-4 top-2 text-sm text-gray-500 bg-white px-1 z-10">
                    Gender
                  </label>
                </div>

                {/* Age */}
                <div className="relative w-72">
                  <Form.Item
                    style={{ margin: 0, padding: 0 }}
                    name="age"
                    initialValue={user?.age}
                  >
                    <Input
                      type="number"
                      defaultValue={user?.age}
                      className="peer border border-[#EEEEEE] rounded-[10px] px-4 pt-7 pb-2 w-full placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Age"
                    />
                  </Form.Item>
                  <label
                    htmlFor="age"
                    className="absolute left-4 top-2 text-sm text-gray-500 bg-white px-1 z-10"
                  >
                    Age
                  </label>
                </div>
              </div>
              <div>
                <p className="my-5 Livvic-SemiBold text-lg text-primary">
                  Language
                </p>
                <OptionSelector
                  options={options}
                  form={form}
                  defaultCheckedValues={defaultCheckedValues}
                  name="language"
                />
              </div>
              <div className="">
                <div>
                  <p className="my-5 Livvic-SemiBold text-lg text-primary">
                    Weekly Schedule
                  </p>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {daysOfWeek.map((day) => (
                    <div className="flex mb-4" key={day}>
                      <div className="p-4 border border-[#EEEEEE] rounded-[10px]">
                        <Checkbox
                          checked={daysState[day]?.checked || false}
                          onChange={() => handleCheckboxChange(day)}
                          className="mr-4"
                        >
                          <span className="font-semibold text-lg">{day}</span>
                        </Checkbox>
                        <hr className="my-2" />
                        <div className="flex items-center gap-4 mt-2">
                          <TimePicker
                            value={
                              daysState[day].start
                                ? parseTime(daysState[day].start)
                                : null
                            } // Use moment only if start time exists
                            placeholder="Start"
                            onChange={(time) =>
                              handleTimeChange(day, "start", time)
                            }
                            disabled={!daysState[day].checked}
                            format="h:mm A"
                            className="rounded-lg border-none"
                          />
                          <span className="w-px h-6 bg-gray-300 block"></span>
                          <TimePicker
                            value={
                              daysState[day].end
                                ? parseTime(daysState[day].end)
                                : null
                            } // Use moment only if end time exists
                            placeholder="End"
                            onChange={(time) =>
                              handleTimeChange(day, "end", time)
                            }
                            disabled={!daysState[day].checked}
                            format="h:mm A"
                            className="rounded-lg border-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="my-5 Livvic-SemiBold text-lg text-primary">
                  Services
                </p>
                <div className="flex flex-wrap gap-4">
                  {[
                    "firstChild",
                    "secChild",
                    "thirdChild",
                    "fourthChild",
                    "fiveOrMoreChild",
                  ].map((v, i) => {
                    return (
                      <div key={i} className="relative w-72">
                        <Form.Item
                          name={v}
                          style={{ margin: 0 }}
                          initialValue={salaryExp?.[v] ?? ""}
                        >
                          <div className="relative">
                            {/* $ Prefix */}
                            <span className="Livvic-Semibold text-md text-primary absolute left-[5%] top-[66%] -translate-y-1/2  z-10">
                              $
                            </span>

                            {/* Input Field */}
                            <Input
                              id={v}
                              type="number"
                              defaultValue={
                                salaryExp?.[v] !== undefined &&
                                salaryExp?.[v] !== null
                                  ? salaryExp[v]
                                  : ""
                              }
                              className="peer pl-6 pr-8 border border-[#EEEEEE] rounded-[10px] pt-7 pb-2 w-full placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="Hourly Rate"
                            />

                            {/* /h Suffix */}
                            <span className="Livvic-Semibold text-md text-primary absolute right-[55%] top-[65%] -translate-y-1/2  z-10">
                              /h
                            </span>
                          </div>
                        </Form.Item>

                        {/* Fixed Top Label */}
                        <label
                          htmlFor={v}
                          className="absolute left-4 top-2 text-sm text-gray-500 bg-white px-1 z-10"
                        >
                          {i + 1 === 5
                            ? `${i + 1} Child or more`
                            : `${i + 1} Child`}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="my-5 Livvic-SemiBold text-lg text-primary">
                  Resume Details
                </p>
                <div className="flex flex-wrap gap-6">
                  {/* Availability */}
                  <div className="relative w-72">
                    <Form.Item
                      name="avaiForWorking"
                      initialValue={defaultCheckedValues2}
                      style={{ margin: 0, padding: 0 }}
                    >
                      <Select
                        bordered={false}
                        defaultValue={defaultCheckedValues2}
                        options={options2}
                        className="peer w-full pt-6 pb-2 px-4 border border-[#EEEEEE] rounded-[10px]"
                        style={{ height: "64px" }}
                        placeholder="Availability"
                      />
                    </Form.Item>
                    <label className="absolute left-4 top-2 text-sm text-gray-500 bg-white px-1 z-10">
                      Availability
                    </label>
                  </div>

                  {/* Start */}
                  <div className="relative w-72">
                    <Form.Item
                      name="availability"
                      initialValue={defaultCheckedValues3}
                      style={{ margin: 0, padding: 0 }}
                    >
                      <Select
                        bordered={false}
                        defaultValue={defaultCheckedValues3}
                        options={options3}
                        className="peer w-full pt-6 pb-2 px-4 border border-[#EEEEEE] rounded-[10px]"
                        style={{ height: "64px" }}
                        placeholder="Start"
                      />
                    </Form.Item>
                    <label className="absolute left-4 top-2 text-sm text-gray-500 bg-white px-1 z-10">
                      Start
                    </label>
                  </div>

                  {/* Work Experience */}
                  <div className="relative w-72">
                    <Form.Item
                      name="experience"
                      initialValue={defaultCheckedValues4}
                      style={{ margin: 0, padding: 0 }}
                    >
                      <Select
                        bordered={false}
                        defaultValue={defaultCheckedValues4}
                        options={options4}
                        className="peer w-full pt-6 pb-2 px-4 border border-[#EEEEEE] rounded-[10px]"
                        style={{ height: "64px" }}
                        placeholder="Experience"
                      />
                    </Form.Item>
                    <label className="absolute left-4 top-2 text-sm text-gray-500 bg-white px-1 z-10">
                      Work Experience
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <p className="my-5 Livvic-SemiBold text-lg text-primary">
                  Age group experience
                </p>
                {/* <Form.Item
                  style={{ margin: 0, padding: 0 }}
                  name="ageGroupsExp"
                  rules={[
                    {
                      required: false,
                      message: "",
                    },
                  ]}
                  initialValue={defaultCheckedValues5} // Default checked values for form submission
                >
                  <Checkbox.Group
                    options={options5}
                    defaultValue={defaultCheckedValues5} // Set default checked values
                    className="rounded-3xl custom-checkbox-group" // Add a custom class
                    style={{ borderColor: "#D6DDEB", margin: 0, padding: 0 }}
                  />
                </Form.Item> */}
                <OptionSelector
                  options={options5}
                  defaultCheckedValues={defaultCheckedValues5}
                  form={form}
                  name={"ageGroupsExp"}
                />
              </div>

              <div>
                <p className="my-5 Livvic-SemiBold text-lg text-primary">
                  About me
                </p>
                <div className="relative w-full">
                  <Form.Item
                    style={{ margin: 0, padding: 0 }}
                    name="jobDescription"
                    initialValue={
                      user?.additionalInfo.find(
                        (info) => info.key === "jobDescription",
                      )?.value
                    }
                    rules={[
                      {
                        required: false,
                        message: "",
                      },
                    ]}
                  >
                    <TextArea
                      id="jobDescription"
                      placeholder="Enter detail"
                      defaultValue={
                        user?.additionalInfo.find(
                          (info) => info.key === "jobDescription",
                        )?.value
                      }
                      rows={6}
                      className="peer border border-[#D6DDEB] rounded-3xl px-4 pt-7 pb-2 w-full placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                      style={{
                        width: "100%",
                        resize: "none",
                      }}
                    />
                  </Form.Item>
                  <label
                    htmlFor="jobDescription"
                    className="absolute left-4 top-2 text-sm text-gray-500 bg-white px-1 z-10"
                  >
                    About Me
                  </label>
                </div>
              </div>

              <div>
                <p className="my-5 Livvic-SemiBold text-lg text-primary">
                  Additional Details
                </p>
                {/* <Form.Item
                  style={{ margin: 0, padding: 0 }}
                  name="additionalDetails"
                  initialValue={defaultCheckedValues6} // Default checked values for form submission
                >
                  <Checkbox.Group
                    options={options6}
                    defaultValue={defaultCheckedValues6} // Set default checked values
                    className="rounded-3xl custom-checkbox-group" // Add a custom class
                    style={{ borderColor: "#D6DDEB", margin: 0, padding: 0 }}
                  />
                </Form.Item> */}
                <OptionSelector
                  options={options6}
                  defaultCheckedValues={defaultCheckedValues6}
                  form={form}
                  name={"additionalDetails"}
                />
              </div>
              <div className="flex justify-end mt-10">
                <Form.Item className="m-0 p-0">
                  <Button
                    style={{ border: "1px solid #EEEEEE" }}
                    className="font-semibold ml-4 px-12 py-6 rounded-[35px] text-[#555555]"
                  >
                    Discard Changes
                  </Button>
                  <Button
                    type="primary"
                    loading={loading}
                    htmlType="submit"
                    className="bg-[#AEC4FF] font-semibold ml-4 px-12 py-6 rounded-[35px] text-[#001243]"
                  >
                    Save Changes
                  </Button>
                </Form.Item>
              </div>
            </Form>
          </div>
        </div>
      </div>
      <div></div>
    </div>
  );
}
