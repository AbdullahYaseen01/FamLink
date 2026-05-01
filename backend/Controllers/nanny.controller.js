import nannyProfile from "../Schema/nannyProfile.js";
import User from "../Schema/user.js";
import uploadImage from "../Services/utils/uplaodImage.js";

export const createProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const parseIfJson = (field) => {
      try {
        return JSON.parse(field);
      } catch {
        return field;
      }
    };

    const data = {
      ...req.body,
      availability: parseIfJson(req.body.availability),
      preferredAges: parseIfJson(req.body.preferredAges),
      responsibilities: parseIfJson(req.body.responsibilities),
      certifications: parseIfJson(req.body.certifications),
      specificDays: parseIfJson(req.body.specificDays),
    };
    const document = data;

    let imageUrl = "";

    if (req.file) {
      imageUrl = await uploadImage(
        req.file.buffer,   // ✅ directly from multer
        req.userId,
        "new_user"
      );
    }

    document["imageFile"] = imageUrl;

    const profile = await nannyProfile.findOneAndUpdate(
      { userId },
      document,
      { upsert: true, new: true }
    );

    if (!req.body["careType"]) {
      await User.findByIdAndUpdate(userId, {
        nannyProfileCompleted: true,
      });
    }

    res.status(200).json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};