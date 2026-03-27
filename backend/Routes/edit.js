import express from "express";
import User from "../Schema/user.js";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";
import { upload } from "../Services/utils/uploadMiddleware.js";
import {
  createLocalUrlForFile,
  createPublicUrlForFile,
} from "../Services/utils/upload.js";
import fs from "fs";
import uploadImage from "../Services/utils/uplaodImage.js";

const router = express.Router();

router.put("/user", authMiddleware, upload.any(), async (req, res) => {
  const id = req.userId;
  const {
    name,
    location,
    gender,
    age,
    additionalInfo,
    services,
    noOfChildren,
    aboutMe,
    zipCode,
    hasSubmittedSheetResponse,
  } = req.body;

  let parsedAdditionalInfo = [];

  // Parse additionalInfo if it's provided as a string
  if (typeof additionalInfo === "string") {
    try {
      parsedAdditionalInfo = JSON.parse(additionalInfo);
    } catch (error) {
      return res
        .status(400)
        .json({ message: "Invalid JSON format for additionalInfo", error });
    }
  }

  try {
    // Find the user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Handle image upload
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imgUrl = await uploadImage(file.buffer, user.email, `${user._id}`);
        // const filePath = createPublicUrlForFile(req, file); // Generate public URL for the file
        // const localFilePath = createLocalUrlForFile(filePath); // Generate the local file system path for comparison

        // if (file.fieldname === "imageUrl") {
        //   // Check if the user already has an image and delete the old one if necessary
        //   if (user.imageUrl) {
        //     const existingImagePath = createLocalUrlForFile(user.imageUrl); // Convert user image URL to local file path

        //     // If the image exists in the local file system and it's not the same as the newly uploaded image
        //     if (
        //       fs.existsSync(existingImagePath) &&
        //       existingImagePath !== localFilePath
        //     ) {
        //       // Delete the old image
        //       fs.unlinkSync(existingImagePath);
        //     }
        //   }

        // Now assign the new image URL to the user object
        user.imageUrl = imgUrl; // Update the user with the new file URL
        // Add more conditions for other file fields if needed
      }
    }

    // Update basic fields
    if (name !== undefined) user.name = name;
    if (hasSubmittedSheetResponse != undefined) user.hasSubmittedSheetResponse = hasSubmittedSheetResponse;
    if (location !== undefined) user.location = JSON.parse(location);
    if (gender !== undefined) user.gender = gender;
    if (age !== undefined) user.age = age;
    if (zipCode !== undefined) user.zipCode = zipCode;
    if (aboutMe !== undefined) user.aboutMe = aboutMe;
    if (services && services != []) user.services = JSON.parse(services);
    if (noOfChildren) user.noOfChildren = JSON.parse(noOfChildren);

    // Initialize additionalInfo if it doesn't exist
    if (!Array.isArray(user.additionalInfo)) {
      user.additionalInfo = [];
    }

    // Update or add new additionalInfo entries
    if (Array.isArray(parsedAdditionalInfo)) {
      for (const newInfo of parsedAdditionalInfo) {
        const existingInfoIndex = user.additionalInfo.findIndex(
          (info) => info.key === newInfo.key
        );

        if (existingInfoIndex >= 0) {
          user.additionalInfo[existingInfoIndex].value = newInfo.value;
          user.markModified(`additionalInfo.${existingInfoIndex}.value`);
        } else {
          // Add new entry
          user.additionalInfo.push(newInfo);
        }
      }
    }

    // Save the updated user data
    await user.save();
    const populatedUser = await User.findById(id)
      .select("-password") // 👈 Exclude password from the main user
      .populate({
        path: "reviews.userId",
        select: "name imageUrl", // 👈 Ensure password is excluded from populated users too
      });

    // Calculate average rating
    let averageRating = 0;
    if (populatedUser.reviews && populatedUser.reviews.length > 0) {
      const totalRating = populatedUser.reviews.reduce(
        (acc, review) => acc + review.rating,
        0
      );
      averageRating = (totalRating / populatedUser.reviews.length).toFixed(1);
    }
    // Return the updated user and average rating
    return res.status(200).json({
      message: "User updated successfully",
      user: { ...populatedUser.toObject(), averageRating }
    });
  } catch (error) {
    console.error("Error updating user:", error); // Log the error for debugging
    return res.status(500).json({ message: "Error updating user", error });
  }
});

router.put('/admin/user', authMiddleware, upload.any(), async (req, res) => {
  try {
    const id = req.userId;
    const admin = await User.findById(id);
    if (!admin || admin.type !== "Admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { 
      userId, 
      name, 
      location, 
      gender, 
      age, 
      zipCode, 
      aboutMe, 
      services, 
      noOfChildren, 
      additionalInfo, 
      removePfp 
    } = req.body;

    let parsedAdditionalInfo = [];
    try {
      if (additionalInfo) {
        parsedAdditionalInfo = JSON.parse(additionalInfo);
      }
    } catch (err) {
      return res.status(400).json({ message: "Invalid additionalInfo JSON" });
    }

    console.log("Updating user:", userId);

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    // Start with current user data
    let updateData = { ...user };

    // Handle profile picture removal
    if (removePfp === "true" || removePfp === true) {
      updateData.imageUrl = null;
    }

    // Handle new image upload
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imgUrl = await uploadImage(file.buffer, user.email, `${user._id}`);
        updateData.imageUrl = imgUrl;
      }
    }

    // Update basic fields
    if (name !== undefined) updateData.name = name;
    if (location !== undefined) updateData.location = JSON.parse(location);
    if (gender !== undefined) updateData.gender = gender;
    if (age !== undefined) updateData.age = age;
    if (zipCode !== undefined) updateData.zipCode = zipCode;
    if (aboutMe !== undefined) updateData.aboutMe = aboutMe;
    if (services && services.length > 0) updateData.services = JSON.parse(services);
    if (noOfChildren) updateData.noOfChildren = JSON.parse(noOfChildren);

    // Handle additionalInfo
    if (!Array.isArray(updateData.additionalInfo)) updateData.additionalInfo = [];
    for (const newInfo of parsedAdditionalInfo) {
      const existingIndex = updateData.additionalInfo.findIndex(info => info.key === newInfo.key);
      if (existingIndex >= 0) {
        updateData.additionalInfo[existingIndex].value = newInfo.value;
      } else {
        updateData.additionalInfo.push(newInfo);
      }
    }

    // Save updated user
    const updated = await User.findByIdAndUpdate(userId, updateData, { new: true }).lean();

    // Format for frontend
    const [firstName, ...rest] = updated.name?.split(" ") ?? [];
    const lastName = rest.join(" ");
    const cityState = updated.location?.format_location?.split(", ") ?? [];
    const avgRating = updated.reviews?.length > 0
      ? updated.reviews.reduce((sum, r) => sum + r.rating, 0) / updated.reviews.length
      : 0;

    const formattedUser = {
      id: updated._id,
      username: updated.email.split("@")[0],
      email: updated.email,
      firstName,
      lastName,
      role: updated.type,
      profileImage: updated.imageUrl || null,
      phone: updated.phoneNo || "",
      city: cityState[cityState.length - 3] || "",
      state: cityState[cityState.length - 2] || "",
      hourlyRate: undefined,
      bio: updated.additionalInfo?.find(info => info.key === "jobDescription")?.value || "",
      avgRating,
      totalReviews: updated.reviews?.length || 0,
      isVerifiedEmail: updated.verified?.emailVer || false,
      isVerifiedID: updated.verified?.nationalIDVer === "true",
      isActive: updated.status === "Active",
      createdAt: updated.createdAt,
    };

    return res.status(200).json({
      message: "User updated successfully",
      user: formattedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ message: "Error updating user", error });
  }
});



export default router;
