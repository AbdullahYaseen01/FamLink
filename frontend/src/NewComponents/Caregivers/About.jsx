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
                        A nanny share is when one nanny cares for children from two different
                        families at the same time — typically in one home.<br/><br/>
                        Instead of working for one family, you earn more by working with two —
                        while both families split the cost. It’s a structured, rewarding setup that
                        benefits everyone — caregivers, parents, and kids.
                    </p>
                    <div className="pt-2 lg:pt-4">
                        <NavLink to="/caregiver/nannyshare" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                            <Button
                                btnText={"Find or expand a nanny share →"}
                                className="bg-[#AEC4FF] text-primary w-full sm:w-auto text-lg Livvic-SemiBold"
                            />
                        </NavLink>
                    </div>
                </div>

                <div className="w-full lg:w-1/2">
                    <img
                        src="NannyShareAboutSection.png"
                        alt="nanny"
                        className="w-full h-auto object-cover rounded-2xl"
                    />
                </div>
            </div>
        </div>
    );
}

export default About;