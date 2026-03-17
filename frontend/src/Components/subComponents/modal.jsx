import React, { useCallback, useEffect, useState } from "react";
import {
  Form,
  Modal,
  Input,
  Button,
  Checkbox,
  Radio,
  Select,
  Switch,
} from "antd";
import CustomButton from "../../NewComponents/Button";
import { InputOTP } from "antd-input-otp";
import { RightOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
// import {
//   CardCvcElement,
//   CardExpiryElement,
//   CardNumberElement,
//   useElements,
//   useStripe,
// } from "@stripe/react-stripe-js";
import { Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";
// import { getSaveCardThunk, saveCardThunk } from "../Redux/cardSlice";
import { fireToastMessage } from "../../toastContainer";
import {
  updateEmailNotiThunk,
  updateEmailThunk,
  updatePasswordThunk,
  updatePhoneThunk,
  updateTextNotifThunk,
} from "../Redux/updateSlice";
import {
  refreshTokenThunk,
  sendOtpThunk,
  verifyOtpThunk,
  verifyUserThunk,
  deleteUserThunk,
} from "../Redux/authSlice";
import useSocket from "../../Config/socket";
import { number } from "prop-types";
import PhoneVerification from "./PhoneVerification";
const App = ({ head, enable, withDraw, payNow, emailVer = false }) => {
  const dispatch = useDispatch();
  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
      },
    },
  };
  const { socket } = useSocket();

  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  const handleRemoveImage = (side) => {
    if (side === "front") {
      setFrontImage(null);
    } else if (side === "back") {
      setBackImage(null);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles, side) => {
      if (side === "front" && frontImage) {
        alert("You can only upload one image for the front side.");
        return;
      }
      if (side === "back" && backImage) {
        alert("You can only upload one image for the back side.");
        return;
      }

      const imageFile = acceptedFiles[0];
      if (imageFile && imageFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          if (side === "front") {
            setFrontImage(reader.result);
          } else if (side === "back") {
            setBackImage(reader.result);
          }
        };
        reader.readAsDataURL(imageFile);
      }
    },
    [frontImage, backImage]
  );

  const { getRootProps: getFrontRootProps, getInputProps: getFrontInputProps } =
    useDropzone({
      onDrop: (acceptedFiles) => onDrop(acceptedFiles, "front"),
      accept: "image/*",
    });

  const { getRootProps: getBackRootProps, getInputProps: getBackInputProps } =
    useDropzone({
      onDrop: (acceptedFiles) => onDrop(acceptedFiles, "back"),
      accept: "image/*",
    });
  const options = [
    { label: "New Messages", value: "newMessage" },
    { label: "Background Checks", value: "backgroundCheck" },
    { label: "Safety Notifications", value: "safetyNoti" },
    { label: "New Recommended Listings", value: "newRecoLists" },
    { label: "Tips and Tricks", value: "tipsAndTricks" },
    { label: "References", value: "ref" },
    { label: "Disabled Account Info", value: "disAccInfo" },
    { label: "New Subscriber in area", value: "newSubInArea" },
    // { label: 'Payrolls', value: 'payrolls' }
  ];

  // const elements = useElements();
  // const stripe = useStripe();
  const { user } = useSelector((s) => s.auth);
  const [timeLeft, setTimeLeft] = useState(120); // 120 seconds for 2 minutes
  const [isResendEnabled, setIsResendEnabled] = useState(false);
  const [smsNoti, setSMSNoti] = useState(user?.notifications?.sms);
  const trueKeys = Object.entries(user?.notifications?.email)
    .filter(([key, value]) => value === true)
    .map(([key]) => key);
  useEffect(() => {
    if (timeLeft === 0) {
      setIsResendEnabled(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleResend = async () => {
    setLoading(true);
    try {
      const { data, status } = await dispatch(sendOtpThunk()).unwrap();
      if (status === 200) {
        setLoading(false);
        fireToastMessage({ success: true, message: data.message });
        setTimeLeft(120); // Reset timer to 2 minutes
        setIsResendEnabled(false);
      } else {
        setLoading(false);
        fireToastMessage({ type: "error", message: data.message });
      }
    } catch (error) {
      setLoading(false);
      fireToastMessage({ type: "error", message: error.message });
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Local state to fully control switch UI
  const [switchStates, setSwitchStates] = useState(() => {
    const emailPrefs = user?.notifications?.email || {};
    return options.reduce((acc, opt) => {
      acc[opt.value] = emailPrefs[opt.value] === true;
      return acc;
    }, {});
  });

  const handleToggle = async (optionKey, newChecked) => {
    const prevState = switchStates[optionKey];

    // Optimistically update UI
    setSwitchStates((prev) => ({ ...prev, [optionKey]: newChecked }));

    try {
      setLoading(true);
      const newPrefs = {
        ...user?.notifications?.email,
        [optionKey]: newChecked,
      };

      await dispatch(
        updateEmailNotiThunk({
          emailNotification: newPrefs,
        })
      ).unwrap();

      fireToastMessage({
        type: "success",
        message: "Saved successfully",
      });
    } catch (err) {
      // Rollback UI on failure
      setSwitchStates((prev) => ({ ...prev, [optionKey]: prevState }));
      fireToastMessage({
        type: "error",
        message: err.message || "Save failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(0);

  const showModal = () => {
    setStep(0);
    setIsModalOpen(true);
  };
  const handleOk = () => {
    setStep(0);
    setIsModalOpen(false);
  };
  const handleCancel = () => {
    setStep(0);
    setIsModalOpen(false);
    setDeleteText("");
  };
  const deleteAccount = async () => {
    if (deleteText !== "DELETE")
      fireToastMessage({
        type: "error",
        message: "You need to type DELETE in the input field to confirm delete",
      });
    setIsDeleting(true);
    await dispatch(deleteUserThunk(user._id))
      .unwrap()
      .then((res) => {
        // Redirect or show success message
        fireToastMessage({
          type: "success",
          message: "Your account is successfully deleted!",
        });
      })
      .catch((err) => {
        console.error("Failed to delete user:", err);
      });
    setIsDeleting(false);
    setDeleteText("");
  };
  const billingMethod = async () => {
    if (step == 0 && head == "Email Notifications") {
      setLoading(true);
      try {
        const { data, status } = await dispatch(sendOtpThunk()).unwrap();
        if (status === 200) {
          fireToastMessage({ success: true, message: data.message });
          setTimeLeft(120);
          setStep((prevStep) => prevStep + 1);
          setLoading(false);
        } else {
          setLoading(false);
          fireToastMessage({ type: "error", message: data.message });
        }
      } catch (error) {
        setLoading(false);
        fireToastMessage({ type: "error", message: error.message });
      }
    } else if (step == 1 && paymentMethod == "paymentCard") {
      setTimeLeft(120);
      setStep((prevStep) => prevStep + 1);
    } else if (step == 1 && paymentMethod == "paypal") {
      handleCancel();
    } else if (head != "Email Verification") {
      setStep((prevStep) => prevStep + 1);
    }
  };
  const [paymentMethod, setPaymentMethod] = useState("paymentCard");

  const handlePaymentChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      currentEmail: user?.email,
      emailOtp: user?.email,
      currentPhoneNumber: user?.phoneNo,
      emailNotification: trueKeys,
    });
  }, [user, form]);

  const onFinish = async (values) => {
    // if (!stripe || !elements) return;
    // if (head == "Payments") {
    //   const cardNumberElement = elements.getElement(CardNumberElement);
    //   const cardExpiryElement = elements.getElement(CardExpiryElement);
    //   const cardCvcElement = elements.getElement(CardCvcElement);
    //   const { paymentMethod, error } = await stripe.createPaymentMethod({
    //     type: "card",
    //     card: cardNumberElement,
    //     billing_details: {
    //       email: user?.email,
    //       name: `${values.firstName} ${values.lastName}`,
    //       address: {
    //         postal_code: values.postalCode,
    //         country: values.country,
    //         line1: values.addressLine,
    //         city: values.city,
    //       },
    //     },
    //   });

    //   if (error) {
    //     console.error(error);
    //     return setError(error.message);
    //   } else {
    //     // Send paymentMethod.id and email to the backend to save
    //     const { data, status } = await dispatch(
    //       saveCardThunk(paymentMethod)
    //     ).unwrap();
    //     if (status == 200) {
    //       fireToastMessage({ success: true, message: data.message });
    //       await dispatch(getSaveCardThunk());
    //       setStep(0);

    //       setIsModalOpen(false);
    //     } else {
    //       fireToastMessage({ error: true, message: data.message });
    //     }
    //   }
    // }
    if (head === "Email") {
      const { currentEmail, newEmail } = values;
      setLoading(true);
      try {
        // Attempt to update the email
        const { data, status } = await dispatch(
          updateEmailThunk({ currentEmail, newEmail })
        ).unwrap();
        if (status === 200) {
          setLoading(false);
          form.resetFields();
          fireToastMessage({ success: true, message: data.message });
          dispatch(refreshTokenThunk());
          setStep(0);
          setIsModalOpen(false);
        } else {
          setLoading(false);
          fireToastMessage({ type: "error", message: data.message });
        }
      } catch (error) {
        // Handle error here
        console.error("Error updating email:", error);
        fireToastMessage({
          type: "error",
          message:
            error.message || "An error occurred while updating the email.",
        });
        setLoading(false);
      }
    }
    if (head == "Password") {
      const { currentPassword, newPassword } = values;
      setLoading(true);
      try {
        const { data, status } = await dispatch(
          updatePasswordThunk({ currentPassword, newPassword })
        ).unwrap();
        if (status === 200) {
          setLoading(false);
          form.resetFields();
          fireToastMessage({ success: true, message: data.message });
          dispatch(refreshTokenThunk());
          setStep(0);
          setIsModalOpen(false);
        } else {
          setLoading(false);
          fireToastMessage({ type: "error", message: data.message });
        }
      } catch (error) {
        setLoading(false);
        // Handle error here
        console.error("Error updating email:", error);
        fireToastMessage({
          type: "error",
          message:
            error.message || "An error occurred while updating the password.",
        });
      }
    }
    if (head == "Phone Number") {
      const { phoneNo } = values;
      setLoading(true);
      try {
        const { data, status } = await dispatch(
          updatePhoneThunk({ phoneNo })
        ).unwrap();
        if (status === 200) {
          form.resetFields();
          fireToastMessage({ success: true, message: data.message });
          dispatch(refreshTokenThunk());
          setStep(0);
          setIsModalOpen(false);
          setLoading(false);
        } else {
          fireToastMessage({ type: "error", message: data.message });
          setLoading(false);
        }
      } catch (error) {
        // Handle error here
        console.error("Error updating email:", error);
        fireToastMessage({
          type: "error",
          message:
            error.message || "An error occurred while updating the password.",
        });
        setLoading(false);
      }
    }

    if (head === "Email Notifications") {
      let { oneTimePass } = values;
      setLoading(true);
      oneTimePass = oneTimePass.join("");
      try {
        const { data, status } = await dispatch(
          verifyOtpThunk({ oneTimePass })
        ).unwrap();
        if (status === 200) {
          form.resetFields();
          fireToastMessage({ success: true, message: data.message });
          dispatch(refreshTokenThunk());
          setStep(0);
          setLoading(false);
          setIsModalOpen(false);
        } else {
          setLoading(false);
          fireToastMessage({ type: "error", message: data.message });
        }
      } catch (error) {
        setLoading(false);
        fireToastMessage({ type: "error", message: error.message });
      }
    }
    if (head == "National ID") {
      if (!frontImage || !backImage) {
        fireToastMessage({
          type: "error",
          message: "Please upload both images.",
        });
        return;
      }

      // Convert base64 to File
      const base64ToFile = (base64, fileName) => {
        const arr = base64.split(",");
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], fileName, { type: mime });
      };

      const frontFile = base64ToFile(frontImage, "frontImage.png");
      const backFile = base64ToFile(backImage, "backImage.png");
      // Create FormData
      const formData = new FormData();
      formData.append("frontImage", frontFile);
      formData.append("backImage", backFile);
      try {
        setLoading(true);
        const { data } = await dispatch(verifyUserThunk(formData)).unwrap();

        await new Promise((resolve, reject) => {
          const updateContent = {
            senderId: user._id,
            content: "Send a request for National ID verification",
            type: "Verification",
          };

          const timeout = setTimeout(() => {
            reject(new Error("Socket emission timeout"));
          }, 5000);

          socket.emit(
            "sendNotificationToAdmin",
            { content: updateContent },
            () => {
              clearTimeout(timeout);
              resolve();
            }
          );
        });

        fireToastMessage({ message: data.message });
        setFrontImage(null);
        setBackImage(null);
        setIsModalOpen(false);
      } catch (err) {
        fireToastMessage({
          type: "error",
          message: err?.message || err?.error || "Verification failed.",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const renderContent = () => {
    switch (head) {
      case "Email":
        return (
          <div className="flex flex-col">
            <p className="Livvic-SemiBold text-primary text-lg">Change Email</p>
            <div className="mt-6 space-y-4">
              <div className="relative">
                <Form.Item
                  style={{ margin: 0, padding: 0 }}
                  name="currentEmail"
                  initialValue={user?.email}
                  rules={[{ required: true, message: "" }]}
                >
                  <Input
                    type="email"
                    readOnly
                    defaultValue={user?.email}
                    className="peer border border-[#EEEEEE] rounded-[10px] px-4 pt-7 pb-2 w-full placeholder-transparent"
                    placeholder="Your Email"
                  />
                </Form.Item>
                <label
                  htmlFor="currentEmail"
                  className="absolute left-4 top-2 text-sm text-gray-500 bg-white px-1 z-10"
                >
                  Current Email
                </label>
              </div>

              <div>
                <Form.Item
                  style={{ margin: 0, padding: 0 }}
                  name="newEmail"
                  rules={[{ required: true, message: "" }]}
                >
                  <Input
                    type="email"
                    placeholder="Confirm Email"
                    className="peer border border-[#EEEEEE] rounded-[10px] px-4 py-4  placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </Form.Item>
              </div>
            </div>
            <Form.Item className="m-0 p-0 self-end mt-6">
              <Button
                style={{ border: "1px solid #EEEEEE" }}
                className="font-semibold ml-4 px-9 py-6 rounded-[35px] hover:!text-[#555555] text-[#555555]"
              >
                Discard Changes
              </Button>
              <Button
                loading={loading}
                htmlType="submit"
                className="bg-[#AEC4FF] font-semibold hover:!bg-[#9ab5ff] hover:!text-[#001243] hover:!border-none transition ease-in ml-4 px-9 py-6 rounded-[35px] text-[#001243]"
              >
                Save Changes
              </Button>
            </Form.Item>
          </div>
        );
      case "Password":
        return (
          <div className="flex flex-col">
            <p className="Livvic-SemiBold text-primary text-lg mb-6">
              Change Password
            </p>
            <Form.Item
              name="currentPassword"
              rules={[
                {
                  required: true,
                  message: "",
                },
              ]}
            >
              <Input.Password
                className="peer border border-[#EEEEEE] rounded-[10px] px-4 py-4  placeholder-transparent focus:outline-none "
                placeholder="Current password"
              />
            </Form.Item>
            <Form.Item
              name="newPassword"
              rules={[
                {
                  required: true,
                  message: "",
                },
              ]}
            >
              <Input.Password
                className="peer border border-[#EEEEEE] rounded-[10px] px-4 py-4  placeholder-transparent focus:outline-none"
                placeholder="New password"
              />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              dependencies={["newPassword"]}
              hasFeedback
              rules={[
                {
                  required: true,
                  message: "",
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(""));
                  },
                }),
              ]}
            >
              <Input.Password
                className="peer border border-[#EEEEEE] rounded-[10px] px-4 py-4  placeholder-transparent focus:outline-none"
                placeholder="Confirm password"
              />
            </Form.Item>
            <Form.Item className="m-0 p-0 self-end mt-6">
              <Button
                style={{ border: "1px solid #EEEEEE" }}
                className="font-semibold ml-4 px-9 py-6 rounded-[35px] hover:!text-[#555555] text-[#555555]"
              >
                Discard Changes
              </Button>
              <Button
                loading={loading}
                htmlType="submit"
                className="bg-[#AEC4FF] font-semibold hover:!bg-[#9ab5ff] hover:!text-[#001243] hover:!border-none transition ease-in ml-4 px-9 py-6 rounded-[35px] text-[#001243]"
              >
                Save Changes
              </Button>
            </Form.Item>
          </div>
        );

      case "National ID":
        return (
          <>
            <div className="flex flex-wrap justify-between gap-y-4 mt-4">
              {/* Front Side */}
              <div className="border-gray-300 p-4 border rounded-lg w-full sm:w-[49%] ">
                <h3 className="mb-4 font-medium text-gray-800 text-lg">
                  Upload National ID (Front)
                </h3>
                {frontImage ? (
                  <div className="text-center">
                    <img
                      src={frontImage}
                      alt="Front National ID"
                      className="mx-auto mb-4 rounded-lg w-full max-w-xs h-36 object-fit"
                    />
                    <button
                      onClick={() => handleRemoveImage("front")}
                      className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white transition"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center border-2 border-gray-300 p-4 border-dashed rounded-xl w-full h-36"
                    {...getFrontRootProps()}
                  >
                    <p className="mb-2 font-bold text-sm">Upload Front Side</p>
                    <input {...getFrontInputProps()} />
                    <button
                      type="button"
                      className="flex items-center gap-2 bg-[#FCFCFC] px-4 py-2 border rounded-md font-bold"
                      style={{
                        boxShadow: "0px 12px 13px -6px #0000000A",
                      }}
                    >
                      <Upload
                        width={16}
                        height={16}
                        className="mx-auto object-fit-contain"
                      />
                      Click or drop image
                    </button>
                  </div>
                )}
              </div>

              {/* Back Side */}
              <div className="border-gray-300 p-4 border rounded-lg w-full sm:w-[49%]">
                <h3 className="mb-4 font-medium text-gray-800 text-lg">
                  Upload National ID (Back)
                </h3>
                {backImage ? (
                  <div className="text-center">
                    <img
                      src={backImage}
                      alt="Back National ID"
                      className="mx-auto mb-4 rounded-lg w-full h-36"
                    />
                    <button
                      onClick={() => handleRemoveImage("back")}
                      className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white transition"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center border-2 border-gray-300 p-4 border-dashed rounded-xl w-full h-36"
                    {...getBackRootProps()}
                  >
                    <p className="mb-2 font-bold text-sm">Upload Back Side</p>
                    <input {...getBackInputProps()} />
                    <button
                      type="button"
                      className="flex items-center gap-2 bg-[#FCFCFC] px-4 py-2 border rounded-md font-bold"
                      style={{
                        boxShadow: "0px 12px 13px -6px #0000000A",
                      }}
                    >
                      <Upload
                        width={16}
                        height={16}
                        className="mx-auto object-fit-contain"
                      />
                      Click or drop image
                    </button>
                  </div>
                )}
              </div>
            </div>
            <Form.Item>
              <div className="flex gap-2 justify-end mt-6">
                <CustomButton
                  btnText={"Cancel"}
                  action={handleCancel}
                  className="border border-[#EEEEEE] text-[#555555]"
                />
                <CustomButton
                  btnText={"Verify"}
                  htmlType="submit"
                  isLoading={loading}
                  loadingBtnText="Processing..."
                  className="bg-[#AEC4FF]"
                />
              </div>
            </Form.Item>
          </>
        );

      case "Delete Account":
        return (
          <div className="flex justify-center">
            <div className="space-y-4 flex flex-col items-center w-1/2">
              <img src="/trash-03.svg" alt="delete" />

              <h1 className="text-primary Livvic-SemiBold text-lg">
                Are you sure you want to delete your account?
              </h1>

              <p className="text-[#555555] text-center">
                This action is permanent and cannot be undone. All your data,
                settings, and saved information will be permanently removed.
                <br />
                <br /> If you're sure, type DELETE below and click Confirm.
              </p>
              <input
                type="text"
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                className="w-full rounded-[10px] border border-[#EEEEEE] text-primary focus:outline-none focus:ring-2 focus:ring-[#FF8484] focus:border-[#FF8484]"
                placeholder="Type DELETE"
              />
              <div className="flex gap-2">
                <CustomButton
                  btnText={"Cancel"}
                  action={handleCancel}
                  className="border border-[#EEEEEE] text-[#555555]"
                />
                <CustomButton
                  btnText={"Confirm Delete"}
                  htmlType="submit"
                  isLoading={isDeleting}
                  loadingBtnText="Deleting..."
                  action={() => deleteAccount()}
                  className="bg-[#FF8484] text-white"
                />
              </div>
            </div>
          </div>
        );
      case "Email Notifications":
        return (
          <>
            <div className="w-full max-w-md px-4">
              {user?.verified?.emailVer ? (
                // Email already verified - show simple verification status
                <div className="flex items-center mb-8 py-6">
                  <div className="flex items-center gap-3 text-green-600">
                    <img src="/check-circle.svg" alt="" />
                    <span className="text-lg">{user.email}</span>
                  </div>
                </div>
              ) : (
                // Email not verified - show OTP flow
                <>
                  <p className="mt-4 mb-6 font-semibold text-lg md:text-xl text-center Quicksand">
                    {step == 0 && "Verify Email"}
                    {step != 0 && "Write OTP"}
                  </p>

                  {step == 0 && (
                    <div className="w-full mb-6">
                      <Form.Item
                        style={{ margin: 0, padding: 0 }}
                        name="emailOtp"
                        rules={[
                          {
                            required: true,
                            message: "",
                          },
                        ]}
                        initialValues={user?.email}
                      >
                        <Input
                          type="email"
                          style={{ borderColor: "#D6DDEB" }}
                          readOnly
                          className="border-2 w-full py-3 px-4 rounded-3xl text-base"
                          defaultValue={user?.email}
                        />
                      </Form.Item>
                    </div>
                  )}

                  {step == 1 && (
                    <div className="w-full mb-6">
                      <Form.Item
                        style={{ margin: "0 0 20px 0", padding: 0 }}
                        name="oneTimePass"
                        rules={[{ required: true, message: "" }]}
                        className="flex justify-center"
                      >
                        <InputOTP length={4} width={1} inputType="numeric" />
                      </Form.Item>

                      <div className="flex justify-center items-center">
                        {isResendEnabled ? (
                          <Button
                            loading={loading}
                            onClick={handleResend}
                            type="primary"
                            className="bg-[#AEC4FF] px-6 rounded-3xl text-white "
                          >
                            Resend OTP
                          </Button>
                        ) : (
                          <p className="text-gray-600 text-center">
                            Resend OTP in {formatTime(timeLeft)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <Form.Item className="m-0 p-0 mb-8">
                    <Button
                      type="primary"
                      htmlType={step === 1 ? "submit" : undefined}
                      loading={loading}
                      className="bg-[#AEC4FF] w-52 py-3 rounded-3xl text-white font-medium text-base"
                      onClick={step === 0 ? billingMethod : undefined}
                    >
                      {step === 1 ? "Verified" : "Request for OTP"}
                    </Button>
                  </Form.Item>
                </>
              )}
            </div>

            {/* Switch Options Section - Matching Layout */}
            <div className="w-full max-w-md px-4">
              {options.map((option) => (
                <Form.Item key={option.value} className="mb-0">
                  <div className="flex justify-between items-center h-12 w-full pb-4 border-b border-b-[#EEEEEE]">
                    <span className="text-primary Livvic-SemiBold text-base md:text-lg">
                      {option.label}
                    </span>
                    <Switch
                      checked={switchStates[option.value]}
                      loading={loading}
                      onChange={(checked) =>
                        handleToggle(option.value, checked)
                      }
                      style={{
                        backgroundColor: switchStates[option.value]
                          ? "#22c55e"
                          : undefined,
                      }}
                    />
                  </div>
                </Form.Item>
              ))}
            </div>
          </>
        );

      case "SMS Notifications":
        return (
          <>
            <PhoneVerification />
            <Form.Item>
              <div className="flex justify-between items-center h-12 w-[90%] md:w-1/2 ml-6 pb-4">
                <span className="text-primary Livvic-SemiBold text-lg">
                  Text Notification Service
                </span>
                <Switch
                  checked={smsNoti}
                  loading={loading}
                  onChange={async (checked) => {
                    setLoading(true);
                    try {
                      if (!user?.verified?.phoneVer) {
                        throw new Error("Please verify your phone number.");
                      }
                      await dispatch(
                        updateTextNotifThunk({ sms: checked }) // 📤 see thunk below
                      ).unwrap();
                      setSMSNoti(checked);
                      fireToastMessage({
                        type: "success",
                        message: "Saved successfully",
                      });
                    } catch (err) {
                      fireToastMessage({
                        type: "error",
                        message: err.message || "Save failed",
                      });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  style={{
                    backgroundColor: smsNoti ? "#22c55e" : undefined,
                  }}
                />
              </div>
            </Form.Item>

            {/* ))} */}
          </>
        );

      default:
        break;
    }
  };

  return (
    <>
      <Form onFinish={onFinish} autoComplete="off" form={form}>
        {renderContent()}
      </Form>
      {/* {withDraw ? (
        <div
          style={{ color: "#FFFFFF", border: "1px solid #38AEE3" }}
          className={`flex justify-center items-center bg-[#38AEE3] hover:opacity-70 rounded-3xl ${
            payNow ? "w-32 h-8" : "w-48 h-10"
          }  text-center duration-300 cursor-pointer ..`}
          onClick={showModal}
        >
          <p className={payNow ? " " : "text-xl"}>Add a Method</p>
        </div>
      ) : (
        <div
          style={{ background: "#F7F9FA" }}
          className="flex justify-between px-4 py-4 rounded-2xl w-80 cursor-pointer"
          onClick={showModal}
        >
          <p className="text-xl">{head}</p>
          <RightOutlined />
        </div>
      )} */}

      {/* <Modal
        className="overflow-auto"
        width={800}
        open={isModalOpen}
        footer={null}
        closeIcon={false}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        {head == "SMS" && (
          <p className="font-bold text-2xl">{head} Notification</p>
        )}
        {head == "Payments" && (
          <p className="font-bold text-2xl">Billing & {head}</p>
        )}
        {head != "SMS" &&
          head != "Payments" &&
          head != "Email Verification" && (
            <p className="font-bold text-2xl">{head}</p>
          )}
        {head == "Email Verification" && (
          <p className="font-bold text-2xl">{head}</p>
        )}

        <Form onFinish={onFinish} autoComplete="off" form={form}>
          {head == "Email" && (
            <p className="mt-4 mb-6 font-semibold text-4xl text-center Quicksand">
              Update Email Address
            </p>
          )}
          {head == "Password" && (
            <p className="mt-4 mb-6 font-semibold text-4xl text-center Quicksand">
              Update Password
            </p>
          )}
          {head == "Phone Number" && (
            <p className="mt-4 mb-6 font-semibold text-4xl text-center Quicksand">
              Update Phone Number
            </p>
          )}
          {head == "Delete Account" && (
            <p className="mt-4 mb-6 font-semibold text-4xl text-center Quicksand">
              You are going to delete your account
            </p>
          )}
          {head == "Email Notification" && (
            <div>
              <p className="mt-4 mb-1 font-semibold text-4xl text-center Quicksand">
                Email Preferences
              </p>
              <p className="mb-2 font-semibold text-center Quicksand">
                Select the emails you want to receive
              </p>
            </div>
          )}
          {head == "SMS" && (
            <div>
              <p className="mt-4 mb-1 font-semibold text-4xl text-center Quicksand">
                Text Notification Service
              </p>
              <p className="font-medium text-center Quicksand">
                This service is currently{" "}
                <span className="font-semibold">
                  {enable ? "enabled." : "disabled."}
                </span>{" "}
              </p>
              <p className="mb-2 font-medium text-center leading-5 Quicksand">
                You'll get notifications when someone sends you a message.
              </p>
              <div className="flex justify-center">
                <p className="width-modal-input text-center leading-5">
                  By opting in, you understand that message frequency will vary
                  and message and data rates may apply. Reply “HELP” for help or
                  “STOP” to cancel. See{" "}
                  <span className="font-semibold underline">
                    Mobile Terms of Service
                  </span>{" "}
                  &{" "}
                  <span className="font-semibold underline">
                    Privacy Policy
                  </span>{" "}
                  for more details.
                </p>
              </div>
            </div>
          )}
         

      {/* {head == "Email Verification" && (
            <div>
              <p className="mt-4 mb-1 font-semibold text-4xl text-center Quicksand">
                {step == 0 && "Request for OTP"}
                {step != 0 && "Write OTP"}
              </p>
              {step == 0 && (
                <div className="flex justify-center">
                  <Form.Item
                    style={{ margin: 0, padding: 0 }}
                    name="emailOtp"
                    rules={[
                      {
                        required: true,
                        message: "",
                      },
                    ]}
                    initialValue={user?.email}
                  >
                    <Input
                      type="email"
                      style={{ borderColor: "#D6DDEB" }}
                      readOnly
                      className="border-2 mt-4 py-2 rounded-3xl"
                      defaultValue={user?.email}
                    />
                  </Form.Item>
                </div>
              )}

              {step == 1 && (
                <div>
                  <Form.Item
                    style={{ margin: "20px 0 0 0", padding: 0 }}
                    name="oneTimePass"
                    rules={[{ required: true, message: "" }]}
                    className="mb-4"
                  >
                    <InputOTP length={4} width={1} inputType="numeric" />
                  </Form.Item>

                  <div className="flex justify-center items-center mt-2">
                    {isResendEnabled ? (
                      <Button
                        loading={loading}
                        onClick={handleResend}
                        type="primary"
                      >
                        Resend OTP
                      </Button>
                    ) : (
                      <p className="text-gray-600">
                        Resend OTP in {formatTime(timeLeft)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {head == "National ID" && (
            <div className="flex flex-wrap justify-center gap-y-4 mt-4"> */}
      {/* Front Side */}
      {/* <div className="border-gray-300 p-4 border rounded-lg w-full sm:w-1/2 h">
                <h3 className="mb-4 font-medium text-gray-800 text-lg">
                  Upload National ID (Front)
                </h3>
                {frontImage ? (
                  <div className="text-center">
                    <img
                      src={frontImage}
                      alt="Front National ID"
                      className="mx-auto mb-4 rounded-lg w-full max-w-xs h-36 object-fit"
                    />
                    <button
                      onClick={() => handleRemoveImage("front")}
                      className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white transition"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center border-2 border-gray-300 p-4 border-dashed rounded-xl w-full h-36"
                    {...getFrontRootProps()}
                  >
                    <p className="mb-2 font-bold text-sm">Upload Front Side</p>
                    <input {...getFrontInputProps()} />
                    <button
                      type="button"
                      className="flex items-center gap-2 bg-[#FCFCFC] px-4 py-2 border rounded-md font-bold"
                      style={{
                        boxShadow: "0px 12px 13px -6px #0000000A",
                      }}
                    >
                      <Upload
                        width={16}
                        height={16}
                        className="mx-auto object-fit-contain"
                      />
                      Click or drop image
                    </button>
                  </div>
                )}
              </div> */}

      {/* Back Side */}
      {/* <div className="border-gray-300 p-4 border rounded-lg w-full sm:w-1/2">
                <h3 className="mb-4 font-medium text-gray-800 text-lg">
                  Upload National ID (Back)
                </h3>
                {backImage ? (
                  <div className="text-center">
                    <img
                      src={backImage}
                      alt="Back National ID"
                      className="mx-auto mb-4 rounded-lg w-full h-36"
                    />
                    <button
                      onClick={() => handleRemoveImage("back")}
                      className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white transition"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center border-2 border-gray-300 p-4 border-dashed rounded-xl w-full h-36"
                    {...getBackRootProps()}
                  >
                    <p className="mb-2 font-bold text-sm">Upload Back Side</p>
                    <input {...getBackInputProps()} />
                    <button
                      type="button"
                      className="flex items-center gap-2 bg-[#FCFCFC] px-4 py-2 border rounded-md font-bold"
                      style={{
                        boxShadow: "0px 12px 13px -6px #0000000A",
                      }}
                    >
                      <Upload
                        width={16}
                        height={16}
                        className="mx-auto object-fit-contain"
                      />
                      Click or drop image
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex justify-center">
            <div>
              {head == "Email" && (
                <div>
                  <div className="relative w-72">
                    <Form.Item
                      style={{ margin: 0, padding: 0 }}
                      name="currentEmail"
                      initialValue={user?.email}
                      rules={[
                        {
                          required: true,
                          message: "",
                        },
                      ]}
                    >
                      <Input
                        type="email"
                        defaultValue={user?.email}
                        className="peer border border-[#EEEEEE] rounded-[10px] px-4 pt-7 pb-2 w-full placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Your Email"
                      />
                    </Form.Item>
                    <label
                      htmlFor="currentEmail"
                      className="absolute left-4 top-2 text-sm text-gray-500 bg-white px-1 z-10"
                    >
                      Current Email
                    </label>
                  </div>

                  <div className="relative w-72">
                    <Form.Item
                      style={{ margin: 0, padding: 0 }}
                      name="newEmail"
                      rules={[
                        {
                          required: true,
                          message: "",
                        },
                      ]}
                    >
                      <Input
                        type="email"
                        className="peer border border-[#EEEEEE] rounded-[10px] px-4 pt-7 pb-2 w-full placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder={"thelumleyfamily123@gmail.com"}
                      />
                    </Form.Item>
                    <label
                      htmlFor="confirmEmail"
                      className="absolute left-4 top-2 text-sm text-gray-500 bg-white px-1 z-10"
                    >
                      Confirm Email
                    </label>
                  </div>
                </div>
              )}
              {head == "Password" && (
                <div>
                  <p className="mb-1 font-semibold text-lg capitalize"> */}
      {/* Current Password
                  </p>
                  <Form.Item
                    name="currentPassword"
                    rules={[
                      {
                        required: true,
                        message: "",
                      },
                    ]}
                  >
                    <Input.Password
                      className="border-2 py-2 rounded-3xl width-modal-input"
                      placeholder="Current password"
                    />
                  </Form.Item>
                  <p className="mb-1 font-semibold text-lg capitalize">
                    New Password
                  </p>
                  <Form.Item
                    name="newPassword"
                    rules={[
                      {
                        required: true,
                        message: "",
                      },
                    ]}
                  >
                    <Input.Password
                      className="border-2 py-2 rounded-3xl width-modal-input"
                      placeholder="New password"
                    />
                  </Form.Item>
                  <p className="mb-1 font-semibold text-lg capitalize">
                    Confirm Password
                  </p>
                  <Form.Item
                    name="confirmPassword"
                    dependencies={["newPassword"]}
                    hasFeedback
                    rules={[
                      {
                        required: true,
                        message: "",
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (
                            !value ||
                            getFieldValue("newPassword") === value
                          ) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error(""));
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      className="border-2 py-2 rounded-3xl width-modal-input"
                      placeholder="Confirm password"
                    />
                  </Form.Item>
                </div>
              )}
              {head == "Phone Number" && (
                <div>
                  {user?.phoneNo && (
                    <>
                      <p className="mb-1 font-semibold text-lg capitalize">
                        Current Phone Number
                      </p>
                      <Form.Item
                        name="currentPhoneNumber"
                        rules={[
                          {
                            required: true,
                            message: "",
                          },
                        ]}
                        initialValue={user?.phoneNo}
                      >
                        <Input
                          type="text"
                          className="border-2 py-2 rounded-3xl width-modal-input"
                          defaultValue={user?.phoneNo}
                          readOnly
                          placeholder={"0800-78601"}
                        />
                      </Form.Item>
                    </>
                  )}

                  <p className="mb-1 font-semibold text-lg capitalize">
                    {user?.phoneNo ? "Phone Number" : "New Phone Number"}
                  </p>
                  <Form.Item
                    name="phoneNo"
                    rules={[
                      {
                        required: true,
                        message: "",
                      },
                    ]}
                  >
                    <Input
                      type="text"
                      className="border-2 py-2 rounded-3xl width-modal-input"
                      placeholder="0800-78601"
                    />
                  </Form.Item>
                </div>
              )}
              {head == "Delete Account" && ( */}
      {/* <p className="font-semibold">
                  You won't be able to restore your data
                </p>
              )}
              {head === "Email Notification" && (
                <Form.Item
                  style={{ margin: 0, padding: 0 }}
                  name="emailNotification"
                  initialValue={trueKeys} // Set default values in form
                >
                  <Checkbox.Group
                    options={options.map((option) => ({
                      label: option.label, // Displayed label
                      value: option.value, // Actual value
                    }))}
                    defaultValue={trueKeys} // Default checked values for form submission
                    className="py-2 rounded-3xl width-modal-input"
                    style={{ borderColor: "#D6DDEB" }}
                  />
                </Form.Item>
              )}

              <div className="flex justify-center mt-6 mb-2">
                <Form.Item className="m-0 p-0">
                  {head != "Payments" && head != "Email Verification" && (
                    <Button
                      style={{ color: "#38AEE3", border: "1px solid #38AEE3" }}
                      className="bg-[#FFFFFF] rounded-3xl"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                  )}
                  {head == "Payments" && step != 0 && (
                    <Button
                      style={{ color: "#38AEE3", border: "1px solid #38AEE3" }}
                      className="bg-[#FFFFFF] rounded-3xl"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                  )}

                  {(head == "Email" ||
                    head == "Password" ||
                    head == "Phone Number" ||
                    head == "Email Notification") && (
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      className="bg-[#38AEE3] ml-2 px-6 rounded-3xl text-white"
                    >
                      Update
                    </Button>
                  )}
                  {head == "Delete Account" && (
                    <Button
                      onClick={deleteAccount}
                      className="bg-[#FF3333] ml-2 px-6 rounded-3xl text-white"
                    >
                      Delete
                    </Button>
                  )}
                  {head == "SMS" && enable ? (
                    <Button
                      onClick={deleteAccount}
                      className="bg-[#FF3333] ml-2 px-6 rounded-3xl text-white"
                    >
                      Disable
                    </Button>
                  ) : (
                    head == "SMS" && (
                      <Button
                        type="primary"
                        className="bg-[#38AEE3] ml-2 px-6 rounded-3xl text-white"
                      >
                        Enable
                      </Button>
                    )
                  )}
                  {head == "Payments" && (
                    <Button
                      type="primary"
                      htmlType={step == 2 && "submit"}
                      className="bg-[#38AEE3] ml-2 px-6 rounded-3xl text-white"
                      onClick={billingMethod}
                    >
                      {step == 2 ? "Save" : "Add Billing Method"}
                    </Button>
                  )}
                  {head === "Email Verification" && (
                    <Button
                      type="primary"
                      htmlType={step === 1 ? "submit" : undefined}
                      loading={loading}
                      className="bg-[#38AEE3] ml-2 px-6 rounded-3xl text-white"
                      onClick={step === 0 ? billingMethod : undefined} // Ensures onClick is only set when step is 0
                    >
                      {step === 1 ? "Verified" : "Request for OTP"}
                    </Button>
                  )}
                  {head == "National ID" && (
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      className="bg-[#38AEE3] ml-2 px-6 rounded-3xl text-white"
                    >
                      Verified
                    </Button>
                  )}
                </Form.Item>
              </div>
            </div>
          </div>
        </Form>
      </Modal> */}
    </>
  );
};
export default App;
