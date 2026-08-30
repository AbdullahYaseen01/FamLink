import User from "../Schema/user.js";
import { getLaunchStatusForUser, getAllNeighborhoodStatuses } from "../Services/utils/neighborhoodLaunch.js";

export async function neighborhoodStatus(req, res) {
  const user = await User.findById(req.userId).select("type location.city location.neighborhood");
  if (!user) return res.status(404).json({ message: "User not found" });
  const data = await getLaunchStatusForUser(user);
  return res.json(data);
}

export async function checkNeighborhoodStatus(req, res) {
  try {
    const { city, neighborhood, tract_geoid } = req.body;
    // Create a dummy user object to pass into the existing logic
    const dummyUser = {
      location: {
        city,
        neighborhood,
        tract_geoid
      }
    };
    const data = await getLaunchStatusForUser(dummyUser);
    return res.json(data);
  } catch (error) {
    console.error("Error checking neighborhood status:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
}

export async function allNeighborhoodStatuses(req, res) {
  const data = await getAllNeighborhoodStatuses();
  return res.json(data);
}

export async function submitLaunchRequest(req, res) {
  try {
    const { neighborhood, city, tract_geoid, accountType, email, zipCode } = req.body;
    const userId = req.userId; // Optional now

    if (!neighborhood || !city || !accountType || (!userId && !email)) {
      return res.status(400).json({ status: "error", message: "Missing required fields" });
    }

    const LaunchRequest = (await import("../Schema/launchRequest.js")).default;
    
    // Prevent duplicate launch requests for the same neighborhood by the same user/email
    let query = { neighborhood, city, accountType };
    if (userId) query.userId = userId;
    else if (email) query.email = email.toLowerCase();
    
    const existing = await LaunchRequest.findOne(query);
    if (!existing) {
      const request = new LaunchRequest({
        userId,
        email: email ? email.toLowerCase() : undefined,
        neighborhood,
        city,
        tract_geoid,
        zipCode,
        accountType,
      });
      await request.save();
    }

    res.status(201).json({ status: "success", message: "Launch request submitted successfully" });
  } catch (error) {
    console.error("Error submitting launch request:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
}
