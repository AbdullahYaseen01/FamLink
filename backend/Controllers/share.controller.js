import matchRequest from "../Schema/matchRequest.js";
import nannyProfile from "../Schema/nannyProfile.js";
import User from "../Schema/user.js";

export const viewShares = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      minRate = 0,
      maxRate = 50,
      maxAge = 100,
      minAge = 0,
      jobType = [],
      preferredSchedule = [],
      page = 1,
      limit = 10,
      location,
    } = req.body;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const currentUser = await User.findOne({ _id: userId }).select("location type");

    if (!currentUser?.location?.coordinates) {
      return res.status(400).json({ message: "User location not found" });
    }

    const [lng, lat] = currentUser.location.coordinates;
    const radiusInMiles = location ? parseFloat(location) : 5;
    const radiusInKm = radiusInMiles * 1.60934;
    const radiusInRadians = radiusInKm / 6378.1;

    let userQuery = {
      $or: [
        { _id: userId },
        { _id: { $ne: userId }, nannyProfileCompleted: true },
      ],
    };

    if (location) {
      userQuery.location = {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusInRadians],
        },
      };
    }

    const nearbyUsers = await User.find(userQuery, { _id: 1 });
    const nearbyUserIds = nearbyUsers.map((u) => u._id);

    let query = {};

    // Filter by nearby users
    if (nearbyUserIds.length > 0) {
      query.$and = query.$and || [];
      query.$and.push({ userId: { $in: nearbyUserIds } });
    }

    // ── Schedule filter ──────────────────────────────────────────────────────
    if (preferredSchedule.length > 0) {
      const careTypes = preferredSchedule.map((t) => t.toLowerCase());
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { careType: { $in: careTypes } },
          { nannyShareType: { $in: careTypes } },
        ],
      });
    }

    // ── Job type filter ──────────────────────────────────────────────────────
    if (jobType.length > 0) {
      const jobTypeConditions = [];

      if (jobType.includes("Family ● Looking for a share"))
        jobTypeConditions.push({ hasNanny: false });

      if (jobType.includes("Family ● Has a Nanny, Looking for a share"))
        jobTypeConditions.push({ hasNanny: true });

      if (jobType.includes("Nanny ● Looking for a share position"))
        jobTypeConditions.push({ hasFamily: false });

      if (jobType.includes("Nanny ● With a Family, Looking for a share"))
        jobTypeConditions.push({ hasFamily: true });

      if (jobTypeConditions.length > 0) {
        query.$and = query.$and || [];
        query.$and.push({ $or: jobTypeConditions });
      }
    }

    // ── Rate filter ──────────────────────────────────────────────────────────
    if (minRate !== 0 || maxRate !== 50) {
      // ── Rate filter ──────────────────────────────────────────────────────────
      const effectiveMinRate = Number(minRate) || 0;
      const effectiveMaxRate = Number(maxRate) || 999999;

      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          // Family profiles
          {
            "hourlyBudget.minShare": { $lte: effectiveMaxRate },
            "hourlyBudget.maxShare": { $gte: effectiveMinRate },
          },
          // Nanny profiles
          {
            "budget.sharedRate.min": { $lte: effectiveMaxRate },
            "budget.sharedRate.max": { $gte: effectiveMinRate },
          },
          // Profiles with neither field set — always include them
          {
            "hourlyBudget.minShare": { $exists: false },
            "budget.sharedRate.min": { $exists: false },
          },
        ],
      });
    }

    // ── Age filter ───────────────────────────────────────────────────────────
    if (minAge !== 0 || maxAge !== 100) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { "childrenAges.value": { $gte: minAge, $lte: maxAge } },
          { "preferredAges.min": { $lte: maxAge }, "preferredAges.max": { $gte: minAge } },
          // Profiles with no age data — pass through
          {
            "childrenAges": { $size: 0 },
            "preferredAges": { $size: 0 },
          },
        ],
      });
    }

    // ── Fetch all matching profiles ──────────────────────────────────────────
    const allMatchingProfiles = await nannyProfile
      .find(query)
      .populate("userId", "name email goal type imageUrl zipCode location noOfChildren additionalInfo sheetId")
      .sort({ createdAt: -1 });

    // ── Attach match status ──────────────────────────────────────────────────
    const addedMatchStatusProfiles = await Promise.all(
      allMatchingProfiles.map(async (profile) => {
        const match = await matchRequest.findOne({
          senderId: userId,
          receiverId: profile.userId._id,
        });
        return {
          ...profile.toObject(),
          status: match ? match.status : null,
        };
      })
    );

    // ── Paginate ─────────────────────────────────────────────────────────────
    const totalRecords = addedMatchStatusProfiles.length;
    const totalPages = Math.ceil(totalRecords / limitNumber);
    const paginatedData = addedMatchStatusProfiles.slice(skip, skip + limitNumber);

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
    console.error("❌ viewProfiles ERROR:", err.name, err.message);
    console.error(err.stack);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
      stack: err.stack,
    });
  }
};

export const viewUserProfile = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(400).json({ message: "User Id not found" });
    }

    const currentUser = await User.findOne({ _id: userId })

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentUserProfile = await nannyProfile.findOne({ userId: userId }).populate("userId", "name email goal type imageUrl zipCode location noOfChildren additionalInfo sheetId")

    if (!currentUserProfile) {
      return res.status(404).json({ message: "User profile not found" });
    }

    return res.status(200).json({
      status: 200,
      data: currentUserProfile, // ✅ sliced page, not the full array
    });

  } catch (err) {
    console.error("❌ viewUserProfile ERROR:", err.name, err.message);
    console.error(err.stack);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
      stack: err.stack,
    });
  }
};