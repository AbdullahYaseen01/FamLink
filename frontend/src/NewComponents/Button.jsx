import React from "react";
import clsx from "classnames";
import { Loader2 } from "lucide-react";

function CustomButton({
  btnText,
  btnBgColor = "",
  className = "",
  action = () => {},
  isLoading = false,
  loadingBtnText = "",
  htmlType = "",
  ...props
}) {
  return (
    <button
      disabled={isLoading || props.disabled}
      type={htmlType?.length > 0 ? htmlType : "button"}
      className={clsx(
        "rounded-full px-6 py-2 Livvic-SemiBold transition-opacity duration-200",
        (isLoading || props.disabled) ? "opacity-50 cursor-not-allowed" : "",
        btnBgColor,
        className
      )}
      onClick={(e) => {
        if (!isLoading && !props.disabled && action) {
          action(e);
        }
      }}
      {...props}
    >
      {isLoading ? (
        <div className="flex gap-2 items-center Livvic-SemiBold justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> {loadingBtnText}
        </div>
      ) : (
        btnText
      )}
    </button>
  );
}

export default CustomButton;
