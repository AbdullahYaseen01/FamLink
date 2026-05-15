import { useCallback, useEffect, useState, useMemo } from "react";
import cameraIcons from "../../assets/images/cameraIcon.png";
import { Form, Input, Checkbox, Select, Button, TimePicker, Spin } from "antd";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "react-avatar";
import { fireToastMessage } from "../../toastContainer";
import { editUserThunk } from "../Redux/authSlice";
import Autocomplete from "react-google-autocomplete";
import OptionSelector from "../subComponents/LanguageSelector";
import dayjs from "dayjs";
import {
  ChevronLeft,
  User,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Languages,
  Briefcase,
  Baby,
  FileText,
  Camera,
  Save,
  X
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

const parseTime = (time) => {
  return time ? dayjs(time) : null;
};

export default function EditProfileNanny() {
  const { TextArea } = Input;
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [zipCode, setZipCode] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const [form] = Form.useForm();

  const options = ["English", "Spanish", "French", "Mandarin", "Cantonese", "Arabic"];
  const languageSkills = user?.additionalInfo?.find((info) => info.key === "language")?.value;
  const defaultCheckedValues = languageSkills?.option;

  const daysOfWeek = useMemo(() => ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], []);
  const specificDaysAndTime = user?.additionalInfo?.find((info) => info.key === "specificDaysAndTime")?.value;
  const salaryExp = user?.additionalInfo?.find((info) => info.key === "salaryExp")?.value;
  const jobDescription = user?.additionalInfo.find((i) => i.key === "jobDescription")?.value;

  const [daysState, setDaysState] = useState(() => {
    return daysOfWeek.reduce((acc, day) => {
      const specificDay = specificDaysAndTime?.[day];
      acc[day] = {
        checked: !!specificDay,
        start: specificDay?.start || null,
        end: specificDay?.end || null,
      };
      return acc;
    }, {});
  });

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        fullName: user.name,
        gender: user.gender,
        age: user.age,
        location: user.location?.format_location,
        zipCode: user.zipCode,
        language: defaultCheckedValues,
        firstChild: salaryExp?.firstChild,
        secChild: salaryExp?.secChild,
        thirdChild: salaryExp?.thirdChild,
        fourthChild: salaryExp?.fourthChild,
        fiveOrMoreChild: salaryExp?.fiveOrMoreChild,
        avaiForWorking: user?.additionalInfo.find((info) => info.key === "avaiForWorking")?.value.option,
        availability: user?.additionalInfo.find((info) => info.key === "availability")?.value.option,
        experience: user?.additionalInfo.find((info) => info.key === "experience")?.value.option,
        ageGroupsExp: user?.additionalInfo?.find((info) => info.key === "ageGroupsExp")?.value?.option,
        additionalDetails: user?.additionalInfo?.find((info) => info.key === "additionalDetails")?.value?.option,
        jobDescription: jobDescription,
      });

      setDaysState(daysOfWeek.reduce((acc, day) => {
        const specificDay = specificDaysAndTime?.[day];
        acc[day] = {
          checked: !!specificDay,
          start: specificDay?.start || null,
          end: specificDay?.end || null,
        };
        return acc;
      }, {}));
    }
  }, [user, form, daysOfWeek, specificDaysAndTime, salaryExp, defaultCheckedValues, jobDescription]);

  useEffect(() => {
    const getCurrentLocation = async () => {
      if (!location) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_KEY}`
            );
            const data = await response.json();
            if (data.status === "OK") {
              const address = data.results[0].formatted_address;
              const components = data.results[0].address_components;
              const zipObj = components.find((comp) => comp.types.includes("postal_code"));
              const zip = zipObj ? zipObj.long_name : "";
              if (!zip) {
                fireToastMessage({ message: "Zip code is not available.", type: "error" });
                return;
              }
              setLocation(address);
              setZipCode(zip);
              form.setFieldsValue({ location: address, zipCode: zip });
              const { lat, lng } = data.results[0].geometry.location;
              setCoordinates({ lat, lng, formatted: address });
            }
          } catch (error) {
            fireToastMessage({ message: "Failed to fetch location details.", type: "error" });
          }
        });
      }
    };
    getCurrentLocation();
  }, []);


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

  const [image, setImage] = useState(user.imageUrl);
  const [file, setFile] = useState(null);

  const handleImageChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const imageUrl = URL.createObjectURL(selectedFile);
      setImage(imageUrl);
      setFile(selectedFile);
    }
  };

  const options2 = [
    { value: "Full-time", label: "Full-time" },
    { value: "Part-time", label: "Part-time" },
    { value: "Occasional", label: "Occasional" },
    { value: "Weekends only", label: "Weekends only" },
    { value: "Nights only", label: "Nights only" },
    { value: "Flexible", label: "Flexible" },
  ];

  const defaultCheckedValues2 = user?.additionalInfo.find((info) => info.key === "avaiForWorking")?.value.option;

  const options3 = [
    { value: "Immediate", label: "Immediate" },
    { value: "Start within 1 month", label: "Start within 1 month" },
    { value: "Flexible start date", label: "Flexible start date" },
  ];

  const defaultCheckedValues3 = user?.additionalInfo.find((info) => info.key === "availability")?.value.option;

  const options4 = [
    { value: "Less than 1 year", label: "Less than 1 year" },
    { value: "1-3 years", label: "1-3 years" },
    { value: "3-5 years", label: "3-5 years" },
    { value: "Over 5 years", label: "Over 5 years" },
  ];

  const defaultCheckedValues4 = user?.additionalInfo.find((info) => info.key === "experience")?.value.option;

  const options5 = [
    "Newborns (0-12 months)",
    "Toddlers (1-3 years)",
    "Preschoolers (3-5 years)",
    "School-age (5-12 years)",
    "Teenagers (12+ years)",
  ];

  const options6 = [
    "Full-Time Hours",
    "Meal Prep",
    "Light Housekeeping",
    "Special needs experience",
    "Have a car",
    "Driver's License",
    "Speak English Fluently",
    "Speak Spanish Fluently",
    "Care for a 0-11 years old",
    "Care for a 1-3 years old",
    "Care for 4-9 years old",
    "Care for 10+ years old",
    "First Aid Certified",
    "CPR Certified",
  ];

  const defaultCheckedValues5 = user?.additionalInfo?.find((info) => info.key === "ageGroupsExp")?.value?.option;
  const defaultCheckedValues6 = user?.additionalInfo?.find((info) => info.key === "additionalDetails")?.value?.option;

  const transformObject = (obj) => {
    const additionalInfo = [];
    const keysSet = new Set();
    for (const key in obj) {
      const value = obj[key];
      if (Array.isArray(value) && value.length > 0) {
        if (value.some((item) => item !== undefined) && !keysSet.has(key)) {
          additionalInfo.push({ key: key, value: { option: value } });
          keysSet.add(key);
        }
      }
    }
    const additionalProperties = ["language", "avaiForWorking", "availability", "experience", "ageGroupsExp", "additionalDetails"];
    additionalProperties.forEach((prop) => {
      if (obj[prop] !== undefined && obj[prop] !== null) {
        if (Array.isArray(obj[prop]) && obj[prop].some((item) => item !== undefined) && !keysSet.has(prop)) {
          additionalInfo.push({ key: prop, value: { option: obj[prop] } });
          keysSet.add(prop);
        } else if (typeof obj[prop] === "string" && !keysSet.has(prop)) {
          additionalInfo.push({ key: prop, value: { option: obj[prop] } });
          keysSet.add(prop);
        }
      }
    });
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
        setLoading(false);
        return fireToastMessage({ type: "error", message: "At least one day must be selected." });
      }

      const invalidDays = selectedDays
        .filter(([_, { start, end }]) => {
          const parsedStart = parseTime(start);
          const parsedEnd = parseTime(end);
          return !parsedStart || !parsedEnd || !parsedStart.isValid() || !parsedEnd.isValid() || parsedStart.isSame(parsedEnd) || parsedEnd.isBefore(parsedStart);
        })
        .map(([day]) => day);

      if (invalidDays.length > 0) {
        setLoading(false);
        return fireToastMessage({ type: "error", message: `Invalid times for: ${invalidDays.join(", ")}` });
      }

      const specificDaysAndTime = { key: "specificDaysAndTime", value: checkedDays };
      let addData = transformedObject;
      addData?.additionalInfo.push(salaryExpObject, specificDaysAndTime, salaryRange);
      if (values.jobDescription) {
        addData.additionalInfo.push({ key: "jobDescription", value: values.jobDescription });
      }

      const formData = new FormData();
      const finalZipCode = values.zipCode || zipCode;
      
      if (!finalZipCode) {
        setLoading(false);
        return fireToastMessage({ type: "error", message: "Zip code is missing." });
      }

      if (coordinates) {
        formData.append("location", JSON.stringify({ type: "Point", coordinates: [coordinates.lng, coordinates.lat], format_location: coordinates.formatted }));
      }
      formData.append("zipCode", finalZipCode);
      if (values.fullName) formData.append("name", values.fullName);
      if (values.age) formData.append("age", values.age);
      if (values.gender) formData.append("gender", values.gender);
      if (addData) formData.append("additionalInfo", JSON.stringify(addData.additionalInfo));
      if (file) formData.append("imageUrl", file);

      const { status } = await dispatch(editUserThunk(formData)).unwrap();
      if (status === 200) {
        fireToastMessage({ success: true, message: "User updated successfully" });
        navigate("/nanny/profile");
      }
    } catch (error) {
      fireToastMessage({ success: false, message: "Failed to update user." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLocation(user?.location?.format_location || "");
    setZipCode(user?.zipCode || "");
  }, [user]);

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 md:px-12 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <NavLink to="/nanny/profile" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6 text-primary" />
            </NavLink>
            <h1 className="Livvic-Bold text-xl md:text-2xl text-primary">Edit Profile</h1>
          </div>
          <div className="flex items-center gap-3">
            <NavLink to="/nanny/profile">
              <button className="hidden md:flex items-center gap-2 px-6 py-2 rounded-full border border-gray-200 text-secondary Livvic-SemiBold hover:bg-gray-50 transition-all">
                <X className="w-4 h-4" /> Discard
              </button>
            </NavLink>
            <button
              onClick={() => form.submit()}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-2 rounded-full bg-primary text-primary Livvic-SemiBold shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              {loading ? <Spin size="small" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 mt-8 space-y-8">
        <Form onFinish={onFinish} form={form} layout="vertical" autoComplete="off">

          {/* Profile Photo Section */}
          <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            <h2 className="Livvic-Bold text-lg text-primary mb-6 flex items-center gap-2">
              <User className="w-5 h-5" /> Profile Photo
            </h2>
            <div className="flex items-center gap-8">
              <div className="relative group">
                {image ? (
                  <img src={image} className="w-32 h-32 rounded-full object-cover shadow-md transition-transform group-hover:scale-105" alt="profile" />
                ) : (
                  <Avatar name={user?.name} size="128" round={true} color="#AEC4FF" className="shadow-md" />
                )}
                <label className="absolute bottom-1 -right-2 bg-primary text-white w-10 h-10 rounded-full border-4 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform flex items-center justify-center">
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                  <Camera className="w-5 h-5 text-white" />
                </label>
              </div>
              <div className="space-y-1">
                <p className="Livvic-SemiBold text-primary">Upload a new photo</p>
                <p className="Livvic text-secondary text-sm">Clear headshots help families trust you more.</p>
              </div>
            </div>
          </section>

          {/* Basic Information Section */}
          <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            <h2 className="Livvic-Bold text-lg text-primary mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5" /> Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item name="fullName" initialValue={user?.name} label="Full Name">
                <Input className="Livvic-Medium rounded-xl border-gray-200 py-3 focus:border-primary" />
              </Form.Item>

              <Form.Item name="location" label="Service Address" rules={[{ required: true }]}>
                <div className="relative">
                  <Spin spinning={loading} size="small">
                    <Autocomplete
                      apiKey={import.meta.env.VITE_GOOGLE_KEY}
                      className="w-full rounded-xl border border-gray-200 py-3 px-4 Livvic-Medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={location || ""}
                      onPlaceSelected={(place) => {
                        const address = place.formatted_address;
                        const components = place?.address_components || [];
                        const zipObj = components.find((comp) => comp.types.includes("postal_code"));
                        const zip = zipObj ? zipObj.long_name : "";
                        if (!zip) {
                          fireToastMessage({ message: "Zip code not found.", type: "error" });
                          return;
                        }
                        const lat = place?.geometry?.location?.lat();
                        const lng = place?.geometry?.location?.lng();
                        setCoordinates({ lat, lng, formatted: address });
                        setLocation(address);
                        setZipCode(zip);
                        form.setFieldsValue({ location: address, zipCode: zip });
                      }}
                      onChange={(e) => setLocation(e.target.value)}
                      options={{ types: ["address"], componentRestrictions: { country: "us" } }}
                    />
                  </Spin>
                  <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                </div>
              </Form.Item>

              <Form.Item name="zipCode" label="Zip Code" rules={[{ required: true, message: "Required" }]}>
                <Input 
                  className="Livvic-Medium rounded-xl border-gray-200 py-3" 
                  onChange={(e) => setZipCode(e.target.value)} 
                />
              </Form.Item>

              <Form.Item name="gender" initialValue={user?.gender} label="Gender">
                <Select className="h-12 w-full rounded-xl border-gray-200" placeholder="Select gender">
                  <Select.Option value="Male">Male</Select.Option>
                  <Select.Option value="Female">Female</Select.Option>
                  <Select.Option value="Other">Other</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item name="age" initialValue={user?.age} label="Age">
                <Input type="number" className="Livvic-Medium rounded-xl border-gray-200 py-3" />
              </Form.Item>
            </div>
          </section>

          {/* Languages Section */}
          <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            <h2 className="Livvic-Bold text-lg text-primary mb-6 flex items-center gap-2">
              <Languages className="w-5 h-5" /> Languages
            </h2>
            <OptionSelector options={options} form={form} defaultCheckedValues={defaultCheckedValues} name="language" />
          </section>

          {/* Weekly Schedule Section */}
          <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="Livvic-Bold text-lg text-primary flex items-center gap-2">
                <Calendar className="w-5 h-5" /> Weekly Availability
              </h2>
              <p className="text-secondary text-sm Livvic">Select your working days and hours.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {daysOfWeek.map((day) => (
                <div key={day} className={`p-4 rounded-2xl border transition-all ${daysState[day].checked ? 'bg-primary/5 border-primary shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <Checkbox checked={daysState[day].checked} onChange={() => handleCheckboxChange(day)}>
                      <span className="Livvic-SemiBold text-primary">{day}</span>
                    </Checkbox>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <TimePicker
                        value={daysState[day].start ? parseTime(daysState[day].start) : null}
                        placeholder="Start"
                        onChange={(time) => handleTimeChange(day, "start", time)}
                        disabled={!daysState[day].checked}
                        format="h:mm A"
                        className="rounded-lg border-gray-200 w-full"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <TimePicker
                        value={daysState[day].end ? parseTime(daysState[day].end) : null}
                        placeholder="End"
                        onChange={(time) => handleTimeChange(day, "end", time)}
                        disabled={!daysState[day].checked}
                        format="h:mm A"
                        className="rounded-lg border-gray-200 w-full"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Service Pricing Section */}
          <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            <h2 className="Livvic-Bold text-lg text-primary mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5" /> Service Pricing
            </h2>
            <p className="text-secondary text-sm mb-6 Livvic">Set your hourly rates based on the number of children.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: "1 Child", name: "firstChild" },
                { label: "2 Children", name: "secChild" },
                { label: "3 Children", name: "thirdChild" },
                { label: "4 Children", name: "fourthChild" },
                { label: "5+ Children", name: "fiveOrMoreChild" },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <label className="text-xs Livvic-Bold text-secondary uppercase tracking-wider">{item.label}</label>
                  <Form.Item name={item.name} initialValue={salaryExp?.[item.name] ?? ""} noStyle>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary Livvic-SemiBold">$</span>
                      <Input type="number" className="pl-6 pr-8 py-3 rounded-xl border-gray-200 Livvic-Bold text-primary focus:ring-primary/20" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary text-xs">/h</span>
                    </div>
                  </Form.Item>
                </div>
              ))}
            </div>
          </section>

          {/* Professional Details Section */}
          <section className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
            <h2 className="Livvic-Bold text-lg text-primary mb-6 flex items-center gap-2">
              <Briefcase className="w-5 h-5" /> Professional Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Form.Item name="avaiForWorking" initialValue={defaultCheckedValues2} label="Availability">
                <Select className="h-12 w-full rounded-xl" options={options2} />
              </Form.Item>
              <Form.Item name="availability" initialValue={defaultCheckedValues3} label="Start Availability">
                <Select className="h-12 w-full rounded-xl" options={options3} />
              </Form.Item>
              <Form.Item name="experience" initialValue={defaultCheckedValues4} label="Years of Experience">
                <Select className="h-12 w-full rounded-xl" options={options4} />
              </Form.Item>
            </div>

            <div className="mt-8">
              <label className="Livvic-Bold text-primary mb-4 block flex items-center gap-2">
                <Baby className="w-4 h-4" /> Age Group Experience
              </label>
              <OptionSelector options={options5} defaultCheckedValues={defaultCheckedValues5} form={form} name="ageGroupsExp" />
            </div>

            <div className="mt-8">
              <label className="Livvic-Bold text-primary mb-4 block flex items-center gap-2">
                <FileText className="w-4 h-4" /> About Me / Bio
              </label>
              <Form.Item name="jobDescription" initialValue={user?.additionalInfo.find((i) => i.key === "jobDescription")?.value}>
                <TextArea
                  rows={6}
                  placeholder="Tell families about your approach, skills, and background..."
                  className="rounded-2xl border-gray-200 p-4 Livvic focus:ring-primary/20 transition-all"
                />
              </Form.Item>
            </div>

            <div className="mt-8">
              <label className="Livvic-Bold text-primary mb-4 block">Additional Details & Specializations</label>
              <OptionSelector options={options6} defaultCheckedValues={defaultCheckedValues6} form={form} name="additionalDetails" />
            </div>
          </section>

          {/* Bottom Actions for Mobile */}
          <div className="md:hidden flex flex-col gap-3 mt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary Livvic-Bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" /> Save Changes
            </button>
            <NavLink to="/nanny/profile">
              <button className="w-full bg-white text-secondary border border-gray-200 Livvic-Bold py-4 rounded-2xl">
                Discard Changes
              </button>
            </NavLink>
          </div>
        </Form>
      </div>
    </div>
  );
}
