import User from "../Schema/user.js";
import { getLaunchStatusForUser } from "../Services/utils/neighborhoodLaunch.js";

export async function neighborhoodStatus(req, res) {
  try {
    const user = await User.findById(req.userId).select(
      "type location.city location.neighborhood location.format_location"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    const data = await getLaunchStatusForUser(user);
    return res.json(data);
  } catch (error) {
    console.error("neighborhood/status failed:", error?.message || error);
    return res.status(500).json({ message: "Could not load neighborhood status" });
  }
}
