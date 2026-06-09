import "../../App.css";
import {
  CloseCircleOutlined,
  PoweroffOutlined,
  RightOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "react-avatar";
import { logout } from "../Redux/authSlice";
import { selectUnseenCount } from "../Redux/notificationSlice";
import { useNotifications } from "../../Config/useNotification";
import { timeAgo } from "../subComponents/toCamelStr";
import Button from "../../NewComponents/Button";
import UserAvatar from "../../NewComponents/UserAvatar";
import { clearSelectedContact } from "../Redux/selectedContactSlice";

// eslint-disable-next-line react/prop-types
export default function Navbar1({ nanny }) {
  const { pathname } = useLocation();
  const unseenCount = useSelector(selectUnseenCount);
  const navigate = useNavigate();
  const notificationsData =
    useSelector((state) => state?.notifications?.notifications) || [];
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const basePath = "/dashboard";

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    setShowNotifications(false);
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    setMenuOpen(false);
    setShowNotifications(false);
  };

  const { handleMarkAsSeen } = useNotifications({ userId: user._id });
  const markAsSeen = (id) => {
    handleMarkAsSeen(id);
  };
  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
    setMenuOpen(false);
    setMobileMenuOpen(false);
  };
  const logOut = () => {
    dispatch(logout());
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div
      style={{ background: "#FFFFFF" }}
      className={`${!(
        pathname.startsWith("/dashboard/post-a-job") ||
        pathname.startsWith("/dashboard/post-a-nannyShare")
      ) && "shadow-soft"
        } top-0 z-50 sticky flex justify-between items-center w-full h-20 padding-navbar1`}
    >
      <NavLink
        to={basePath}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <div className="flex gap-1 items-center">
          <img src="/logo3.png" alt="logo" className="w-6 h-6 sm:w-8 sm:h-8" />
          <p className="Livvic-Bold text-lg sm:text-xl Livvic-Bold">Famlink</p>
        </div>
      </NavLink>

      {/* Desktop Navigation */}
      {!(
        pathname.startsWith("/dashboard/post-a-job") ||
        pathname.startsWith("/dashboard/post-a-nannyShare")
      ) && (
          <div className="hidden lg:flex text-lg items-center gap-4">
            <NavLink
              to={basePath}
              style={{
                color:
                  window.location.pathname === basePath
                    ? "#001243"
                    : "#8A8E99",
              }}
              className="transition delay-150 ease-in-out hover:text-[#38AEE3] rounded-3xl duration-300 cursor-pointer Quicksand"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <p className="Livvic-SemiBold text-md">
                Find a Match
              </p>
            </NavLink>

            {/* <NavLink
              className="transition delay-150 ease-in-out hover:text-[#38AEE3] rounded-3xl duration-300 cursor-pointer Quicksand"
              to={`${basePath}/requests`}
              style={({ isActive }) => ({
                color: isActive ? "#001243" : "#8A8E99",
              })}
            >
              <p className="Livvic-SemiBold text-md">Requests</p>
            </NavLink> */}

            {/* {!nanny && (
            <NavLink
              className="transition delay-150 ease-in-out hover:text-[#38AEE3] rounded-3xl duration-300 cursor-pointer Quicksand"
              to={"family/jobListing"}
              style={({ isActive }) => ({
                color: isActive ? "#001243" : "#8A8E99",
              })}
            >
              <p className="Livvic-SemiBold text-md">My Job Listings</p>
            </NavLink>
          )} */}

            {/* <NavLink
            className="transition delay-150 ease-in-out hover:text-[#38AEE3] rounded-3xl duration-300 cursor-pointer Quicksand"
            to={nanny ? "nanny/community" : "family/community"}
            style={({ isActive }) => ({
              color: isActive ? "#001243" : "#8A8E99",
            })}
          >
            <p className="Livvic-SemiBold text-md">Community</p>
          </NavLink> */}

            <NavLink
              className="transition delay-150 ease-in-out hover:text-[#38AEE3] rounded-3xl duration-300 cursor-pointer Quicksand"
              to={`${basePath}/message`}
              style={({ isActive }) => ({
                color: isActive ? "#001243" : "#8A8E99",
              })}
            >
              <p className="Livvic-SemiBold text-md">Matches</p>
            </NavLink>

            <NavLink
              className="transition delay-150 ease-in-out hover:text-[#38AEE3] rounded-3xl duration-300 cursor-pointer Quicksand"
              to={`${basePath}/share-management`}
              style={({ isActive }) => ({
                color: isActive ? "#001243" : "#8A8E99",
              })}
            >
              <p className="Livvic-SemiBold text-md">Share Management</p>
            </NavLink>

          </div>
        )}

      <div className="flex items-center gap-x-4">
        {/* Upgrade Button - always visible */}
        <NavLink to={`${basePath}/pricing`}>
          <Button
            btnText={"Upgrade"}
            className="bg-[#D6FB9A] text-[#025747] text-sm px-3 py-2"
          />
        </NavLink>

        {/* Notifications */}
        <div className="relative">
          <img
            src="/bell-icon.svg"
            onClick={() => setShowNotifications(!showNotifications)}
            className="cursor-pointer w-6 h-6"
            alt="notification-icon"
          />
          {unseenCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs Livvic-Medium px-1 py-0.2 rounded-full">
              {unseenCount > 9 ? "9+" : unseenCount}
            </span>
          )}
        </div>

        {/* Mobile Hamburger Menu */}
        {!(
          pathname.startsWith("/dashboard/post-a-job") ||
          pathname.startsWith("/dashboard/post-a-nannyShare")
        ) && (
            <div className="lg:hidden">
              <button
                onClick={toggleMobileMenu}
                className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors"
              >
                <MenuOutlined className="text-xl text-gray-600" />
              </button>
            </div>
          )}

        {/* Desktop Profile Menu */}
        <div className="hidden lg:block">
          {!(
            pathname.startsWith("/dashboard/post-a-job") ||
            pathname.startsWith("/dashboard/post-a-nannyShare")
          ) && (
              <div
                className="flex gap-x-2 bg-white px-2 py-1 rounded-full cursor-pointer"
                onClick={toggleMenu}
              >
                {/* {user.imageUrl ? (
                <img
                  style={{ borderRadius: "100px" }}
                  src={user.imageUrl}
                  alt="avatar"
                  className="rounded-full w-8 h-8 object-cover"
                />
              ) : (
                <Avatar
                  className="rounded-full text-black"
                  size="32"
                  color={"#AEC4FF"}
                  name={user.name
                    ?.split(" ")
                    .slice(0, 2)
                    .join(" ")}
                />
              )} */}
                <UserAvatar
                  user={user}
                  className={"rounded-full w-8 h-8 object-cover"}
                  size={32}
                  avatarClassName={"rounded-full text-black"}
                />
              </div>
            )}
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 top-20 left-0 right-0 z-40 bg-white shadow-lg lg:hidden"
              style={{ maxHeight: "calc(100vh - 80px)", overflowY: "auto" }}
            >
              <div className="p-4">
                {/* Profile Section */}
                <div className="flex items-center gap-3 pb-4 border-b border-gray-200 mb-4">
                  {/* {user.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt="avatar"
                      className="rounded-full w-12 h-12 object-cover"
                    />
                  ) : (
                    <Avatar
                      className="rounded-full text-black"
                      size="48"
                      color={"#38AEE3"}
                      name={user.name?.split(" ").slice(0, 2).join(" ")}
                    />
                  )} */}
                  <UserAvatar
                    user={user}
                    className={"rounded-full w-12 h-12 object-cover"}
                    size={48}
                    avatarClassName={"rounded-full text-black"}
                  />
                  <div>
                    <p className="Livvic-SemiBold text-lg Quicksand">
                      {user.name}
                    </p>
                  </div>
                </div>

                {/* Main Navigation Links */}
                <div className="space-y-3">
                  <NavLink
                    to={basePath}
                    onClick={() => {
                      closeMobileMenu();
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="block py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors"
                    style={({ isActive }) => ({
                      backgroundColor: isActive ? "#E9F8FF" : "transparent",
                      color: isActive ? "#001243" : "#374151",
                    })}
                  >
                    <p className="Livvic-Medium">
                      Find a Match
                    </p>
                  </NavLink>
                  <NavLink
                    to={`${basePath}/requests`}
                    onClick={closeMobileMenu}
                    className="block py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors"
                    style={({ isActive }) => ({
                      backgroundColor: isActive ? "#E9F8FF" : "transparent",
                      color: isActive ? "#001243" : "#374151",
                    })}
                  >
                    <p className="Livvic-Medium">Requests</p>
                  </NavLink>
                  {/* 
                  {!nanny && (
                    <NavLink
                      to="family/jobListing"
                      onClick={closeMobileMenu}
                      className="block py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors"
                      style={({ isActive }) => ({
                        backgroundColor: isActive ? "#E9F8FF" : "transparent",
                        color: isActive ? "#001243" : "#374151",
                      })}
                    >
                      <p className="Livvic-Medium">My Job Listings</p>
                    </NavLink>
                  )} */}

                  {/* <NavLink
                    to={nanny ? "nanny/community" : "family/community"}
                    onClick={closeMobileMenu}
                    className="block py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors"
                    style={({ isActive }) => ({
                      backgroundColor: isActive ? "#E9F8FF" : "transparent",
                      color: isActive ? "#001243" : "#374151",
                    })}
                  >
                    <p className="Livvic-Medium">Community</p>
                  </NavLink> */}

                  <NavLink
                    to={`${basePath}/message`}
                    onClick={closeMobileMenu}
                    className="block py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors"
                    style={({ isActive }) => ({
                      backgroundColor: isActive ? "#E9F8FF" : "transparent",
                      color: isActive ? "#001243" : "#374151",
                    })}
                  >
                    <p className="Livvic-Medium">Messages</p>
                  </NavLink>

                  <NavLink
                    to={`${basePath}/booking`}
                    onClick={closeMobileMenu}
                    className="block py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors"
                    style={({ isActive }) => ({
                      backgroundColor: isActive ? "#E9F8FF" : "transparent",
                      color: isActive ? "#001243" : "#374151",
                    })}
                  >
                    <p className="Livvic-Medium">Payments</p>
                  </NavLink>

                  {/* Profile & Settings */}
                  <div className="border-t border-gray-200 pt-4 mt-4">


                    <NavLink
                      to={`${basePath}/edit`}
                      onClick={closeMobileMenu}
                      className="block py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors"
                      style={({ isActive }) => ({
                        backgroundColor: isActive ? "#E9F8FF" : "transparent",
                        color: isActive ? "#001243" : "#374151",
                      })}
                    >
                      <p className="Livvic-Medium">Edit Profile</p>
                    </NavLink>

                    <NavLink
                      to={`${basePath}/favorites`}
                      onClick={closeMobileMenu}
                      className="block py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors"
                      style={({ isActive }) => ({
                        backgroundColor: isActive ? "#E9F8FF" : "transparent",
                        color: isActive ? "#001243" : "#374151",
                      })}
                    >
                      <p className="Livvic-Medium">Favorites</p>
                    </NavLink>

                    <NavLink
                      to={`${basePath}/setting`}
                      onClick={closeMobileMenu}
                      className="block py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors"
                      style={({ isActive }) => ({
                        backgroundColor: isActive ? "#E9F8FF" : "transparent",
                        color: isActive ? "#001243" : "#374151",
                      })}
                    >
                      <p className="Livvic-Medium">Settings</p>
                    </NavLink>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <button
                      onClick={() => {
                        dispatch(clearSelectedContact());
                        logOut();
                        closeMobileMenu();
                      }}
                      className="flex items-center gap-2 py-3 px-4 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full text-left"
                    >
                      <PoweroffOutlined />
                      <span className="Livvic-Medium">Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Menu Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
              onClick={closeMobileMenu}
            />
          </>
        )}

        {/* Desktop Profile Dropdown Menu */}
        {menuOpen && (
          <>
            <div
              style={{
                top: 0,
                maxHeight: "80vh",
                overflowY: "auto",
              }}
              className="right-0 z-50 absolute bg-white shadow-lg w-72 hidden lg:block"
            >
              {/* Profile Section */}
              <div style={{ background: "#E9F8FF" }}>
                <div className="pb-2">
                  <CloseCircleOutlined
                    onClick={toggleMenu}
                    className="p-2 cursor-pointer"
                  />
                  <NavLink
                    onClick={toggleMenu}
                    to={basePath}
                  >
                    <div className="flex justify-center w-full text-center">
                      <div>
                        {/* {user.imageUrl ? (
                          <img
                            src={user.imageUrl}
                            alt="avatar"
                            className="mx-auto rounded-full w-12 h-12 object-cover"
                          />
                        ) : (
                          <Avatar
                            className="rounded-full text-5xl text-black"
                            size="48"
                            color={"#38AEE3"}
                            name={user.name?.split(" ").slice(0, 2).join(" ")}
                          />
                        )} */}
                        <UserAvatar
                          user={user}
                          className={
                            "mx-auto rounded-full w-12 h-12 object-cover"
                          }
                          size={48}
                          avatarClassName={"rounded-full text-5xl text-black"}
                        />
                        <p className="py-2 Livvic-SemiBold text-2xl Quicksand">
                          {user.name}
                        </p>
                      </div>
                    </div>
                  </NavLink>
                </div>
              </div>

              {/* Menu Options */}
              <div className="mt-8 flex justify-center">
                <div>


                  <NavLink
                    className="flex justify-between border-2 hover:opacity-60 mb-4 px-2 py-1 rounded-3xl w-56 Livvic-Medium text-sm duration-300 cursor-pointer Quicksand"
                    to={`${basePath}/edit`}
                    style={({ isActive }) => ({
                      backgroundColor: isActive ? "#E9F8FF" : "#F7F9FA",
                    })}
                    onClick={toggleMenu}
                  >
                    <p>Edit Profile</p>
                    <RightOutlined className="text-sm" />
                  </NavLink>

                  {/* {!nanny && (
                    <NavLink
                      className="flex justify-between border-2 hover:opacity-60 mb-4 px-2 py-1 rounded-3xl w-56 Livvic-Medium text-sm duration-300 cursor-pointer Quicksand"
                      to={"dashboard/post-a-job"}
                      style={({ isActive }) => ({
                        backgroundColor: isActive ? "#E9F8FF" : "#F7F9FA",
                      })}
                      onClick={toggleMenu}
                    >
                      <p>Post a Job</p>
                      <RightOutlined className="text-sm" />
                    </NavLink>
                  )} */}

                  {/* <NavLink
                    className="flex justify-between border-2 hover:opacity-60 mb-4 px-2 py-1 rounded-3xl w-56 Livvic-Medium text-sm duration-300 cursor-pointer Quicksand"
                    to={nanny ? "nanny/booking" : "family/booking"}
                    style={({ isActive }) => ({
                      backgroundColor: isActive ? "#E9F8FF" : "#F7F9FA",
                    })}
                    onClick={toggleMenu}
                  >
                    <p>Application</p>
                    <RightOutlined className="text-sm" />
                  </NavLink> */}

                  <NavLink
                    className="flex justify-between border-2 hover:opacity-60 mb-4 px-2 py-1 rounded-3xl w-56 Livvic-Medium text-sm duration-300 cursor-pointer Quicksand"
                    to={`${basePath}/favorites`}
                    style={({ isActive }) => ({
                      backgroundColor: isActive ? "#E9F8FF" : "#F7F9FA",
                    })}
                    onClick={toggleMenu}
                  >
                    <p>Favorite</p>
                    <RightOutlined className="text-sm" />
                  </NavLink>

                  <NavLink
                    className="flex justify-between border-2 hover:opacity-60 mb-4 px-2 py-1 rounded-3xl w-56 Livvic-Medium text-sm duration-300 cursor-pointer Quicksand"
                    to={`${basePath}/setting`}
                    style={({ isActive }) => ({
                      backgroundColor: isActive ? "#E9F8FF" : "#F7F9FA",
                    })}
                    onClick={toggleMenu}
                  >
                    <p>Settings</p>
                    <RightOutlined className="text-sm" />
                  </NavLink>
                </div>
              </div>

              {/* <div className="my-2">
                <h5 className="mx-8 mb-4 Livvic-SemiBold text-2xl">Support</h5>
                <div className="flex justify-center">
                  <div>
                    <NavLink
                      className="flex justify-between border-2 hover:opacity-60 mb-4 px-2 py-1 rounded-3xl w-56 Livvic-Medium text-sm duration-300 cursor-pointer Quicksand"
                      to={nanny ? "nanny/tipsAndArticles" : "family/tipsAndArticles"}
                      style={({ isActive }) => ({
                        backgroundColor: isActive ? "#E9F8FF" : "#F7F9FA",
                      })}
                      onClick={toggleMenu}
                    >
                      <p>Tips & Articles</p>
                      <RightOutlined className="text-sm" />
                    </NavLink>
                    <NavLink
                      className="flex justify-between border-2 hover:opacity-60 mb-4 px-2 py-1 rounded-3xl w-56 Livvic-Medium text-sm duration-300 cursor-pointer Quicksand"
                      to={nanny ? "nanny/howItWorks" : "family/howItWorks"}
                      style={({ isActive }) => ({
                        backgroundColor: isActive ? "#E9F8FF" : "#F7F9FA",
                      })}
                      onClick={toggleMenu}
                    >
                      <p>How it Works</p>
                      <RightOutlined className="text-sm" />
                    </NavLink>
                    <NavLink
                      className="flex justify-between border-2 hover:opacity-60 mb-4 px-2 py-1 rounded-3xl w-56 Livvic-Medium text-sm duration-300 cursor-pointer Quicksand"
                      to={nanny ? "nanny/trustsAndSafety" : "family/trustsAndSafety"}
                      style={({ isActive }) => ({
                        backgroundColor: isActive ? "#E9F8FF" : "#F7F9FA",
                      })}
                      onClick={toggleMenu}
                    >
                      <p>Trust & Safety</p>
                      <RightOutlined className="text-sm" />
                    </NavLink>
                  </div>
                </div>
              </div> */}

              {/* Logout */}
              <div className="flex justify-center mt-4 mb-6 Quicksand">
                <button
                  onClick={logOut}
                  className="flex items-center gap-2 hover:opacity-65 duration-300"
                >
                  <PoweroffOutlined />
                  Logout
                </button>
              </div>
            </div>

            {/* Desktop Backdrop */}
            <div
              className="z-40 fixed inset-0 bg-black opacity-50 hidden lg:block"
              onClick={toggleMenu}
            />
          </>
        )}

        {/* Notifications Dropdown */}
        {showNotifications && (
          <>
            <div onClick={toggleNotifications} className="fixed inset-0 z-40" />
            <div
              style={{
                top: 70,
                right: 20,
                maxHeight: "80vh",
                overflowY: "auto",
              }}
              className="absolute right-0 mt-2 lg:w-96 w-80 z-50 bg-white rounded-xl shadow-lg"
            >
              <div className="p-4 border-b flex items-center justify-between bg-[#E9F8FF] rounded-t-xl">
                <h3 className="Livvic-SemiBold text-lg">Notifications</h3>
                <button
                  onClick={toggleNotifications}
                  className="text-gray-500 hover:text-black"
                >
                  ✕
                </button>
              </div>

              {notificationsData.length > 0 ? (
                <div className="space-y-3 p-4">
                  {notificationsData.map((n, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        toggleNotifications();
                        markAsSeen(n._id);
                        if (n.type === "Booking") {
                          n.content === "Give review"
                            ? navigate(
                              `${basePath}/profile`
                            )
                            : navigate(
                              `${basePath}/booking`
                            );
                        } else if (n.type === "Message") {
                          navigate(
                            `${basePath}/message`
                          );
                        } else {
                          navigate("/notifications");
                        }
                      }}
                      className={`flex items-start justify-between cursor-pointer p-3 rounded-lg ${n.seen ? "bg-gray-100" : "bg-blue-50"
                        } hover:bg-blue-100 transition`}
                    >
                      <div className="flex items-center gap-3">
                        {n.senderId?.imageUrl ? (
                          <img
                            src={n.senderId?.imageUrl}
                            className="w-10 h-10 rounded-full object-cover"
                            alt="profile"
                          />
                        ) : (
                          <Avatar
                            className="rounded-full text-5xl text-black"
                            size="40"
                            color={"#38AEE3"}
                            name={n.senderId?.name
                              ?.split(" ")
                              .slice(0, 2)
                              .join(" ")}
                          />
                        )}
                        <div>
                          <p className="Livvic-SemiBold">{n.senderId?.name}</p>
                          <p className="text-sm text-gray-600 whitespace-normal">
                            {n.type === "Message" &&
                              `New Message: ${n.content.length > 25
                                ? n.content.slice(0, 25) + "..."
                                : n.content
                              }`}
                            {n.type === "Booking" &&
                              `${n.content.length > 25
                                ? n.content.slice(0, 25) + "..."
                                : n.content
                              }`}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No notifications
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
