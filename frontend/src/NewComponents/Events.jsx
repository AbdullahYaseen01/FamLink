import React from "react";
import CustomButton from "./Button";
import { NavLink } from "react-router-dom";

function Events() {
  return (
    <div
      className="h-screen w-full flex justify-center items-center 
    bg-[#F6F3EE] relative overflow-hidden"
    >
      {/* Dark overlay */}
      {/* <div className="absolute inset-0 bg-black bg-opacity-50"></div> */}

      {/* Logo link pinned top-left */}
      <NavLink
        to={"/"}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="absolute top-4 left-4 flex gap-1 items-center z-10"
      >
        <img src="/logo3.png" alt="logo" className="w-6 h-6 sm:w-8 sm:h-8" />
        <p className="font-bold text-lg sm:text-xl Livvic-Bold">
          Famlink
        </p>
      </NavLink>

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-soft p-8 w-[90%] max-w-md text-center z-10">
        <h1 className="text-3xl Livvic-SemiBold text-gray-900 mb-4">
          Register for Event
        </h1>
        <p className="text-gray-600 mb-6">
          Join us for an unforgettable experience! Secure your spot now and be
          part of something special.
        </p>
        <a href="https://form.typeform.com/to/AoOX72nv">
          <CustomButton
            btnText={"Register"}
            className="bg-[#ffb300] w-full sm:w-auto px-6 py-3 sm:py-4"
          />
        </a>
      </div>
    </div>
  );
}

export default Events;
