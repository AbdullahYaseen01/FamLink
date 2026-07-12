import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import App from "../subComponents/modal";
import {
  CreditCardIcon,
  IdCardIcon,
  KeyRoundIcon,
  Mail,
  MessageCircleQuestionIcon,
  MessageSquareMoreIcon,
  Trash2Icon,
  MenuIcon,
  XIcon,
} from "lucide-react";
import BillingMethod from "../subComponents/Billings";
import SubscriptionSettings from "../../NewComponents/SubscriptionSettings";
import { useSearchParams } from "react-router-dom";

export default function SettingNanny() {
  const [searchParams] = useSearchParams();
  const option = searchParams.get("option");
  const { user } = useSelector((s) => s.auth);
  const [selectedOption, setSelectedOption] = useState("Change Email");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState({
    emailBookingConfirmations: true,
    emailJobAlerts: true,
    emailPromotions: false,
    smsBookingConfirmations: true,
    smsJobAlerts: false,
    smsPromotions: false,
  });

  useEffect(() => {
  if (option) {
    setSelectedOption(option);
  }
}, [option]);


  const menuOptions = [
    "Change Email",
    "Change Password",
    // "Billing",
    // "National ID",
    "Subscription",
    "Delete Account",
    "Email Notifications",
    "SMS Notifications",
  ];

  const handleToggle = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const renderContent = () => {
    switch (selectedOption) {
      case "Change Email":
        return (
          <div className="space-y-4">
            <App head="Email" />
          </div>
        );

      case "Change Password":
        return (
          <div className="space-y-4">
            <App head="Password" />
          </div>
        );

      // case "Billing":
      //   return <BillingMethod />;

      // case "National ID":
      //   return (
      //     <div className="space-y-4">
      //       <App head="National ID" />
      //     </div>
      //   );

      case "Subscription":
        return <SubscriptionSettings />;

      case "Delete Account":
        return (
          <div className="space-y-4">
            <App head={"Delete Account"} />
          </div>
        );

      case "Email Notifications":
        return (
          <div className="space-y-4">
            <App head={"Email Notifications"} />
          </div>
        );

      case "SMS Notifications":
        return (
          <div className="space-y-4">
            <App head={"SMS Notifications"} />
          </div>
        );

      default:
        return <div>Select an option from the menu</div>;
    }
  };

  const renderIcon = (option) => {
    switch (option) {
      case "Change Email":
        return <Mail size={20} />;

      case "Change Password":
        return <KeyRoundIcon size={20} />;

      // case "Billing":
      //   return <CreditCardIcon size={20} />;

      // case "National ID":
      //   return <IdCardIcon size={20} />;

      case "Subscription":
        return <CreditCardIcon size={20} />;

      case "Delete Account":
        return <Trash2Icon size={20} />;

      case "Email Notifications":
        return <MessageCircleQuestionIcon size={20} />;

      case "SMS Notifications":
        return <MessageSquareMoreIcon size={20} />;

      default:
        return <MessageSquareMoreIcon size={20} />;
    }
  };

  const SidebarContent = () => (
    <div className="space-y-1">
      {/* Account Settings Section */}
      <div className="mb-4 space-y-2">
        {menuOptions.slice(0, 4).map((option) => (
          <button
            key={option}
            onClick={() => handleOptionSelect(option)}
            className={`text-left px-4 py-3 flex gap-2 rounded-lg w-full transition-colors duration-200 ${
              selectedOption === option
                ? "bg-[#F5F5F5] text-primary Livvic-Medium text-md"
                : "text-[#555555] Livvic-Medium text-md hover:bg-[#F5F5F5]"
            }`}
          >
            {renderIcon(option)}
            {option}
          </button>
        ))}
      </div>

      {/* Divider */}
      <hr className="my-6 border-gray-200" />

      {/* Notifications Section */}
      <div className="mb-4 space-y-2">
        {menuOptions.slice(4).map((option) => (
          <button
            key={option}
            onClick={() => handleOptionSelect(option)}
            className={`text-left px-4 py-3 flex gap-2 w-full rounded-lg transition-colors duration-200 ${
              selectedOption === option
                ? "bg-[#F5F5F5] text-primary Livvic-Medium text-md"
                : "text-[#555555] Livvic-Medium text-md hover:bg-[#F5F5F5]"
            }`}
          >
            {renderIcon(option)}
            {option}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="padding-navbar1 Quicksand">
      <div className="rounded-xl">
        <div className="pb-10">
          {/* Mobile Header with Hamburger */}
          <div className="lg:hidden flex items-center justify-end py-4">
            {/* <p className="Livvic-SemiBold text-2xl">Settings</p> */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MenuIcon size={24} />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-full lg:w-1/3 xl:w-1/4">
              <p className="Livvic-SemiBold lg:text-3xl mt-6 text-2xl py-6 w-fit">
                Settings
              </p>
              <div className="w-64">
                <SidebarContent />
              </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
              <div className="lg:hidden fixed inset-0 z-50 flex">
                {/* Backdrop */}
                <div
                  className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                  onClick={() => setIsSidebarOpen(false)}
                />

                {/* Sidebar */}
                <div className="relative flex flex-col w-80 max-w-xs bg-white shadow-xl">
                  {/* Sidebar Header */}
                  <div className="flex items-center justify-between p-4 border-b">
                    <p className="Livvic-SemiBold text-xl">Settings</p>
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <XIcon size={20} />
                    </button>
                  </div>

                  {/* Sidebar Content */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <SidebarContent />
                  </div>
                </div>
              </div>
            )}

            {/* Right Content Area */}
            <div className="flex-1 lg:w-2/3 xl:w-3/4 lg:border-l-[#EEEEEE] lg:border-l">
              <div className="rounded-lg lg:ml-2 lg:p-6 lg:mt-6 min-h-[500px]">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
