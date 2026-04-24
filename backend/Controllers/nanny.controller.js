import nannyProfile from "../Schema/nannyProfile.js";
import User from "../Schema/user.js";

export const createProfile = async (req, res) => {
  try {
    const { userId } = req.body;

    const profile = await nannyProfile.findOneAndUpdate(
      { userId },
      req.body,
      { upsert: true, new: true }
    );

    await User.findByIdAndUpdate(userId, {
      nannyProfileCompleted: true,
    });

    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};