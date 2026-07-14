import { api } from "./api";

// The waitlist forms carry a location in three different shapes: a Google Places
// object (the standalone form and both questionnaires), a plain string, or
// nothing at all. The confirmation email only needs a city to print, and falls
// back to "your area" server-side when it can't get one.
const cityFrom = (location) => {
  if (!location) return "";
  if (typeof location === "string") return location;
  return location.city || location.neighborhood || "";
};

// Send the waitlist confirmation email (template 14) to the address someone just
// signed up with. Every waitlist form in the app goes through this.
//
// Deliberately never throws. The confirmation is a courtesy on top of the real
// work — recording the signup in the sheet — so a mail failure must not take the
// signup down with it, and the caller shows its success state either way. A
// failure is logged and swallowed.
export const sendWaitlistConfirmation = async ({ email, name, location, city }) => {
  if (!email) return;
  try {
    await api.post("/waitlist/confirmation", {
      email,
      name: name || "",
      city: city || cityFrom(location),
    });
  } catch (error) {
    console.error("Waitlist confirmation email failed:", error);
  }
};
