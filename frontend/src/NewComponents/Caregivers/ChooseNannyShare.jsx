import React from 'react'
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { resetForm } from '../../Components/Redux/formValue';
import Button from '../Button';

const ChooseNannyShare = () => {
    const navigate = useNavigate();

    const handleGoBack = () => navigate("/");

    return (
        <div>
            <h1 className="onboarding-head text-center">
                Choose your path
            </h1>
            <div className="mt-12 p-4 flex justify-center flex-wrap gap-6">

                {/* Card 1 */}
                <div
                    className="onboarding-box w-full sm:w-80 md:w-96 cursor-pointer flex flex-col gap-4"
                >
                    <h2 className="onboarding-subHead">
                        I already work with a family
                    </h2>
                    <p className="onboarding-para flex-1">
                        Open up your schedule to a second family and turn your current
                        role into a nanny share — earn more while staying with the
                        family you love.
                    </p>
                    <Button
                        btnText={"I want to add a family to my current job →"}
                        className="bg-[#AEC4FF] w-full text-sm px-4 py-2.5"
                    // action={(e) => { e.stopPropagation(); handleCreateAccount(1); }}
                    />
                </div>

                {/* Card 2 */}
                <div
                    className="onboarding-box w-full sm:w-80 md:w-96 cursor-pointer flex flex-col gap-4"
                >
                    <h2 className="onboarding-subHead">
                        I'm looking for a nanny share position
                    </h2>
                    <p className="onboarding-para flex-1">
                        Prefer nanny share roles? Enjoy better pay, a social environment
                        for kids, and a more structured setup. Create your profile and
                        get matched with two compatible families.
                    </p>
                    <Button
                        btnText={"I'm looking for a nanny share position →"}
                        className="bg-[#AEC4FF] w-full text-sm px-4 py-2.5"
                    // action={(e) => { e.stopPropagation(); handleCreateAccount(2); }}
                    />
                </div>

            </div>
            <div className="fixed bottom-4 left-0 right-0 flex justify-center px-4">
                <Button
                    btnText={"Back"}
                    className="w-full sm:w-auto border-2 border-[#EEEEEE] px-20"
                    action={handleGoBack}
                />
            </div>
        </div>
    );
};

export default ChooseNannyShare;