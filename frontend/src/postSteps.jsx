import { useState, forwardRef, useImperativeHandle } from "react";

// eslint-disable-next-line react/display-name, react/prop-types
const CustomStepper = forwardRef(
  // eslint-disable-next-line react/prop-types
  ({ stepCount, currentStep = 5, onChange }, ref) => {
    const [current, setCurrent] = useState(currentStep);

    const updateStep = (step) => {
      setCurrent(step);
      if (onChange) onChange(step);
    };

    const next = () => {
      if (current < stepCount - 1) updateStep(current + 1);
    };

    const prev = () => {
      if (current > 0) updateStep(current - 1);
    };

    const goTo = (step) => {
      if (step >= 0 && step < stepCount) updateStep(step);
    };
    
    useImperativeHandle(ref, () => ({
      next,
      prev,
      goTo,
    }));

    return (
      <div className="w-full flex justify-center items-center">
        <div className="relative flex items-center justify-between w-full">
          <div className="absolute lg:h-2 h-1 bg-[#eaeaea] w-full"></div>
          <div
            className="absolute lg:h-2 h-1 bg-[#AEC4FF] transition-all duration-300"
            style={{ width: `${(current / (stepCount - 1)) * 100}%` }}
          ></div>
          {Array.from({ length: stepCount }, (_, index) => (
            <div
              key={index}
              className="relative z-10 flex flex-col items-center"
            >
              <div
                className={`lg:size-5 size-3 rounded-full flex items-center justify-center bg-white border-2 border-t-[#9edce1] border-b-[#D6DDEB]`}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }
);

export default CustomStepper;
