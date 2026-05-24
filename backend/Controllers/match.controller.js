import matchRequest from "../Schema/matchRequest.js";
import User from "../Schema/user.js";

export const requestMatch = async (req, res) => {
  const { senderId, receiverId, message } = req.body;
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "Access denied" });
    }
    if (!user.nannyProfileCompleted) {
      return res.status(403).json({ message: "Please complete your profile before matching" });
    }
    if (user.matchRequestsSent === 1 && !user.premium) {
      return res.status(403).json({ message: "Free request limit exhausted. Subscribe to keep matching" });
    }
    try {
      const data = await matchRequest.create({ senderId, receiverId, message });
      await User.findByIdAndUpdate(userId, {
        $inc: {
          matchRequestsSent: 1,
        },
      });
      console.log("Data saved and matchrequest incremented")
      return res.status(200).json({
        message: "Request sent successfully",
        data: []
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: err.message,
        stack: err.stack, // ← temporary, remove after fixing
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
      stack: err.stack, // ← temporary, remove after fixing
    });
  }
};

export const getNearbyMatches = async (req, res) => {
  const user = await User.findById(req.params.userId);

  const matches = await User.find({
    type: "Parents",
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: user.location.coordinates,
        },
        $maxDistance: 10000,
      },
    },
  });

  res.json(matches);
};