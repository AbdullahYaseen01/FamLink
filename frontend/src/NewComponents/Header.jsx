import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import Button from "./Button";
import { useLocation } from "react-router-dom";

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
  }, [isMenuOpen]);

  useEffect(() => {
  window.scrollTo(0, 0);
}, [pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* ── HEADER SHELL ── */}
      <header
        className={`
    fixed z-50 transition-all duration-500 ease-in-out
    left-1/2 -translate-x-1/2
    ${scrolled
            ? "top-3 bg-[#F6F3EE] py-2 sm:py-3 rounded-2xl w-[calc(100%-4rem)] lg:w-[calc(100%-45rem)]"
            : "top-0 bg-transparent py-3 sm:py-5 w-full lg:w-[calc(100%-35rem)]"
          }
  `}
      >
        <div className="px-4 sm:px-6 lg:px-8 mx-auto max-w-screen-xl">

          {/* ── DESKTOP (lg+) ── */}
          <div className="hidden lg:flex justify-between items-center">

            {/* Logo */}
            <NavLink to="/">
              <div className="flex items-center gap-1.5">
                <img
                  src="/logo3.png"
                  alt="logo"
                  className={`transition-all duration-500 ${scrolled ? "w-6 h-6" : "w-8 h-8"}`}
                />
                <p className={`Livvic-Bold transition-all duration-500 text-white ${scrolled ? "text-xl text-primary" : "text-xl"}`}>
                  Famlink
                </p>
              </div>
            </NavLink>

            {/* Nav links */}
            <div className="flex items-center gap-6">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `Livvic-SemiBold transition-all duration-500 text-white  ${scrolled ? "text-base text-primary" : "text-base"} ${isActive ? "opacity-100" : "opacity-40 hover:opacity-70"
                  }`
                }
              >
                For Families
              </NavLink>
              <NavLink
                to="/jobSeekers"
                className={({ isActive }) =>
                  `Livvic-SemiBold transition-all duration-500 text-white ${scrolled ? "text-base text-primary" : "text-base"} ${isActive ? "opacity-100" : "opacity-40 hover:opacity-70"
                  }`
                }
              >
                For Caregivers
              </NavLink>
            </div>

            {/* Action buttons */}
            {!pathname.startsWith("/business") ? (
              <div className="flex items-center gap-3">
                <NavLink to="/login">
                  <Button
                    btnText="Log in"
                    className={`text-white transition-all duration-500 ${scrolled ? "text-sm sm:text-base text-primary" : "text-sm sm:text-base"}`}
                  />
                </NavLink>
                <NavLink to="/joinNow">
                  <Button
                    btnText="Join now"
                    className={`bg-[#AEC4FF] transition-all duration-500 ${scrolled ? "text-sm sm:text-base" : "text-sm sm:text-base"}`}
                  />
                </NavLink>
              </div>
            ) : (
              <div className="w-1 h-1" />
            )}
          </div>

          {/* ── MOBILE (below lg) ── */}
          <div className="lg:hidden flex items-center justify-between w-full">

            {/* Logo — always visible */}
            <NavLink to="/" onClick={closeMenu}>
              <div className="flex items-center gap-1.5">
                <img
                  src="/logo3.png"
                  alt="logo"
                  className={`transition-all duration-500 ${scrolled ? "w-5 h-5" : "w-6 h-6"}`}
                />
                <p className={`Livvic-Bold text-white transition-all duration-500 ${scrolled ? "text-base text-primary" : "text-base"}`}>
                  Famlink
                </p>
              </div>
            </NavLink>

            {/* Login + Join — slide in when scrolled */}
            {/* {!pathname.startsWith("/business") && (
              <div
                className="flex items-center gap-2 overflow-hidden transition-all duration-500 ease-in-out"
                style={{
                  maxWidth: scrolled ? "220px" : "0px",
                  opacity: scrolled ? 1 : 0,
                  pointerEvents: scrolled ? "auto" : "none",
                }}
              >
                <NavLink to="/login" className="flex-shrink-0">
                  <Button
                    btnText="Log in"
                    className="text-white text-xs py-1 px-3 whitespace-nowrap"
                  />
                </NavLink>
                <NavLink to="/joinNow" className="flex-shrink-0">
                  <Button
                    btnText="Join now"
                    className="bg-[#AEC4FF] text-xs py-1 px-3 whitespace-nowrap"
                  />
                </NavLink>
              </div>
            )} */}

            {/* Hamburger — always white since bg is always dark */}
            <button
              onClick={toggleMenu}
              className="flex-shrink-0 flex flex-col justify-center items-center w-8 h-8 focus:outline-none z-[70]"
              aria-label="Toggle menu"
            >
              <span
                className={`block w-5 h-0.5 transform transition-all duration-300 ease-in-out ${scrolled ? "bg-black" : "bg-white"} ${isMenuOpen ? "rotate-45 translate-y-[6px]" : ""}`}
              />
              <span
                className={`block w-5 h-0.5 mt-1.5 transform transition-all duration-300 ease-in-out ${scrolled ? "bg-black" : "bg-white"} ${isMenuOpen ? "opacity-0" : ""
                  }`}
              />
              <span
                className={`block w-5 h-0.5 mt-1.5 transform transition-all duration-300 ease-in-out ${scrolled ? "bg-black" : "bg-white"} ${isMenuOpen ? " -rotate-45 -translate-y-[9px]" : ""
                  }`}
              />
            </button>
          </div>

        </div>
      </header>

      {/* Page content spacer */}
      <div className="h-14 sm:h-16 lg:h-20" />

      {/* ── MOBILE FULL-SCREEN MENU ── */}
      <div
        className={`lg:hidden fixed inset-0 z-[60] bg-white shadow-2xl transition-all duration-300 ease-in-out ${isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
      >
        {/* Menu header row */}
        <div className="flex justify-between items-center px-6 pt-10 pb-4">
          <div className="flex items-center gap-2">
            <img src="/logo3.png" alt="logo" className="w-9 h-9" />
            <p className="Livvic-Bold text-2xl text-primary">Famlink</p>
          </div>
          <button
            onClick={closeMenu}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors duration-200"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Menu body */}
        <div className="px-6 pt-2 pb-8 flex flex-col h-[calc(100vh-88px)]">
          <nav className="space-y-1">
            <NavLink
              to="/"
              onClick={closeMenu}
              className={({ isActive }) =>
                `block Livvic-SemiBold text-xl py-3 px-4 rounded-xl transition-all duration-200 ${isActive
                  ? "text-primary bg-gray-50"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                }`
              }
            >
              Nanny Share
            </NavLink>
            <NavLink
              to="/jobSeekers"
              onClick={closeMenu}
              className={({ isActive }) =>
                `block Livvic-SemiBold text-xl py-3 px-4 rounded-xl transition-all duration-200 ${isActive
                  ? "text-primary bg-gray-50"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                }`
              }
            >
              For Caregivers
            </NavLink>
          </nav>

          <div className="flex-grow" />

          {!pathname.startsWith("/business") && (
            <div className="space-y-3 border-t border-gray-100 pt-6">
              <NavLink to="/login" onClick={closeMenu} className="block">
                <Button
                  btnText="Log in"
                  className="w-full text-base py-3 justify-center border border-gray-200 text-primary"
                />
              </NavLink>
              <NavLink to="/joinNow" onClick={closeMenu} className="block">
                <Button
                  btnText="Join now"
                  className="w-full bg-[#AEC4FF] text-gray-900 text-base py-3 justify-center hover:bg-[#9DB8FF] transition-colors duration-200"
                />
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Header;