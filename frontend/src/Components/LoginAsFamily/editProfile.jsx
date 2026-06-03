import cameraIcons from "../../assets/images/cameraIcon.png";
import { Form, Input, Select, Spin, Checkbox, TimePicker } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { editUserThunk, updateNannyProfileThunk } from "../Redux/authSlice";
import { fetchNannyByIdThunk } from "../Redux/nannyData";
import { fireToastMessage } from "../../toastContainer";
import Avatar from "react-avatar";
import Autocomplete from "react-google-autocomplete";
import { formatSentence, toCamelCase } from "../subComponents/toCamelStr";
import { useNavigate } from "react-router-dom";
import OptionSelector from "../subComponents/LanguageSelector";
import CustomButton from "../../NewComponents/Button";
import { ChevronLeft, Camera, User as UserIcon, Info, Calendar as CalendarIcon, Clock, Baby } from "lucide-react";
import dayjs from "dayjs";

const parseTime = (time) => {
  return time ? dayjs(time) : null;
};

import { useCallback, useEffect, useState } from "react";

export default function EditProfile() {
  const { TextArea } = Input;
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();

  const [nannyProfile, setNannyProfile] = useState(null);

  useEffect(() => {
    if (user?._id) {
      dispatch(fetchNannyByIdThunk(user._id))
        .unwrap()
        .then((res) => {
           setNannyProfile(res?.nannyProfile || {});
        })
        .catch(console.log);
    }
  }, [user?._id, dispatch]);

  const getAdditionalInfo = useCallback((key) => {
    const keyMap = {
      specificDaysAndTime: "specificDays",
      flexible: "flexibility",
      hosting: "hostingPreference",
      prefferedCommunication: "communicationPreference",
      backupAvailable: "backupCare",
      hourlyRateSplit: "hourlyBudget"
    };
    const profileKey = keyMap[key] || key;

    if (nannyProfile && nannyProfile[profileKey] !== undefined && nannyProfile[profileKey] !== null) {
      let val = nannyProfile[profileKey];
      
      if (Array.isArray(val)) {
        val = val.map(item => {
          if (typeof item === 'string' && (item.startsWith('{') || item.startsWith('['))) {
            try { return JSON.parse(item); } catch (e) { return item; }
          }
          return item;
        }).flat();
      } else if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
        try { val = JSON.parse(val); } catch (e) {}
      }
      return val;
    }
    
    return Array.isArray(user?.additionalInfo)
      ? user.additionalInfo.find(info => info.key === key)?.value
      : user?.additionalInfo?.[key];
  }, [nannyProfile, user]);

  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const [selectedChildren, setSelectedChildren] = useState(
    user?.noOfChildren?.length || 0
  );
  const [childrenAges, setChildrenAges] = useState(() => {
    const info = user?.noOfChildren?.info || {};
    const len = user?.noOfChildren?.length || 0;
    return Array.from({ length: len }, (_, i) => info[`Child${i + 1}`] || "");
  });

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const [daysState, setDaysState] = useState(() => {
    return daysOfWeek.reduce((acc, day) => {
      acc[day] = {
        checked: false,
        start: null,
        end: null,
      };
      return acc;
    }, {});
  });

  useEffect(() => {
    if (user || nannyProfile) {
      const shareFields = {
        nannyShareType: getAdditionalInfo("nannyShareType"),
        hasNanny: getAdditionalInfo("hasNanny"),
        shareLocation: getAdditionalInfo("shareLocation"),
        specifyNearbyWorkplace: getAdditionalInfo("specifyNearbyWorkplace"),
        flexible: getAdditionalInfo("flexible"),
        nannyshareStart: getAdditionalInfo("nannyshareStart"),
        urgency: getAdditionalInfo("urgency"),
        hosting: getAdditionalInfo("hosting"),
        hourlyRateSplit: getAdditionalInfo("hourlyRateSplit"),
        prefferedCommunication: getAdditionalInfo("prefferedCommunication"),
        backupAvailable: getAdditionalInfo("backupAvailable"),
        careDescription: getAdditionalInfo("careDescription"),
        openNotes: getAdditionalInfo("openNotes")
      };
      
      form.setFieldsValue(shareFields);
      
      const specificDaysAndTime = getAdditionalInfo("specificDaysAndTime");
      if (specificDaysAndTime) {
         setDaysState(daysOfWeek.reduce((acc, day) => {
           const specificDay = specificDaysAndTime?.[day];
           acc[day] = {
             checked: !!specificDay?.checked,
             start: specificDay?.start || null,
             end: specificDay?.end || null,
           };
           return acc;
         }, {}));
      }
    }
  }, [user, nannyProfile, form, getAdditionalInfo]);

  const handleCheckboxChange = useCallback((day) => {
    setDaysState((prevState) => ({
      ...prevState,
      [day]: {
        ...prevState[day],
        checked: !prevState[day].checked,
      },
    }));
  }, []);

  const handleTimeChange = (day, field, time) => {
    setDaysState((prevState) => ({
      ...prevState,
      [day]: {
        ...prevState[day],
        [field]: time ? time.toISOString() : null,
      },
    }));
  };

  const [image, setImage] = useState(user?.imageUrl);
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (user) {
      const addr = user?.location?.format_location || "";
      setLocation(addr);
      if (user?.location) {
        setCoordinates(
          user?.location
        );
      }
    }
  }, [user, form]);

  const handleImageChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const imageUrl = URL.createObjectURL(selectedFile);
      setImage(imageUrl);
      setFile(selectedFile);
    }
  };

  const handleChildrenChange = (value) => {
    setSelectedChildren(value);
    setChildrenAges((prevAges) => {
      const updatedAges = [...prevAges];
      if (value > updatedAges.length) {
        return [...updatedAges, ...Array(value - updatedAges.length).fill("")];
      } else {
        return updatedAges.slice(0, value);
      }
    });
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();

      if (coordinates) {
        formData.append("location", JSON.stringify(coordinates));
      }

      formData.append("zipCode", zipCode);
      if (values.fullName) formData.append("name", values.fullName);
      if (values.age) formData.append("age", values.age);
      if (values.gender) formData.append("gender", values.gender);
      if (values.description) formData.append("aboutMe", values.description);
      if (file) formData.append("imageUrl", file);

      const childrenInfo = {};
      for (let i = 1; i <= selectedChildren; i++) {
        const ageKey = `Child${i}`;
        if (values[ageKey]) {
          childrenInfo[ageKey] = values[ageKey];
        }
      }

      const noOfChildren = {
        length: Object.keys(childrenInfo).length,
        info: childrenInfo,
      };
      formData.append("noOfChildren", JSON.stringify(noOfChildren));

      // Handle Schedule
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

      const additionalInfo = [];
      // Add specificDaysAndTime to additionalInfo array
      additionalInfo.push({
        key: "specificDaysAndTime",
        value: checkedDays
      });

      const nannyShareFields = [
        "nannyShareType", "hasNanny", "shareLocation", "specifyNearbyWorkplace",
        "careDescription", "flexible", "nannyshareStart", "urgency", "hosting",
        "hourlyRateSplit", "prefferedCommunication", "backupAvailable", "openNotes"
      ];
      nannyShareFields.forEach(field => {
        if (values[field]) {
          additionalInfo.push({ key: field, value: values[field] });
        }
      });

      // formData.append("additionalInfo", JSON.stringify(additionalInfo)); // Removed to prevent double-saving to User schema

      if (values.services?.length > 0) {
        const camelCaseServices = values.services.map((s) =>
          typeof s === "string" ? toCamelCase(s) : s
        );
        formData.append("services", JSON.stringify(camelCaseServices));
      }

      // --- Family Profile Specific Data for backend schema ---
      const keyMap = {
        flexible: "flexibility",
        hosting: "hostingPreference",
        prefferedCommunication: "communicationPreference",
        backupAvailable: "backupCare",
        hourlyRateSplit: "hourlyBudget"
      };

      const familyFormData = new FormData();
      nannyShareFields.forEach(field => {
        if (values[field] !== undefined && values[field] !== null) {
           const backendKey = keyMap[field] || field;
           if (Array.isArray(values[field])) {
             familyFormData.append(backendKey, JSON.stringify(values[field]));
           } else {
             familyFormData.append(backendKey, values[field]);
           }
        }
      });
      familyFormData.append("specificDays", JSON.stringify(checkedDays));
      if (file) familyFormData.append("imageFile", file);

      await dispatch(updateNannyProfileThunk(familyFormData)).unwrap();
      await dispatch(editUserThunk(formData)).unwrap();

      fireToastMessage({
        success: true,
        message: "Profile updated successfully!",
      });

      // Small delay to let the toast be seen before navigating
      setTimeout(() => {
        navigate("/family/profile");
      }, 600);
    } catch (error) {
      console.error("Update Error:", error);
      fireToastMessage({
        type: "error",
        message: error?.message || "Failed to update profile. Please check your information.",
      });
    } finally {
      setLoading(false);
    }
  };


  const options5 = [
    "Nanny",
    "Private Educator",
    "Swim Instructor",
    "Specialized Caregiver",
    "Sports Coaches",
    "Music Instructor",
    "House Manager",
  ];
  const formattedServiceLabels = user?.services?.map((s) => formatSentence(s)) || [];

  return (
    <div className="h-full overflow-y-auto bg-gray-50/30 p-4 md:p-8 lg:px-16 pb-24">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
        <div className="text-center md:text-left">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-[#8ba7ff] hover:text-[#AEC4FF] transition-all mb-2"
          >
            <ChevronLeft size={20} />
            <span className="Livvic-SemiBold">Back to Profile</span>
          </button>
          <h1 className="text-2xl md:text-3xl Livvic-Bold text-[#001243]">Edit Profile</h1>
          <p className="text-gray-500 text-sm md:text-base Livvic-Medium mt-1">Keep your family information up to date</p>
        </div>
        <div className="flex gap-3 md:gap-4 w-full md:w-auto">
          <CustomButton
            className="flex-1 md:!w-40 text-base md:text-lg Livvic-Medium text-[#555555] border border-gray-200 bg-white"
            btnText={"Cancel"}
            action={() => navigate(-1)}
          />
          <CustomButton
            btnText={"Save Changes"}
            htmlType="submit"
            form="editProfileForm"
            isLoading={loading}
            loadingBtnText="Saving..."
            className="bg-[#AEC4FF] flex-1 md:!w-40 text-[#001243] Livvic-Medium text-base md:text-lg shadow-sm"
          />
        </div>
      </div>

      <Form
        id="editProfileForm"
        onFinish={onFinish}
        autoComplete="off"
        form={form}
        layout="vertical"
        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
      >
        {/* Profile Photo - Top on Mobile, Sidebar on Desktop */}
        <div className="lg:col-span-4 lg:order-2 space-y-8">
          <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100 lg:sticky lg:top-8 text-center">
            <h3 className="text-lg Livvic-Bold text-[#001243] mb-6">Profile Photo</h3>

            <div className="relative w-32 h-32 md:w-48 md:h-48 mx-auto">
              {image ? (
                <img
                  src={image}
                  alt="Profile"
                  className="rounded-[32px] w-full h-full object-cover shadow-md transition-transform"
                />
              ) : (
                <div className="flex justify-center items-center w-full h-full">
                  <Avatar
                    name={user?.name}
                    size="100%"
                    round="32px"
                    color="#AEC4FF"
                    className="shadow-md"
                  />
                </div>
              )}

              <label className="absolute -bottom-2 -right-2 bg-white p-2.5 md:p-3 rounded-2xl shadow-xl cursor-pointer hover:bg-gray-50 border border-gray-100 transition-all active:scale-95 flex items-center justify-center z-10">
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleImageChange}
                />
                <Camera size={window.innerWidth < 768 ? 20 : 24} className="text-[#AEC4FF]" />
              </label>
            </div>

            <p className="text-gray-400 text-xs md:text-sm Livvic-Medium mt-6 md:mt-8 leading-relaxed px-2 md:px-4">
              Upload a clear photo of your family. This helps nannies feel more connected to you.
            </p>
          </div>
        </div>

        {/* Form Fields - Main Column */}
        <div className="lg:col-span-8 lg:order-1 space-y-8">

          {/* Card 1: Basic Information */}
          <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl Livvic-Bold text-[#001243] mb-6 flex items-center gap-2">
              <UserIcon size={20} className="text-[#AEC4FF]" />
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item
                label={<span className="Livvic-SemiBold text-gray-500">Full Name</span>}
                name="fullName"
                initialValue={user?.name}
              >
                <Input
                  className="rounded-xl border-gray-200 py-3 px-4 Livvic-Medium focus:border-[#AEC4FF] focus:ring-0"
                  placeholder="Enter your full name"
                />
              </Form.Item>

              <Form.Item
                label={<span className="Livvic-SemiBold text-gray-500">Address</span>}
                name="location"
                initialValue={user?.location?.format_location}
                rules={[{ required: true, message: "Address is required" }]}
              >
                <Autocomplete
                  apiKey={import.meta.env.VITE_GOOGLE_KEY}
                  style={{
                    width: "55%",
                    borderRadius: "10px",
                    padding: "0.75rem",
                    border: "1px solid #D6DDEB",
                  }}
                  value={location || ""}
                  onPlaceSelected={async (place) => {
                    const address = place.formatted_address;
                    const components = place?.address_components || [];

                    const get = (type) =>
                      components.find((c) => c.types.includes(type))?.long_name || "";

                    const extractedCity =
                      get("locality") || get("administrative_area_level_2");

                    const extractedNeighborhood =
                      get("neighborhood") ||
                      get("sublocality_level_1") ||
                      get("sublocality");

                    const lat = place?.geometry?.location?.lat();
                    const lng = place?.geometry?.location?.lng();

                    const locationObj = {
                      type: "Point",
                      coordinates: [lng, lat],
                      format_location: address,
                      city: extractedCity,
                      neighborhood: extractedNeighborhood,
                    };
                    setLocation(address)
                    setCoordinates(locationObj);
                    form.setFieldsValue({
                      location: address,
                    });
                    setLoading(false);
                  }}
                  onChange={(e) => {
                    setLocation(e.target.value);
                  }}
                  options={{
                    types: ["geocode"],
                    componentRestrictions: { country: "us" },
                  }}
                />
              </Form.Item>

              <Form.Item
                label={<span className="Livvic-SemiBold text-gray-500">Gender</span>}
                name="gender"
                initialValue={user?.gender}
              >
                <Select
                  className="w-full h-[50px] Livvic-Medium"
                  placeholder="Select gender"
                >
                  <Select.Option value="Male">Male</Select.Option>
                  <Select.Option value="Female">Female</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label={<span className="Livvic-SemiBold text-gray-500">Age</span>}
                name="age"
                initialValue={user?.age}
              >
                <Input
                  type="number"
                  className="rounded-xl border-gray-200 py-3 px-4 Livvic-Medium focus:border-[#AEC4FF]"
                  placeholder="Enter your age"
                />
              </Form.Item>
            </div>
          </div>

          {/* Card 2: Children Details */}
          <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl Livvic-Bold text-[#001243] mb-6 flex items-center gap-2">
              <Baby size={20} className="text-[#AEC4FF]" />
              Children Details
            </h3>

            <Form.Item
              label={<span className="Livvic-SemiBold text-gray-500">Number of Children</span>}
              name="totalChild"
              initialValue={selectedChildren}
            >
              <Select
                onChange={handleChildrenChange}
                className="w-full h-[50px] Livvic-Medium"
                placeholder="How many children?"
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <Select.Option key={num} value={num}>{num}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {childrenAges.map((age, index) => (
                <Form.Item
                  key={index}
                  label={<span className="Livvic-SemiBold text-gray-500">Age of Child {index + 1}</span>}
                  name={`Child${index + 1}`}
                  initialValue={age}
                >
                  <Input
                    type="number"
                    className="rounded-xl border-gray-200 py-3 px-4 Livvic-Medium"
                    placeholder="Enter age"
                  />
                </Form.Item>
              ))}
            </div>
          </div>

          {/* Card 3: About Your Family */}
          <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl Livvic-Bold text-[#001243] mb-6 flex items-center gap-2">
              <Info size={20} className="text-[#AEC4FF]" />
              About Your Family
            </h3>
            <Form.Item
              name="description"
              initialValue={user?.aboutMe}
            >
              <TextArea
                rows={6}
                className="rounded-2xl border-gray-200 p-4 Livvic-Medium focus:border-[#AEC4FF] resize-none"
                placeholder="Tell nannies about your family, your values, and what you're looking for..."
              />
            </Form.Item>
          </div>

          {/* Card: Nanny Share Preferences */}
          <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl Livvic-Bold text-[#001243] mb-6 flex items-center gap-2">
              <Info size={20} className="text-[#AEC4FF]" />
              Nanny Share Preferences
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item label={<span className="Livvic-SemiBold text-gray-500">Type of Nanny Share</span>} name="nannyShareType" initialValue={getAdditionalInfo("nannyShareType")}>
                <Select className="w-full h-[50px] Livvic-Medium" placeholder="Select type">
                  <Select.Option value="Full-time care">Full-time care</Select.Option>
                  <Select.Option value="Part-time care">Part-time care</Select.Option>
                  <Select.Option value="Pickup/Drop-off (Carpool style)">Pickup/Drop-off (Carpool style)</Select.Option>
                  <Select.Option value="After-school care">After-school care</Select.Option>
                  <Select.Option value="Summer/Seasonal">Summer/Seasonal</Select.Option>
                  <Select.Option value="Weekend nanny share">Weekend nanny share</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label={<span className="Livvic-SemiBold text-gray-500">Already have a nanny?</span>} name="hasNanny" initialValue={getAdditionalInfo("hasNanny")}>
                <Select className="w-full h-[50px] Livvic-Medium" placeholder="Select option">
                  <Select.Option value="Yes-we already have a nanny">Yes-we already have a nanny</Select.Option>
                  <Select.Option value="No-we are looking for a nanny">No-we are looking for a nanny</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label={<span className="Livvic-SemiBold text-gray-500">Location preference</span>} name="shareLocation" initialValue={getAdditionalInfo("shareLocation")}>
                <Select mode="multiple" className="w-full h-[50px] Livvic-Medium" placeholder="Select locations">
                  <Select.Option value="Near our home / in our neighborhood">Near our home / in our neighborhood</Select.Option>
                  <Select.Option value="Nearby neighborhoods within ~10–15 minutes">Nearby neighborhoods within ~10–15 minutes</Select.Option>
                  <Select.Option value="Anywhere in City that’s reasonably close">Anywhere in City that’s reasonably close</Select.Option>
                  <Select.Option value="Near my workplace">Near my workplace</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label={<span className="Livvic-SemiBold text-gray-500">Work location (if near workplace)</span>} name="specifyNearbyWorkplace" initialValue={getAdditionalInfo("specifyNearbyWorkplace")}>
                <Input className="rounded-xl border-gray-200 py-3 px-4 Livvic-Medium" placeholder="Enter work location" />
              </Form.Item>

              <Form.Item label={<span className="Livvic-SemiBold text-gray-500">Scheduling Flexibility</span>} name="flexible" initialValue={getAdditionalInfo("flexible")}>
                <Select className="w-full h-[50px] Livvic-Medium" placeholder="Select flexibility">
                  <Select.Option value="Very flexible">Very flexible</Select.Option>
                  <Select.Option value="Somewhat flexible">Somewhat flexible</Select.Option>
                  <Select.Option value="Not flexible">Not flexible</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label={<span className="Livvic-SemiBold text-gray-500">Start Date</span>} name="nannyshareStart" initialValue={getAdditionalInfo("nannyshareStart")}>
                <Select className="w-full h-[50px] Livvic-Medium" placeholder="Select start date">
                  <Select.Option value="Within the next month">Within the next month</Select.Option>
                  <Select.Option value="In 1–3 months">In 1–3 months</Select.Option>
                  <Select.Option value="In 3+ months / flexible">In 3+ months / flexible</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label={<span className="Livvic-SemiBold text-gray-500">Search Urgency</span>} name="urgency" initialValue={getAdditionalInfo("urgency")}>
                <Select className="w-full h-[50px] Livvic-Medium" placeholder="Select urgency">
                  <Select.Option value="Urgent – I need care soon">Urgent – I need care soon</Select.Option>
                  <Select.Option value="Actively looking">Actively looking</Select.Option>
                  <Select.Option value="Just exploring">Just exploring</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label={<span className="Livvic-SemiBold text-gray-500">Hosting Preference</span>} name="hosting" initialValue={getAdditionalInfo("hosting")}>
                <Select className="w-full h-[50px] Livvic-Medium" placeholder="Select hosting">
                  <Select.Option value="Your home">Your home</Select.Option>
                  <Select.Option value="Other family’s home">Other family’s home</Select.Option>
                  <Select.Option value="Rotating between homes">Rotating between homes</Select.Option>
                  <Select.Option value="Neutral location (e.g., school pickup spot)">Neutral location</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label={<span className="Livvic-SemiBold text-gray-500">Hourly Budget Split</span>} name="hourlyRateSplit" initialValue={getAdditionalInfo("hourlyRateSplit")}>
                <Select className="w-full h-[50px] Livvic-Medium" placeholder="Select budget">
                  <Select.Option value="$10 - $15 per hour">$10 - $15 per hour</Select.Option>
                  <Select.Option value="$15 - $20 per hour">$15 - $20 per hour</Select.Option>
                  <Select.Option value="$20 - $25 per hour">$20 - $25 per hour</Select.Option>
                  <Select.Option value="$25 - $30 per hour">$25 - $30 per hour</Select.Option>
                  <Select.Option value="$30 - $35 per hour">$30 - $35 per hour</Select.Option>
                  <Select.Option value="$35 - $40 per hour">$35 - $40 per hour</Select.Option>
                  <Select.Option value="$40+ per hour">$40+ per hour</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label={<span className="Livvic-SemiBold text-gray-500">Preferred Communication</span>} name="prefferedCommunication" initialValue={getAdditionalInfo("prefferedCommunication")}>
                <Select className="w-full h-[50px] Livvic-Medium" placeholder="Select communication">
                  <Select.Option value="Group chat">Group chat</Select.Option>
                  <Select.Option value="Shared calendar">Shared calendar</Select.Option>
                  <Select.Option value="Email updates">Email updates</Select.Option>
                  <Select.Option value="Phone calls">Phone calls</Select.Option>
                  <Select.Option value="Regular in-person meetings">Regular in-person meetings</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label={<span className="Livvic-SemiBold text-gray-500">Backup Care</span>} name="backupAvailable" initialValue={getAdditionalInfo("backupAvailable")}>
                <Select className="w-full h-[50px] Livvic-Medium" placeholder="Select backup">
                  <Select.Option value="Family members">Family members</Select.Option>
                  <Select.Option value="Backup nanny service">Backup nanny service</Select.Option>
                  <Select.Option value="Friends or neighbors">Friends or neighbors</Select.Option>
                  <Select.Option value="Local daycare">Local daycare</Select.Option>
                  <Select.Option value="No backup options">No backup options</Select.Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item label={<span className="Livvic-SemiBold text-gray-500">Care Description</span>} name="careDescription" initialValue={getAdditionalInfo("careDescription")} className="mt-4">
              <TextArea rows={4} className="rounded-2xl border-gray-200 p-4 Livvic-Medium" placeholder="Describe the type of care you're looking for..." />
            </Form.Item>

            <Form.Item label={<span className="Livvic-SemiBold text-gray-500">Additional Notes</span>} name="openNotes" initialValue={getAdditionalInfo("openNotes")}>
              <TextArea rows={4} className="rounded-2xl border-gray-200 p-4 Livvic-Medium" placeholder="Anything else another family should know?" />
            </Form.Item>
          </div>

          {/* Card 4: Weekly Schedule */}
          <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl Livvic-Bold text-[#001243] mb-6 flex items-center gap-2">
              <CalendarIcon size={20} className="text-[#AEC4FF]" />
              Weekly Schedule
            </h3>

            <div className="space-y-4">
              {daysOfWeek.map((day) => (
                <div key={day} className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border transition-all ${daysState[day].checked ? 'border-[#AEC4FF] bg-[#FFF8FA]' : 'border-gray-100 bg-gray-50/50'}`}>
                  <div className="flex items-center gap-4 mb-4 md:mb-0">
                    <Checkbox
                      checked={daysState[day].checked}
                      onChange={() => handleCheckboxChange(day)}
                      className="scale-110"
                    />
                    <span className={`Livvic-Bold text-lg ${daysState[day].checked ? 'text-[#001243]' : 'text-gray-400'}`}>
                      {day}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <TimePicker
                      value={daysState[day].start ? parseTime(daysState[day].start) : null}
                      placeholder="Start Time"
                      onChange={(time) => handleTimeChange(day, "start", time)}
                      disabled={!daysState[day].checked}
                      format="h:mm A"
                      className="rounded-xl border-gray-200 py-2 Livvic-Medium w-32"
                      suffixIcon={<Clock size={14} />}
                    />
                    <span className="text-gray-300">to</span>
                    <TimePicker
                      value={daysState[day].end ? parseTime(daysState[day].end) : null}
                      placeholder="End Time"
                      onChange={(time) => handleTimeChange(day, "end", time)}
                      disabled={!daysState[day].checked}
                      format="h:mm A"
                      className="rounded-xl border-gray-200 py-2 Livvic-Medium w-32"
                      suffixIcon={<Clock size={14} />}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}
