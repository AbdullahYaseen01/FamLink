import onboardingSchema from '../Schema/onboardingShare.js'

export const saveOnboarding = async (req, res) => {
  try {
    const { email } = req.body;

    const data = await onboardingSchema.findOneAndUpdate(
      { email },
      req.body,
      { upsert: true, new: true }
    );

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};