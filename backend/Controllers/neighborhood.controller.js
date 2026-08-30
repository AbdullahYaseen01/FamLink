import User from "../Schema/user.js";
import { recordWaitlistEntry } from "../Services/utils/waitlist.js";
import { isInsideLaunchRadius } from "../Services/utils/serviceArea.js";
import {
  getLaunchStatusForUser,
  getAllNeighborhoodStatuses,
  getStatusForNeighborhood,
} from "../Services/utils/neighborhoodLaunch.js";

const norm = (s) => String(s || "").trim();
const keyOf = (s) => norm(s).toLowerCase();

export async function neighborhoodStatus(req, res) {
  const user = await User.findById(req.userId).select("type location.city location.neighborhood");
  if (!user) return res.status(404).json({ message: "User not found" });
  const data = await getLaunchStatusForUser(user);
  return res.json(data);
}


export async function allNeighborhoodStatuses(req, res) {
  const city = String(req.query.city || "").trim();
  const data = await getAllNeighborhoodStatuses(city ? { city } : {});
  return res.json(data);
}

export async function resolveNeighborhood(req, res) {
  const { city, neighborhood, zip } = req.body || {};
  if (!city && !neighborhood) {
    return res.status(400).json({ message: "City or neighborhood is required." });
  }
  const data = await getStatusForNeighborhood(city, neighborhood);
  const insideServiceArea = isInsideLaunchRadius(
    zip ? { city, zip } : { city }
  );
  return res.json({ ...data, insideServiceArea });
}

export async function joinLaunch(req, res) {
  const { city, neighborhood, accountType, zip, formattedAddress } = req.body || {};

  if (!city || !neighborhood) {
    return res.status(400).json({ message: "City and neighborhood are required." });
  }

  const user = await User.findById(req.userId)
    .select("type email name location.city location.neighborhood zipCode");
  if (!user) return res.status(404).json({ message: "User not found" });

  const currentHood = norm(user.location?.neighborhood);
  const currentCity = norm(user.location?.city);
  if (keyOf(currentHood) === keyOf(neighborhood) && keyOf(currentCity) === keyOf(city)) {
    const status = await getStatusForNeighborhood(city, neighborhood);
    return res.json({ joined: false, alreadyMember: true, ...status });
  }

  const updateFields = {
    "location.city": city.trim(),
    "location.neighborhood": neighborhood.trim(),
  };
  if (formattedAddress) updateFields["location.format_location"] = formattedAddress;
  if (zip) updateFields.zipCode = zip;

  if (!user.type && accountType) {
    updateFields.type = accountType === "Nanny" ? "Nanny" : "Parents";
  }

  await User.updateOne({ _id: req.userId }, { $set: updateFields });

  recordWaitlistEntry({
    email: user.email,
    name: user.name,
    userType: user.type || (accountType === "Nanny" ? "Nanny" : "Parents"),
    location: { city, neighborhood, zip },
    source: "registration",
    notifyConsent: true,
    userId: user._id,
  }).catch(() => { });

  const status = await getStatusForNeighborhood(city, neighborhood);
  return res.json({
    joined: true,
    previousNeighborhood: currentHood || null,
    previousCity: currentCity || null,
    ...status,
  });
}