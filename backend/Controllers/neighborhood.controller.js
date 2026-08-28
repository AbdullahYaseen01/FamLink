import User from "../Schema/user.js";
import { getLaunchStatusForUser } from "../Services/utils/neighborhoodLaunch.js";

export async function neighborhoodStatus(req, res) {
  const user = await User.findById(req.userId).select("type location.city location.neighborhood");
  if (!user) return res.status(404).json({ message: "User not found" });
  const data = await getLaunchStatusForUser(user);
  return res.json(data);
}
