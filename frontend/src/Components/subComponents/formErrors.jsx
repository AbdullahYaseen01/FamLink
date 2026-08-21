import { Form } from "antd";

export const SCROLL_TO_FIRST_ERROR = {
  behavior: "smooth",
  block: "center",
};

export function handleFinishFailed() {
  const scroll = () => {
    const item = document.querySelector(".edit-profile-form .ant-form-item-has-error");
    if (!item) return;
    item.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  requestAnimationFrame(scroll);
  window.setTimeout(scroll, 80);
}

/*
 * Child of Form.Item. Drops antd's injected value/onChange so they never land
 * on a DOM node, and exposes whether this item is in the error state so photo,
 * schedule and pill controls can redden the same way Inputs do.
 */
export function FormErrorAnchor({ children, className = "", value: _value, onChange: _onChange, ...rest }) {
  const { status } = Form.Item.useStatus();
  const invalid = status === "error";

  return (
    <div className={`scroll-mt-28 ${invalid ? "edit-profile-field-error" : ""} ${className}`} {...rest}>
      {typeof children === "function" ? children(invalid) : children}
    </div>
  );
}
