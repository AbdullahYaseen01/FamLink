import User from "../Schema/user.js";
import PostJob from "../Schema/postJob.js";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";
import {
  PUBLIC_USER_SELECT,
  toPublicUser,
  toPublicUsers,
} from "../Services/utils/userPrivacy.js";
import express from "express";

const router = express.Router();

router.post("/add", authMiddleware, async (req, res) => {
  const currentUserId = req.userId; // Log currentUserId

  const { favouriteUserId } = req.body;
  try {
    const user = await User.findById(currentUserId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the favouriteUserId already exists in the favourite array
    const favIndex = user.favourite.indexOf(favouriteUserId);

    if (favIndex !== -1) {
      // If exists, remove the user from favourites
      user.favourite.splice(favIndex, 1);
    } else {
      // If not exists, add the user to favourites using unshift
      user.favourite.unshift(favouriteUserId);
    }

    // Save the updated user
    await user.save();

    return res.status(200).json({
      status: 200,
      message: favIndex !== -1 ? "Favourite removed" : "Favourite added",
    });
  } catch (error) {
    return res.status(500).send({
      status: 500,
      message: error.message, // Changed 'err' to 'error' for consistency
    });
  }
});

router.get("/getData", authMiddleware, async (req, res) => {
  const currentUserId = req.userId;

  try {
    const limit = parseInt(req.query.limit) || 1;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Get current user data
    const user = await User.findById(currentUserId).select("favourite type");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const favouriteIds = user.favourite || [];

    let data = [];
    let totalCount = 0;

    if (user.type === "Nanny") {
      // Fetch favourite jobs from PostJob, and populate user field
      const favouriteJobs = await PostJob.find({ _id: { $in: favouriteIds } })
        .populate({
          path: "user", // populate user data
          select: PUBLIC_USER_SELECT, // Services/utils/userPrivacy.js
        })
        .skip(skip)
        .limit(limit)
        .lean();

      // Add averageRating manually from user.reviews
      const dataWithRating = favouriteJobs.map((job) => {
        const userReviews = job.user?.reviews || [];
        const totalRating = userReviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        const averageRating =
          userReviews.length > 0 ? totalRating / userReviews.length : 0;

        return {
          ...job,
          user: {
            ...toPublicUser(job.user),
            averageRating: parseFloat(averageRating.toFixed(1)), // rounded to 1 decimal
          },
        };
      });
      
      data = dataWithRating;
      totalCount = favouriteIds.length;
    } else {
      // Fetch favourite users. Favouriting someone doesn't entitle you to their
      // contact details or their address — this used to return both.
      const favouriteUsers = await User.find({ _id: { $in: favouriteIds } })
        .select(PUBLIC_USER_SELECT)
        .skip(skip)
        .limit(limit)
        .lean();

      data = toPublicUsers(favouriteUsers);
      totalCount = favouriteIds.length;
    }

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).send({
      status: 200,
      data,
      pagination: {
        totalRecords: totalCount,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (err) {
    return res.status(500).send({
      status: 500,
      message: err.message,
    });
  }
});

export default router;
