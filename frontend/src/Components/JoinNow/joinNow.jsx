import { Radio } from "antd";
import hire from "../../assets/images/hire.png";
import job from "../../assets/images/job.png";
import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { CloseOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { resetForm } from "../Redux/formValue";
import Button from "../../NewComponents/Button";

export default function JoinNow() {
  const navigate = useNavigate();
  const [value, setValue] = useState(1);
  const dispatch = useDispatch();
  const onRadioChange = (radioValue) => {
    setValue(radioValue); // Set radio value when changed
  };

  const handleGoBack = () => {
    navigate("/"); // Navigate back in history
  };

  const handleCreateAccount = () => {
    dispatch(resetForm());
    if (value === 1) {
      navigate("/hire"); // Navigate to the hire component if selected
    } else if (value == 2) {
      navigate("/job"); // Navigate to the job component if selected
    } else {
      navigate("/communitySign");
    }
  };
  return (
    // <div className="padd-res">
    //   <div
    //     className="px-4 py-4 rounded-3xl"
    //     style={
    //       value === 1
    //         ? {
    //             background:
    //               "linear-gradient(174.22deg, rgba(158, 220, 225, 0.5) 0%, rgba(218, 244, 239, 0.4) 69.71%, rgba(239, 236, 230, 0.3) 100%)",
    //           }
    //         : value === 2
    //         ? {
    //             background: "linear-gradient(to bottom, #FFEE8C, #fdf8ea)",
    //           }
    //         : value === 3
    //         ? {
    //             background:
    //               "linear-gradient(174.22deg, rgba(183, 214, 255, 0.5) 0%, rgba(229, 241, 255, 0.4) 69.71%, rgba(248, 249, 255, 0.3) 100%)",
    //           }
    //         : {}
    //     }
    //   >
    //     <div className="flex justify-end">
    //       <button onClick={handleGoBack}>
    //         <CloseOutlined style={{ fontSize: "24px" }} />
    //       </button>
    //     </div>
    //     <div className="step-content text-center">
    //       <div className="flex justify-center w-full">
    //         <p className="px-3 width-form font-normal uppercase Livvic offer-font">
    //           Tell us what {`you're`} looking for
    //         </p>
    //       </div>

    //       <div className="flex flex-wrap justify-center gap-12 my-10">
    //         <div
    //           className="bg-white px-4 py-4 rounded-3xl w-60"
    //           onClick={() => onRadioChange(1)}
    //         >
    //           <div className="flex justify-between">
    //             <div className="flex items-center gap-2">
    //               <img src={hire} alt="hire" />
    //               <p className="text-xl font-bold Livvic">Parents</p>
    //             </div>

    //             <Radio checked={value === 1}></Radio>
    //           </div>
    //           <div className="mt-4">
    //             <p className="mt-2 text-black text-start leading-tight">
    //               I am looking to hire / find nanny share
    //             </p>
    //           </div>
    //         </div>

    //         <div
    //           className="bg-white px-4 py-4 rounded-3xl w-60"
    //           onClick={() => onRadioChange(2)}
    //         >
    //           <div className="flex justify-between">
    //             <div className="flex items-center gap-2">
    //               <img src={job} alt="job" />
    //               <p className="text-xl font-bold Livvic">Caregivers</p>
    //             </div>

    //             <Radio checked={value === 2}></Radio>
    //           </div>
    //           <div className="mt-4">
    //             <p className="mt-2 text-black text-start">
    //               I am looking to find a job.
    //             </p>
    //           </div>
    //         </div>
    //       </div>
    //     </div>
    //     <div className="text-center">
    //       <button
    //         style={{ background: "#85D1F1" }}
    //         className="mx-auto my-0 px-6 py-2 rounded-full font-normal text-base transition hover:-translate-y-1 duration-700 delay-150 ease-in-out hover:scale-110"
    //         onClick={handleCreateAccount}
    //       >
    //         Create Account
    //       </button>
    //       <p className="mt-2 mb-10 font-normal text-base already-acc">
    //         Already have an account?{" "}
    //         <NavLink
    //           to="/login"
    //           onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    //         >
    //           <span className="hover:text-blue-600 underline transition-colors duration-300 cursor-pointer">
    //             Log in
    //           </span>
    //         </NavLink>
    //       </p>
    //     </div>
    //   </div>
    // </div>
    <div className="p-6">
      <div>
        <h1 className="onboarding-head text-center">
          Tell us what you are looking for
        </h1>
        <div className="mt-12 flex justify-center flex-wrap gap-6">
          <div
            className="onboarding-box max-w-xs"
            style={{
              border: value === 1 && "2px solid #AEC4FF",
            }}
            onClick={() => onRadioChange(1)}
          >
            <Radio checked={value === 1}></Radio>
            <h2 className="onboarding-subHead mt-4">
              I'm a Parent/Family<br/> looking for care
              {/* <br /> a caregiver */}
            </h2>
            <div className="mt-2 flex gap-4">
              <p className="onboarding-para">
                Find a caregiver in your area.
              </p>
              <img src="/looking-for-caregiver.svg" alt="parent" />
            </div>
          </div>
          <div
            className="onboarding-box max-w-xs"
            style={{
              border: value === 2 && "2px solid #AEC4FF",
            }}
            onClick={() => onRadioChange(2)}
          >
            <Radio checked={value === 2}></Radio>
            <h2 className="onboarding-subHead mt-4">I'm a Caregiver<br/> looking for a job</h2>
            <div className="mt-2 flex gap-4">
              <p className="onboarding-para">
                Create a profile and apply for jobs.
              </p>
              <img src="/looking-for-caregiver-job.svg" alt="caregiver" />
            </div>
          </div>
        </div>
        <div className="mt-12 text-center">
          <p className="onboarding-foot">
            Already have a account?{" "}
            <NavLink
              to="/login"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <span className="onboarding-foot-action">Log In</span>
            </NavLink>
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8 sm:mt-24 justify-center">
        <Button
          btnText={"Back"}
          className=" w-full sm:w-auto border-2 border-[#EEEEEE] px-20"
          action={handleGoBack}
        />
        <Button
          btnText={"Continue"}
          className="bg-[#AEC4FF] w-full sm:w-auto px-16"
          action={handleCreateAccount}
        />
      </div>
    </div>
  );
}
