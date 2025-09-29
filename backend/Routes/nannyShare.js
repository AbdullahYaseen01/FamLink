import express from "express";
import NannyShare from "../Schema/nannyShare.js";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";
import User from "../Schema/user.js";
import { geocodeZip } from "../Services/GoogleMapsZipCodeLocator.js";

const router = express.Router();

// POST a new Nanny Share job
// POST a new Nanny Share job
router.post("/", authMiddleware, async (req, res) => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only Parents & Admins can post jobs
    if (!["Parents", "Admin"].includes(user.type)) {
      return res.status(403).json({ message: "Access denied. Unauthorized user." });
    }

    const data = req.body;

    // Validation (basic required fields)
    // const requiredFields = [
    //   "nannyShareType",
    //   "careDescription",
    //   "flexible",
    //   "hosting",
    //   "hourlyRateSplit",
    //   "prefferedCommunication",
    //   "backupAvailable",
    //   "involvement",
    // ];

    // for (const field of requiredFields) {
    //   if (!data[field]) {
    //     return res.status(400).json({ message: `Missing required field: ${field}` });
    //   }
    // }

    const nannySharePost = new NannyShare({
      ...data,
      user: userId,
    });

    await nannySharePost.save();

    res.status(201).json({
      message: "Nanny Share job posted successfully",
      job: nannySharePost,
    });
  } catch (error) {
    console.error("Error posting nanny share:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});


// DELETE a Nanny Share job by ID (only if it belongs to the current user)
router.delete("/:id", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const jobId = req.params.id;

  try {
    const job = await NannyShare.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Nanny Share job not found" });
    }

    // Check if the job belongs to the logged-in user
    if (job.user.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this job" });
    }

    await NannyShare.findByIdAndDelete(jobId);

    res.status(200).json({ message: "Nanny Share job deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

router.patch("/:id", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const jobId = req.params.id;
  const updateData = req.body;

  try {
    const job = await NannyShare.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Nanny Share job not found" });
    }

    // Check ownership
    if (job.user.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this job" });
    }

    // Update only the provided fields
    Object.keys(updateData).forEach((key) => {
      job[key] = updateData[key];
    });

    await job.save();

    const updatedJob = await NannyShare.findById(jobId).populate({
      path: "user",
      select: "email name imageUrl",
    });
    res.status(200).json({
      message: "Nanny Share job updated successfully",
      job: updatedJob,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const {
      minChildren = 1,
      maxChildren = 0,
      minAge = 0,
      maxAge = 0,
      minRate = 0,
      maxRate = 100,
      nannyShareTypes,
      page = 1,
      limit = 10,
      location,
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const currentUser = await User.findById(req.userId).select("location type");

    if (currentUser?.type === "Nanny") {
      return res.status(400).json({ message: "You aren't authorized" });
    }

    if (!currentUser?.location?.coordinates) {
      return res.status(400).json({ message: "User location not found" });
    }

    const [lng, lat] = currentUser.location.coordinates;
    const radiusInMiles = location ? parseFloat(location) : 5;
    const radiusInKm = radiusInMiles * 1.60934;
    const radiusInRadians = radiusInKm / 6378.1;

    // Step 1: Get nearby users
    const nearbyUsers = await User.find({
      location: {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusInRadians],
        },
      },
    }).select("_id");

    const nearbyUserIds = nearbyUsers.map((u) => u._id);

    // Step 2: Get all matching shares (basic DB filter)
    const query = {
      user: { $in: nearbyUserIds },
      $or: [
        {
          "hourlyBudget.min": {
            $exists: true,
            $gte: Number(minRate),
            $lte: Number(maxRate),
          },
        },
        {
          hourlyBudgetSpecify: {
            $exists: true,
            $gte: Number(minRate),
            $lte: Number(maxRate),
          },
        },
      ],
    };

    // ✅ Only apply numberOfChildren filter if both > 0
    if (Number(minChildren) < Number(maxChildren)) {
      query.numberOfChildren = {
        $gte: Number(minChildren),
        $lte: Number(maxChildren),
      };
    }

    const standardTypes = [
      "Full-time care",
      "Part-time care",
      "Pickup/Drop-off (Carpool style)",
      "After-school care",
      "Summer/Seasonal",
    ];

    if (Array.isArray(nannyShareTypes) && nannyShareTypes.length > 0) {
      const filters = [];

      // Include standard types selected
      const selectedStandard = nannyShareTypes.filter((type) =>
        standardTypes.includes(type)
      );
      if (selectedStandard.length > 0) {
        filters.push({ nannyShareType: { $in: selectedStandard } });
      }

      // Include "Other" if selected
      if (nannyShareTypes.includes("Other")) {
        filters.push({ nannyShareType: { $nin: standardTypes } });
      }

      // Apply the filter using $or
      if (filters.length > 0) {
        query.$and = query.$and || [];
        query.$and.push({ $or: filters });
      }
    }


    const allMatchingShares = await NannyShare.find(query)
      .populate("user", "name email imageUrl zipCode location")
      .sort({ createdAt: -1 });


    // Step 3: Filter by children's ages
    let fullyFiltered = allMatchingShares;

    // ✅ Only apply children age filter if both minAge & maxAge > 0
    if (Number(maxAge) > 0) {
      fullyFiltered = allMatchingShares.filter((share) => {
        if (!share.childrenAges || share.childrenAges.length === 0) return false;

        // Convert ["2 yrs", "5 yrs"] → [2, 5]
        const parsedAges = share.childrenAges
          .map((ageStr) => {
            const match = ageStr.match(/(\d+(\.\d+)?)/); // match integer or decimal
            return match ? Number(match[1]) : null;
          })
          .filter((n) => n !== null);

        if (parsedAges.length === 0) return false;

        return parsedAges.some(
          (age) => age >= Number(minAge) && age <= Number(maxAge)
        );

      });
    }


    const totalRecords = fullyFiltered.length;
    const totalPages = Math.ceil(totalRecords / limitNumber);
    const paginatedData = fullyFiltered.slice(skip, skip + limitNumber);

    return res.status(200).json({
      status: 200,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: pageNumber,
        pageSize: limitNumber,
      },
      data: paginatedData,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});


router.get("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const nannyShare = await NannyShare.findById(id).populate({
      path: "user",
      select: "email name imageUrl location createdAt", // only include these fields
    });

    if (!nannyShare) {
      return res.status(404).json({ message: "Job not found" });
    }

    return res.status(200).json({ data: nannyShare });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

router.get("/nanny-share-opportunities/:zipCode", async (req, res) => {
  const { zipCode } = req.params;

  try {
    // Step 1: Get coordinates for the zip code (you need a geocode function or mapping)
    const zipCoordinates = await geocodeZip(zipCode);
    if (!zipCoordinates) {
      return res.status(400).json({ status: 400, message: "Invalid zip code" });
    }

    const radiusInMeters = 50 * 1609.34; // 50 miles

    // Step 2: Find users within 50 miles
    const users = await User.find({
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [zipCoordinates.lng, zipCoordinates.lat],
          },
          $maxDistance: radiusInMeters,
        },
      },
    }).select("_id name email imageUrl zipCode location");

    if (!users.length) {
      return res.status(200).json({ status: 200, data: [] });
    }

    const userIds = users.map((u) => u._id);

    // Step 3: Fetch nanny share posts
    const nannyShares = await NannyShare.find({ user: { $in: userIds } })
      .populate("user", "name email imageUrl zipCode location")
      .sort({ createdAt: -1 });

    return res.status(200).json({ status: 200, data: nannyShares });
  } catch (err) {
    console.error("Error fetching nanny share opportunities:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});




export default router;
