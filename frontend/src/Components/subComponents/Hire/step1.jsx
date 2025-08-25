import { Form, Checkbox, Select, Spin, Input } from "antd";
import { InputDa, InputPassword, InputDOB } from "../input";
import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { fireToastMessage } from "../../../toastContainer";
import document from "../../../assets/documents/Terms_and_Conditions.pdf";
import PropTypes from "prop-types";
import Autocomplete from "react-google-autocomplete";
import { api } from "../../../Config/api";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useDispatch } from "react-redux";
import { userCheckThunk } from "../../Redux/authSlice";
import { updateForm } from "../../Redux/formValue";

export default function HireStep1({ formRef, head, comm, handleNext }) {
  const { Option } = Select;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [zipCode, setZipCode] = useState("");
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const dispatch = useDispatch();

  function LoginPage() {
    const onSuccess = async (credentialResponse) => {
      // Check if terms checkbox is checked
      // const remember = form.getFieldValue("remember");
      // if (!remember) {
      //   fireToastMessage({
      //     message: "Please agree to the Terms & Conditions before proceeding.",
      //     type: "error",
      //   });
      //   return;
      // }
      const decoded = jwtDecode(credentialResponse.credential);
      console.log("Decoded Token", decoded);

      // You can now access:
      console.log("Email:", decoded.email);
      console.log("Name:", decoded.name);
      console.log("Picture:", decoded.picture);
      try {
        const res = await dispatch(
          userCheckThunk({ email: decoded.email })
        ).unwrap();

        if (res.message === "Email already exists") {
          fireToastMessage({
            message: res.message,
            type: "error",
          });
          return;
        }

        // Prefill and proceed
        // formRef.current = {
        //   name: decoded.name,
        //   email: decoded.email,
        //   imageUrl: decoded.picture,
        //   registeredVia: "google",
        // };

        dispatch(
          updateForm({
            name: decoded.name,
            email: decoded.email,
            imageUrl: decoded.picture,
            registeredVia: "google",
          })
        );

        handleNext();
      } catch (err) {
        console.error("Google signup callback error:", err);
        fireToastMessage({
          message: err.message || "Something went wrong",
          type: "error",
        });
      }
    };

    const onError = () => {
      console.log("Login Failed");
    };

    return <GoogleLogin onSuccess={onSuccess} onError={onError} />;
  }

  useEffect(() => {
    const getCurrentLocation = async () => {
      console.log("formRef:", formRef.current);
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

  const onFinish = (value) => {
    console.log("Submitted:", value);
  };

  if (formRef) {
    formRef.current = form;
  }

  HireStep1.propTypes = {
    formRef: PropTypes.shape({ current: PropTypes.any }),
    head: PropTypes.node,
    comm: PropTypes.any,
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

  return (
    <div>
      <div className="flex flex-col items-center">
        {/* <div
          className="flex gap-2 cursor-pointer bg-gray-100 justify-center Livvic-SemiBold text-sm text-primary w-96 py-4 mb-4 rounded-[6px]"
          onClick={handleGoogleSignup}
        >
          <img src="/google-icon.svg" alt="google" /> Continue with Google
        </div> */}
        <LoginPage />
        <div className="flex items-center my-3 w-96">
          <div className="flex-grow h-px bg-gray-300" />
          <span className="mx-4 text-sm text-gray-500">or</span>
          <div className="flex-grow h-px bg-gray-300" />
        </div>
      </div>
      <p className="px-3 width-form text-center text-primary Livvic-Bold text-4xl">
        <p className="px-3 width-form text-center text-primary Livvic-Bold text-4xl">
          {head.includes("Let’s create") || head.includes("Let's create") ? (
            <>
              {head.split(/Let[’']s create/)[0]}Let’s create
              <br />
              {head.split(/Let[’']s create/)[1]}
            </>
          ) : (
            head
          )}
        </p>
      </p>

      <div className="flex justify-center my-10">
        <Form
          form={form}
          name="validateOnly"
          autoComplete="off"
          onFinish={onFinish}
        >
          <div className="flex flex-col w-full gap-y-6">
            {/* Full Name */}
            <InputDa
              type={"text"}
              name={"name"}
              placeholder={"Enter your name"}
              labelText={"Full name"}
            />

            <InputDa
              type={"email"}
              name={"email"}
              placeholder={"Enter your email"}
              labelText={"Your email"}
            />
          </div>

          <div className="w-full">
            {" "}
            <InputPassword />
          </div>

          <div className="gap-y-6">
            <InputDOB />

            <div>
              <div className="relative">
                <Form.Item
                  name="zipCode"
                  rules={[{ required: true, message: "ZIP code is required" }]}
                >
                  <Spin spinning={loading} size="small">
                    <Input
                      name="zipCode"
                      placeholder="Enter ZIP code"
                      value={zipCode}
                      onChange={(e) => {
                        const zip = e.target.value;
                        setZipCode(zip);
                        form.setFieldsValue({ zipCode: zip });
                        dispatch(updateForm({ zipCode: zip }));
                      }}
                      onBlur={(e) => handleZipValidation(e.target.value.trim())}
                      className="px-4 pt-7 pb-2 border border-[#EEEEEE] rounded-[10px]"
                      maxLength={10}
                    />
                  </Spin>
                </Form.Item>
                <label
                  htmlFor="zip code"
                  className="absolute left-4 top-2 text-sm text-gray-500 bg-white px-1 z-10"
                >
                  Zip Code
                </label>
              </div>
            </div>
          </div>

          <div>
            {/* Address */}
            <div className="relative">
              <Form.Item
                name="location"
                // initialValue={user?.location}
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
                    onPlaceSelected={async (place) => {
                      const address = place.formatted_address;
                      const components = place?.address_components || [];

                      const zipObj = components.find((comp) =>
                        comp.types.includes("postal_code")
                      );
                      const zip = zipObj ? zipObj.long_name : "";

                      // if (!zip) {
                      //   fireToastMessage({
                      //     message:
                      //       "Zip code is not available for the selected location. Please try another location.",
                      //     type: "error",
                      //   });
                      //   setLocation("");
                      //   setZipCode("");
                      //   form.setFieldsValue({ location: "", zipCode: "" });
                      //   return;
                      // }

                      const lat = place?.geometry?.location?.lat();
                      const lng = place?.geometry?.location?.lng();

                      const location = {
                        type: "Point",
                        coordinates: [lng, lat],
                        format_location: address,
                      };

                      if (lat && lng) {
                        setCoordinates({
                          lat,
                          lng,
                          formatted: address,
                        });
                      }

                      if (!zip && lat && lng) {
                        const geocodeRes = await fetch(
                          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${
                            import.meta.env.VITE_GOOGLE_KEY
                          }`
                        );
                        const geocodeData = await geocodeRes.json();
                        const altZip =
                          geocodeData.results[0]?.address_components?.find(
                            (c) => c.types.includes("postal_code")
                          )?.long_name;

                        if (altZip) {
                          setZipCode(altZip);
                          form.setFieldsValue({
                            location: JSON.stringify(location),
                            zipCode: altZip,
                          });
                          dispatch(
                            updateForm({
                              location: JSON.stringify(location),
                              zipCode: altZip,
                            })
                          );
                        } else {
                          fireToastMessage({
                            message:
                              "No ZIP code found even with coordinates. Try again.",
                            type: "error",
                          });
                          return;
                        }
                      }

                      setLocation(address);
                      setZipCode(zip);

                      form.setFieldsValue({
                        location: JSON.stringify(location),
                        zipCode: zip,
                      });

                      dispatch(
                        updateForm({
                          location: JSON.stringify(location),
                          zipCode: zip,
                        })
                      );

                      setLoading(false);
                    }}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      setLoading(e.target.value.length > 0);
                    }}
                    onBlur={() => setLoading(false)}
                    options={{
                      types: ["geocode"],
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
          </div>

          <div className="flex flex-wrap justify-start gap-x-6">
            {comm && (
              <div className="flex flex-col">
                <p className="mb-2 text-xl capitalize text-start Livvic">
                  As an
                </p>
                <Form.Item
                  name="type"
                  rules={[{ required: true, message: "Please select a role" }]}
                >
                  <Select className="width-b" placeholder="As a">
                    <Option key="Parents" value="Parents">
                      Parents
                    </Option>
                    <Option key="Nanny" value="Nanny">
                      Nanny
                    </Option>
                  </Select>
                </Form.Item>
              </div>
            )}
          </div>

          <p className="font-normal text-base text-center already-acc">
            Already have an account?{" "}
            <NavLink
              to="/login"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <span className="underline cursor-pointer">Log in</span>
            </NavLink>
          </p>

          <Form.Item
            className="mx-auto mt-3 mb-0 w-60 line1-20"
            name="remember"
            valuePropName="checked"
            rules={[{ required: true, message: "" }]}
          >
            <Checkbox>
              By proceeding you agree to the{" "}
              <a
                href={document}
                target="_blank"
                className="underline cursor-pointer text-center"
              >
                Terms & Conditions
              </a>
            </Checkbox>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
