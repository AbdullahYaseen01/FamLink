import nannyProfile from "../Schema/nannyProfile.js";
import User from "../Schema/user.js";
import uploadImage from "../Services/utils/uplaodImage.js";

export const createProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "Access denied" });
    }

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

    res.status(200).json({ ...profile, message: "Profile created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const parseIfJson = (field) => {
      if (!field) return field;
      try {
        return JSON.parse(field);
      } catch {
        return field;
      }
    };

    const data = { ...req.body };
    
    // Parse JSON fields safely if they exist in the payload
    if (data.availability !== undefined) data.availability = parseIfJson(data.availability);
    if (data.preferredAges !== undefined) data.preferredAges = parseIfJson(data.preferredAges);
    if (data.responsibilities !== undefined) data.responsibilities = parseIfJson(data.responsibilities);
    if (data.certifications !== undefined) data.certifications = parseIfJson(data.certifications);
    if (data.specificDays !== undefined) data.specificDays = parseIfJson(data.specificDays);
    if (data.languages !== undefined) data.languages = parseIfJson(data.languages);
    if (data.ageGroupsExp !== undefined) data.ageGroupsExp = parseIfJson(data.ageGroupsExp);
    if (data.additionalDetails !== undefined) data.additionalDetails = parseIfJson(data.additionalDetails);
    if (data.agesCare !== undefined) data.agesCare = parseIfJson(data.agesCare);

    // If a new image was uploaded
    if (req.file) {
      data.imageFile = await uploadImage(
        req.file.buffer,
        req.userId,
        "nanny_profile"
      );
    }

    const updatedProfile = await nannyProfile.findOneAndUpdate(
      { userId },
      { $set: data },
      { new: true, upsert: true, runValidators: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ message: "Nanny profile not found. Please create it first." });
    }

    res.status(200).json({ 
      message: "Profile updated successfully", 
      profile: updatedProfile 
    });
  } catch (err) {
    console.error("Error updating nanny profile:", err);
    res.status(500).json({ error: err.message });
  }
};