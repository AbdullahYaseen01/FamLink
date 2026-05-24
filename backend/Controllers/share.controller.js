import nannyProfile from "../Schema/nannyProfile.js";
import User from "../Schema/user.js";

export const viewShares = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      minRate = 0,
      maxRate = 100,
      careType,
      preferredAges,
      certifications,
      childrenCapacity,
      hasTransport,
      multiFamilyComfort,
      backgroundCheck,
      careExperience,
      careDistance,
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
    if (nearbyUserIds) {
      query.$and = query.$and || [];
      query.$and.push({ userId: { $in: nearbyUserIds } });
    }

    // Filter by rate (sharedRate or soloRate)
    // Rates are stored as strings like "40-45" or "25-30"
    // We'll handle this in post-processing since they're ranges stored as strings

    // Filter by careType
    if (careType) {
      const careTypes = Array.isArray(careType) ? careType : [careType];
      query.$and = query.$and || [];
      query.$and.push({
        careType: { $in: careTypes.map((t) => t.toLowerCase()) },
      });
    }

    // Filter by certifications
    if (certifications) {
      const certList = Array.isArray(certifications)
        ? certifications
        : [certifications];
      query.$and = query.$and || [];
      query.$and.push({
        certifications: { $all: certList.map((c) => c.toLowerCase()) },
      });
    }

    // Filter by preferredAges
    if (preferredAges) {
      const ageList = Array.isArray(preferredAges)
        ? preferredAges
        : [preferredAges];
      query.$and = query.$and || [];
      query.$and.push({
        preferredAges: { $in: ageList },
      });
    }

    // Filter by childrenCapacity e.g. "2-3"
    if (childrenCapacity) {
      query.childrenCapacity = childrenCapacity;
    }

    // Filter by hasTransport
    if (hasTransport) {
      query.hasTransport = hasTransport.toLowerCase();
    }

    // Filter by multiFamilyComfort
    if (multiFamilyComfort) {
      query.multiFamilyComfort = multiFamilyComfort.toLowerCase();
    }

    // Filter by backgroundCheck
    if (backgroundCheck) {
      query.backgroundCheck = backgroundCheck.toLowerCase();
    }

    // Filter by careExperience e.g. "1-3 years"
    if (careExperience) {
      query.careExperience = careExperience;
    }

    // Filter by careDistance e.g. "3-5 miles"
    if (careDistance) {
      query.careDistance = careDistance;
    }

    const allMatchingProfiles = await nannyProfile.find(query)
      .populate("userId", "name email goal type imageUrl zipCode location")
      .sort({ createdAt: -1 });

    // Post-process: filter by rate range (sharedRate / soloRate stored as "40-45")
    let fullyFiltered = allMatchingProfiles;

    // if (Number(minRate) > 0 || Number(maxRate) < 100) {
    //   fullyFiltered = allMatchingProfiles.filter((profile) => {
    //     const rateFields = [profile.sharedRate, profile.soloRate].filter(Boolean);

    //     return rateFields.some((rateStr) => {
    //       // Parse "40-45" → min: 40, max: 45
    //       const parts = rateStr.split("-").map((p) => parseFloat(p.trim()));
    //       if (parts.length === 2) {
    //         const [rMin, rMax] = parts;
    //         // Overlaps with the requested range
    //         return rMax >= Number(minRate) && rMin <= Number(maxRate);
    //       }
    //       // Single value like "30"
    //       if (parts.length === 1) {
    //         return parts[0] >= Number(minRate) && parts[0] <= Number(maxRate);
    //       }
    //       return false;
    //     });
    //   });
    // }

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