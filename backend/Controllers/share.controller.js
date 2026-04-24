import shareSetup from "../Schema/shareSetup.js";
import User from "../Schema/user.js";

export const createShare = async (req, res) => {
  try {
    const { userId } = req.body;

    const data = await shareSetup.findOneAndUpdate(
      { userId },
      req.body,
      { upsert: true, new: true }
    );

    await User.findByIdAndUpdate(userId, {
      shareSetupCompleted: true,
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};