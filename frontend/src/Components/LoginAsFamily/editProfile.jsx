import { useCallback, useEffect, useState } from "react";
import cameraIcons from "../../assets/images/cameraIcon.png";
import { Form, Input, Checkbox, Select, Button, TimePicker, Spin } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { editUserThunk, refreshTokenThunk } from "../Redux/authSlice";
import { fireToastMessage } from "../../toastContainer";
import Avatar from "react-avatar";
import Autocomplete from "react-google-autocomplete";
import { api } from "../../Config/api";
import { formatSentence, toCamelCase } from "../subComponents/toCamelStr";
import { useNavigate } from "react-router-dom";
import OptionSelector from "../subComponents/LanguageSelector";
import CustomButton from "../../NewComponents/Button"

export default function EditProfile() {
  const { TextArea } = Input;
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const [selectedChildren, setSelectedChildren] = useState(
    user?.noOfChildren?.length
  );
  const [childrenAges, setChildrenAges] = useState(() => {
    const info = user?.noOfChildren?.info || {};
    const len = user?.noOfChildren?.length || 0;
    return Array.from({ length: len }, (_, i) => info[`Child${i + 1}`] || "");
  });

  useEffect(() => {
    const getCurrentLocation = async () => {
      if (!location) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${
                import.meta.env.VITE_GOOGLE_KEY
              }`
            );
            const data = await response.json();

            if (data.status === "OK") {
              const address = data.results[0].formatted_address;
              const components = data.results[0].address_components;

              const zipObj = components.find((comp) =>
                comp.types.includes("postal_code")
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

  const handleChildrenChange = (value) => {
    setSelectedChildren(value);
    // Adjust the age array size based on the selected number of children
    setChildrenAges((prevAges) => {
      const updatedAges = [...prevAges];
      if (value > updatedAges.length) {
        return [...updatedAges, ...Array(value - updatedAges.length).fill("")];
      } else {
        return updatedAges.slice(0, value);
      }
    });
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

  const options5 = [
    "Nanny",
    "Private Educator",
    "Swim Instructor",
    "Specialized Caregiver",
    "Sports Coaches",
    "Music Instructor",
    "House Manager",
  ];
  const formattedServiceLabels =
    user?.services?.map((s) => formatSentence(s)) || [];
  const dispatch = useDispatch();
  useEffect(() => {
    const newValues = {};
    childrenAges.forEach((age, index) => {
      newValues[`Child${index + 1}`] = age;
    });
    form.setFieldsValue(newValues);
  }, [selectedChildren]);
  // Transform the input object
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();

      // ✅ Validate location data
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

      // ✅ Append basic fields
      if (values.fullName) formData.append("name", values.fullName);
      if (values.age) formData.append("age", values.age);
      if (values.gender) formData.append("gender", values.gender);
      if (values.description) formData.append("aboutMe", values.description);
      if (file) formData.append("imageUrl", file);

      // 👶 Append children info
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

      // 🧹 Append services
      if (values.services?.length > 0) {
        const camelCaseServices = values.services.map((s) =>
          typeof s === "string" ? toCamelCase(s) : s
        );
        formData.append("services", JSON.stringify(camelCaseServices));
      }

      // 🚀 Dispatch update
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

  const handleZipValidation = async (zip) => {
    if (!zip) return;

    setLoading(true);
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (!res.ok) throw new Error("Invalid ZIP");

      const data = await res.json();
      const finalZip = data["post code"];
      if (finalZip) {
        setZipCode(finalZip);
        form.setFieldsValue({
          zipCode: finalZip,
        });
      } else {
        throw new Error("Invalid structure");
      }
    } catch (err) {
      setZipCode("");
      form.setFieldsValue({ zipCode: "" });
      fireToastMessage({
        type: "error",
        message: "Invalid ZIP code. Please enter a valid U.S. ZIP.",
      });
    } finally {
      setLoading(false);
    }
  };

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
      <div className="bg-white my-10">
        <p className="Livvic-SemiBold lg:text-3xl text-2xl">Edit Profile</p>
        <div className="mt-6">
          <div className="relative w-24">
            {/* Profile Picture */}
            {image ? (
              <img
                src={image}
                alt="Profile"
                className="rounded-full w-24 h-24 object-cover"
              />
            ) : (
              <Avatar
                className="rounded-full text-black"
                size="96"
                color={"#38AEE3"}
                name={
                  user?.name
                    ?.split(" ") // Split by space
                    .slice(0, 2) // Take first 1–2 words
                    .join(" ") // Re-join them
                }
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
                {/* <div>
                  <p className="mb-2 font-semibold text-lg capitalize">
                    Zip Code
                  </p>
                  <Form.Item
                    style={{ margin: 0, padding: 0 }}
                    name="zipCode"

                    initialValue={zipCode}
                  >
                    <Input
                      type="text"
                      style={{ borderColor: "#D6DDEB" }}
                      defaultValue={zipCode}
                      className="border- border-2 py-2 rounded-3xl"
                    />
                  </Form.Item>
                </div> */}
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
                            comp.types.includes("postal_code")
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

              <div className="">
                <div className="relative w-72">
                  <Form.Item
                    name="totalChild"
                    initialValue={selectedChildren}
                    style={{ margin: 0, padding: 0 }}
                  >
                    <Select
                      bordered={false}
                      defaultValue={selectedChildren}
                      onChange={handleChildrenChange}
                      className="peer w-full pt-6 pb-2 px-2 border border-[#EEEEEE] rounded-[10px]"
                      style={{
                        height: "64px",
                      }}
                      placeholder="Gender"
                    >
                      {[1, 2, 3, 4].map((num) => (
                        <Select.Option key={num} value={num}>
                          {num}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <label className="absolute left-4 top-2 text-sm text-gray-500 bg-white px-1 z-10">
                    No. of Child
                  </label>
                </div>

                <div className="flex flex-wrap gap-x-4 mt-4">
                  {childrenAges.map((age, index) => (
                    <div key={index} className="relative w-72">
                      <Form.Item
                        style={{ margin: 0, padding: 0 }}
                        name={`Child${index + 1}`}
                        initialValue={age}
                      >
                        <Input
                          id="fullName"
                          type="number"
                          value={age}
                          onChange={(e) => {
                            const updated = [...childrenAges];
                            updated[index] = e.target.value;
                            setChildrenAges(updated);

                            form.setFieldsValue({
                              [`Child${index + 1}`]: e.target.value,
                            });
                          }}
                          defaultValue={user?.name}
                          className="peer border border-[#EEEEEE] rounded-[10px] px-4 pt-7 pb-2 w-full placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder={`Age of Child ${index + 1}`}
                        />
                      </Form.Item>
                      <label
                        htmlFor="fullName"
                        className="absolute left-4 top-2 text-sm text-gray-500 bg-white px-1 z-10"
                      >
                        {`Child${index + 1}`}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="my-5 Livvic-SemiBold text-lg text-primary">
                  About me
                </p>
                <div className="relative w-full">
                  <Form.Item
                    style={{ margin: 0, padding: 0 }}
                    name="description"
                    initialValue={user?.aboutMe}
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
                  defaultValue={user?.aboutMe}
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
                    Description
                  </label>
                </div>
              </div>

              <div>
                <p className="my-5 Livvic-SemiBold text-lg text-primary">
                  Services for
                </p>
                     <OptionSelector
                                  options={options5}
                                  defaultCheckedValues={formattedServiceLabels}
                                  form={form}
                                  name={"services"}
                                />
                {/* <Form.Item
                  style={{ margin: 0, padding: 0 }}
                  name="services"
                  initialValue={formattedServiceLabels} // Default checked values for form submission
                >
                  <Checkbox.Group
                    options={options5}
                    defaultValue={formattedServiceLabels} // Set default checked values
                    className="rounded-3xl custom-checkbox-group"
                    style={{ borderColor: "#D6DDEB", margin: 0, padding: 0 }}
                  />
                </Form.Item> */}
              </div>

              <div className="flex justify-end mt-5">
                <Form.Item className="m-0 p-0">
                  {/* <Button
                    style={{ color: "#38AEE3", border: "1px solid #38AEE3" }}
                    className="bg-[#FFFFFF] rounded-3xl"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button> */}
                  <CustomButton className="mr-4 !w-48 text-lg Livvic-Medium text-[#555555] border border-[#EEEEEE]" btnText={"Cancel"} action={() => navigate(-1)}/>
                  {/* <Button
                    type="primary"
                    loading={loading}
                    htmlType="submit"
                    className="bg-[#38AEE3] ml-4 px-6 rounded-3xl text-white"
                  >
                    Save
                  </Button> */}
                  <CustomButton btnText={"Save"} htmlType="submit" isLoading={loading} loadingBtnText="Saving..." className="bg-[#AEC4FF] text-primary Livvic-Medium !w-48 text-lg"/>
                </Form.Item>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
