import React, { useState, useEffect, useRef } from "react";
import Header from "./Header";
import { Spin, Input } from "antd";
import { fireToastMessage } from "../../../toastContainer";
import Button from "../../Button";
import { useNavigate } from "react-router-dom";

function HeroOakland({ city }) {
    const [zipCode, setZipCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isGlowing, setIsGlowing] = useState(false);
    const buttonRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsGlowing(true);
                    setTimeout(() => setIsGlowing(false), 1000);
                }
            },
            { threshold: 0.5 }
        );

        if (buttonRef.current) observer.observe(buttonRef.current);
        return () => observer.disconnect();
    }, []);

    const handleDataRetrieve = async () => {
        const zipCodeRegex = /^\d{5}(-\d{4})?$/;

        if (!zipCode || !zipCodeRegex.test(zipCode)) {
            fireToastMessage({
                type: "error",
                message: "Please enter a valid US ZIP code (e.g., 90210)",
            });
            return;
        }

        setIsLoading(true);

        try {
            const proxyUrl = `https://api.zippopotam.us/us/${zipCode.split("-")[0]}`;
            const res = await fetch(proxyUrl);
            if (!res.ok) throw new Error();

            const wrappedData = await res.json();

            if (!wrappedData) throw new Error("Invalid ZIP code");

            if (wrappedData && Object.keys(wrappedData).length > 0) {
                navigate(`/find-nanny-share?zipCode=${encodeURIComponent(zipCode)}`);
            } else {
                throw new Error("ZIP not found");
            }
        } catch (err) {
            fireToastMessage({
                type: "error",
                message:
                    err.message ||
                    "We couldn't verify that ZIP code. Please check and try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="Livvic container mx-auto min-h-screen px-4 sm:px-6 lg:px-8 xl:px-12">
            {/* Keyframes */}
            <style>{`
        @keyframes buttonGlow {
          0%   { box-shadow: 0 0 0px rgba(255, 173, 225, 0); }
          40%  { box-shadow: 0 0 18px 6px rgba(255, 173, 225, 0.9); }
          100% { box-shadow: 0 0 0px rgba(255, 173, 225, 0); }
        }
        .glow-once {
          animation: buttonGlow 1s ease-out forwards;
        }
      `}</style>

            <Header />

            {/* Two-column layout on lg+, stacked on smaller screens */}
            <div className="mt-16 sm:mt-24 lg:mt-32 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 lg:gap-8 pb-16">

                {/* Left: Text + CTA */}
                <div className="flex-1">
                    <h1 className="Livvic-Bold text-white text-4xl sm:text-5xl md:text-6xl xl:text-6xl leading-tight">
                        {city} families,
                        <br />
                        nanny share just got easier
                    </h1>

                    <h2 className="Livvic-Medium text-white text-base sm:text-lg md:text-xl mt-4 sm:mt-6 max-w-lg">
                        Finding the right nanny share family starts with finding families nearby.<br /><br />FamLink helps families connect with compatible nanny share matches across the East Bay.
                    </h2>

                    <div className="mt-6 sm:mt-8">
                        <div
                            ref={buttonRef}
                            className={`inline-block ${isGlowing ? "glow-once rounded-full" : ""}`}
                        >
                            <Button
                                btnText={
                                    isLoading ? <Spin size="small" /> : "Get Started"
                                }
                                className="bg-[#AEC4FF] w-full sm:w-auto px-8 py-3 sm:py-4 text-sm sm:text-base flex items-center justify-center rounded-full"
                                action={() => navigate(`/find-nanny-share`)}
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </div>

                {/* Right: Image */}
                {/* <div className="flex-1 flex justify-center lg:justify-end max-w-full lg:max-w-[45%]">
          <img
            src="/SearchNannyShare.png"
            alt="nanny"
            className="w-full sm:max-w-sm md:max-w-md lg:max-w-full h-auto object-contain"
          />
        </div> */}

            </div>
        </div>
    );
}

export default HeroOakland;