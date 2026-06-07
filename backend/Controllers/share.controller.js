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

    const currentUser = await User.findOne({
      _id: userId,
    }).select("location type");

    if (!currentUser?.location?.coordinates) {
      return res.status(400).json({ message: "User location not found" });
    }

    const [lng, lat] = currentUser.location.coordinates;
    const radiusInMiles = location ? parseFloat(location) : 5;
    const radiusInKm = radiusInMiles * 1.60934;
    const radiusInRadians = radiusInKm / 6378.1;

    let nearbyUsers = null;

    let userQuery = {
      "nannyProfileCompleted": true,
      _id: { $ne: userId },
    };

    if (location) {
      userQuery.location = {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusInRadians],
        },
      };
    }

    nearbyUsers = await User.find(userQuery, { _id: 1 });

    const nearbyUserIds = nearbyUsers.map((u) => u._id);

    let query = {};

    // Filter by nearby users
    if (nearbyUserIds.length > 0) {
      query.$and = query.$and || [];
      query.$and.push({ userId: { $in: nearbyUserIds } });
    }

    // Filter by rate (sharedRate or soloRate)
    // Rates are stored as strings like "40-45" or "25-30"
    // We'll handle this in post-processing since they're ranges stored as strings

    // Filter by careType
    if (preferredSchedule.length > 0) {
      const careTypes = preferredSchedule.map((t) => t.toLowerCase());
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { careType: { $in: careTypes } },
          { nannyShareType: { $in: careTypes.map((t) => `${t} care`) } },
        ],
      });
    }

    // Normalize en-dash to regular hyphen for safe matching
    const AGE_LABEL_MAP = {
      "infants (0-1)": { min: 0, max: 1 },
      "toddlers (1-3)": { min: 1, max: 3 },
      "preschool (3-5)": { min: 3, max: 5 },
      "school-age (5+)": { min: 5, max: Infinity },
    };

    // Parse "2 yrs" or "6 months" into a numeric year value
    function parseChildAge(ageStr) {
      const str = ageStr.toLowerCase().trim();
      const monthMatch = str.match(/(\d+)\s*month/);
      if (monthMatch) return parseInt(monthMatch[1]) / 12;
      const yearMatch = str.match(/(\d+)/);
      if (yearMatch) return parseInt(yearMatch[1]);
      return null;
    }

    // Check if a child's age falls within any of the preferred age ranges
    function childMatchesPreferredAges(childrenAges, preferredAges) {
      if (!preferredAges?.length || !childrenAges?.length) return true;

      const ranges = preferredAges
        .map((label) => AGE_LABEL_MAP[label.toLowerCase()])
        .filter(Boolean);

      if (!ranges.length) return true;

      return childrenAges.some((ageStr) => {
        const age = parseChildAge(ageStr);
        if (age === null) return false;
        return ranges.some(({ min, max }) => age >= min && age < max);
      });
    }


    const allMatchingProfiles = await nannyProfile.find(query)
      .populate("userId", "name email goal type imageUrl zipCode location noOfChildren additionalInfo")
      .sort({ createdAt: -1 });

    // Post-process: filter by preferredAges vs childrenAges
    let fullyFiltered = allMatchingProfiles;

    if (minAge !== 0 || maxAge !== 100) {
      fullyFiltered = fullyFiltered.filter((profile) => {
        const childrenAges = profile.childrenAges ?? [];
        const preferredAges = profile.preferredAges ?? [];

        // Family profile: match via childrenAges
        if (childrenAges.length > 0) {
          return childrenAges.some((ageStr) => {
            const age = parseChildAge(ageStr);
            if (age === null) return false;
            return age >= minAge && age < maxAge;
          });
        }

        // Nanny profile: match via preferredAges
        if (preferredAges.length > 0) {
          return preferredAges.some((label) => {
            // normalize en-dash to hyphen before lookup
            const normalized = label.toLowerCase().replace(/–/g, "-");
            const range = AGE_LABEL_MAP[normalized];
            if (!range) return false;
            return minAge <= range.max && maxAge > range.min;
          });
        }

        // No age info at all — exclude when filter is active
        return false;
      });
    }

    if (jobType.length > 0) {
      fullyFiltered = fullyFiltered.filter((profile) => {
        const goal = profile.userId?.goal;
        const hasNanny = profile.hasNanny?.toLowerCase() ?? "";

        for (const type of jobType) {
          if (type === "Family ● Looking for a share" && hasNanny.includes("no")) return true;
          if (type === "Family ● Has a Nanny, Looking for a share" && hasNanny.includes("yes")) return true;
          if (type === "Nanny ● Looking for a share position" && goal === "Looking for nanny share job") return true;
          if (type === "Nanny ● With a Family, Looking for a share" && goal === "Has a Nanny, Looking for a share") return true;
        }

        return false;
      });
    }

  if (minRate !== 0 || maxRate !== 50) {
  fullyFiltered = fullyFiltered.filter((profile) => {
    const childrenAges = profile.childrenAges ?? [];
    const isFamily = childrenAges.length > 0 || profile.hasNanny;

    if (isFamily) {
      const budget = profile.hourlyBudget;
      if (!budget) return false;
      const budgetMin = typeof budget === "object" ? budget.minShare : null;
      const budgetMax = typeof budget === "object" ? budget.maxShare : null;
      if (budgetMin === null || budgetMax === null) return false;
      return budgetMin <= maxRate && budgetMax >= minRate;
    } else {
      const parseRate = (rateStr) => {
        if (!rateStr) return null;
        const parts = rateStr.split("-").map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          return { min: parts[0], max: parts[1] };
        }
        return null;
      };
      const shared = parseRate(profile.soloRate);
      return shared && shared.min <= maxRate && shared.max >= minRate;
    }
  });
}

    const addedMatchStatusProfiles = await Promise.all(
      fullyFiltered.map(async (profile) => {
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
      data: addedMatchStatusProfiles,
    });
  } catch (err) {
    console.error("❌ viewProfiles ERROR:", err.name, err.message);
    console.error(err.stack);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
      stack: err.stack, // ← temporary, remove after fixing
    });
  }
};