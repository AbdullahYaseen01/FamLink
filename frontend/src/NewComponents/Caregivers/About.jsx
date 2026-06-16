import React from "react";
import Button from "../Button";
import { NavLink } from "react-router-dom";

function About() {
    return (
        <div className="container Livvic px-4 sm:px-6 lg:px-8 min-h-[550px] mx-auto max-w-7xl">
            <div className="flex flex-col lg:flex-row justify-between gap-8 lg:gap-12 py-8 lg:py-12">
                <div className="space-y-4 lg:space-y-6 max-w-2xl w-full lg:w-1/2">
                    <h1 className="Livvic-Bold text-2xl sm:text-3xl lg:text-4xl xl:text-5xl leading-tight">
                        What Is a Nanny Share Arrangement?
                    </h1>
                    <p className="text-base sm:text-lg lg:text-xl text-[#00000099] Livvic-Medium mt-4 sm:mt-6 leading-relaxed">
                        A nanny share is when one nanny cares for children from two different families in one
                        shared arrangement. Caregivers can earn more while working with compatible families
                        on a consistent schedule.
                        <br />
                        <br />
                        <span className="lg:text-xl Livvic-SemiBold text-xl sm:text-2xl text-[#1a2e1a] mb-1 leading-relaxed">
                            Choose Your Path
                            <ul className="space-y-3 mt-3">
                                <li className="text-base sm:text-lg lg:text-xl text-[#00000099] Livvic-Medium leading-relaxed">
                                    ● Already work with a family? Add a second family to your current setup and turn
                                    your role into a nanny share.
                                </li>
                                <li className="text-base sm:text-lg lg:text-xl text-[#00000099] Livvic-Medium leading-relaxed">
                                    ● Looking for a nanny share job? Connect with families searching for nanny share
                                    caregivers nearby.
                                </li>
                            </ul>
                        </span>
                    </p>
                    <div className="pt-2 lg:pt-4">
                        <NavLink to="/caregiver/nannyshare" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                            <Button
                                btnText={"Get Started"}
                                className="bg-[#AEC4FF] text-primary w-full sm:w-auto text-lg Livvic-SemiBold"
                            />
                        </NavLink>
                    </div>
                </div>

                <div className="w-full lg:w-1/2 flex items-center justify-center">
                    <img
                        src="Hero-Caregivers.png"
                        alt="nanny"
                        className="w-full max-w-sm lg:max-w-md h-auto object-cover rounded-2xl"
                    />
                </div>
            </div>
        </div>
    );
}

export default About;