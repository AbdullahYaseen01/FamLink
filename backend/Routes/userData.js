import express from "express";
import User from "../Schema/user.js";
import NannyProfile from "../Schema/nannyProfile.js";
import { authMiddleware } from "../Services/utils/middlewareAuth.js";
import {
  PUBLIC_LOCATION_PATHS,
  PUBLIC_USER_FIELDS,
  PUBLIC_USER_SELECT,
  SELF_USER_SELECT,
  toPublicUser,
  toPublicUsers,
} from "../Services/utils/userPrivacy.js";

const router = express.Router();

// Inclusion projection for the aggregation pipeline below. $project can't mix
// include and exclude, and the whole point of this change is that browse
// results are a whitelist, so build it from the same field list the rest of the
// API uses — with the address named subpath by subpath, so `coordinates` is
// never read (see PUBLIC_LOCATION_PATHS).
const PUBLIC_USER_PROJECTION = Object.fromEntries(
  [
    ...PUBLIC_USER_FIELDS.filter((field) => field !== "location"),
    ...PUBLIC_LOCATION_PATHS,
  ].map((field) => [field, 1])
);

router.get("/getAllData", authMiddleware, async (req, res) => {
  const id = req.userId;

  try {
    // Fetch the current user's location
    const currentUser = await User.findById(id).select("location +location.coordinates");
    if (
      !currentUser ||
      !currentUser.location ||
      !currentUser.location.coordinates
    ) {
      return res.status(400).send({
        status: 400,
        message: "Current user location not found or invalid.",
      });
    }

    const { coordinates } = currentUser.location; // Extract user's coordinates
    const [lng, lat] = coordinates; // [longitude, latitude]

    // Set default values for limit and page if not provided
    const limit = parseInt(req.query.limit) || 10; // Default limit is 10
    const page = parseInt(req.query.page) || 1; // Default page is 1
    const skip = (page - 1) * limit; // Calculate the number of records to skip

    const userType = req.query.userType || "Nanny"; // Default user type is 'Nanny'

    // Radius in radians (5000 miles = ~8046.72 kilometers; radius in radians = km / 6378.1)
    const radius = 3218.69 / 6378.1;

    // Query for users within the specified radius
    const users = await User.find({
      type: userType,
      location: {
        $geoWithin: {
          $centerSphere: [[lng, lat], radius],
        },
      },
    })
      .select(PUBLIC_USER_SELECT) // Whitelist — see Services/utils/userPrivacy.js
      .skip(skip) // Pagination: Skip records
      .limit(limit) // Pagination: Limit records per page
      .lean(); // Convert the result to plain JS objects

    // Count total users matching the query (ignoring skip/limit for pagination metadata)
    const totalCount = await User.countDocuments({
      type: userType,
      location: {
        $geoWithin: {
          $centerSphere: [[lng, lat], radius],
        },
      },
    });

    const totalPages = Math.ceil(totalCount / limit); // Calculate total pages

    // Respond with the paginated user list and metadata
    return res.status(200).send({
      status: 200,
      // The select above already dropped the private fields; this coarsens the
      // location so browse results carry an area, never a doorstep.
      message: toPublicUsers(users),
      pagination: {
        totalRecords: totalCount, // Total number of matching records
        totalPages, // Total number of pages
        currentPage: page, // Current page number
        limit, // Records per page
      },
    });
  } catch (err) {
    // Handle errors
    return res.status(500).send({
      status: 500,
      message: err.message,
    });
  }
});

// List of valid position options for filtering
const allOptions = [
  "nanny",
  "privateEducator",
  "specializedCaregiver",
  "sportsCoaches",
  "musicInstructor",
  "swimInstructor",
  "houseManager",
  "babysitter",
];


// DELETE /users/:userId
//
// This had no auth of any kind: an unauthenticated DELETE against a guessed or
// scraped id deleted that account, and the response handed back the deleted
// document — password hash, reset token and all. Now you must be signed in, and
// you may only delete your own account unless you are an Admin. The deleted
// record is not echoed back; the caller already knows which id they removed.
router.delete("/users/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    const requester = await User.findById(req.userId).select("type");
    if (!requester) {
      return res.status(401).json({ message: "Access denied." });
    }

    const isSelf = String(userId) === String(req.userId);
    if (!isSelf && requester.type !== "Admin") {
      return res
        .status(403)
        .json({ message: "You can only delete your own account." });
    }

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ message: "Server error." });
  }
});


// "First L." — the caregiver preview on the marketing homepage is served to
// logged-out visitors, so a full legal name next to a zip code, an hourly rate
// and an availability window is a stranger being able to identify a specific
// caregiver without ever creating an account. Signing in shows the full name.
const maskedName = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A caregiver";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
};

router.get('/service-providers/:zipCode', async (req, res) => {
  const { zipCode } = req.params;

  try {
    // Only the fields the formatter below reads. This used to fetch whole user
    // documents on a public, unauthenticated route.
    const users = await User.find({
      zipCode,
      type: "Nanny",
      status: "Active",
    }).select("name additionalInfo reviews");

    const formatted = [];

    for (const user of users) {

      const positionInfo = user.additionalInfo?.find(
        (info) => info.key === "interestedPosi"
      );

      if (!positionInfo || !Array.isArray(positionInfo.value.option)) continue;


      const positions = positionInfo.value.option.filter((pos) =>
        allOptions.includes(pos)
      );


      if (positions.length === 0) continue;

      const salaryExp = user.additionalInfo?.find((info) => info.key === "salaryExp")?.value;

      const minMaxRate = (() => {
        if (!salaryExp || typeof salaryExp !== "object") return null;

        const rates = Object.values(salaryExp)
          .map((val) => parseFloat(val))
          .filter((val) => !isNaN(val));

        if (rates.length === 0) return null;

        const min = Math.min(...rates);
        const max = Math.max(...rates);
        return `$${min} - $${max}/hour`;
      })();


      for (const role of positions) {

        formatted.push({
          name: maskedName(user.name),
          role: roleDisplay(role),
          rating: user.reviews?.length > 0
            ? Number(
              (
                user.reviews.reduce((sum, r) => sum + r.rating, 0) /
                user.reviews.length
              ).toFixed(1)
            )
            : 5,
          rate:
            minMaxRate ||
            "$25/hour",
          availability:
            user.additionalInfo?.find((info) => info.key === "avaiForWorking")
              ?.value || "Availability not specified",
          experience:
            user.additionalInfo?.find((info) => info.key === "experience")
              ?.value || "Experience not specified",
          description: user.additionalInfo?.find((info) => info.key === "jobDescription")?.value || "No description provided.",
          service: roleService(role),
          cta: roleCTA(role),
        });
      }
    }

    return res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Error fetching service providers:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", error });
  }
});

// Helpers
function roleDisplay(role) {
  const map = {
    nanny: "Nanny",
    privateEducator: "Private Educator",
    specializedCaregiver: "Specialized Caregiver",
    sportsCoaches: "Sports Coach",
    musicInstructor: "Music Instructor",
    swimInstructor: "Swim Instructor",
    houseManager: "House Manager",
    babysitter: "Babysitter",
  };
  return map[role] || "Service Provider";
}

function roleService(role) {
  const map = {
    nanny: "Full-time childcare",
    privateEducator: "Academic instruction",
    specializedCaregiver: "Care for special needs",
    sportsCoaches: "Sports training",
    musicInstructor: "Music education",
    swimInstructor: "Swimming lessons",
    houseManager: "Household management",
    babysitter: "Part-time childcare",
  };
  return map[role] || "General support";
}

function roleCTA(role) {
  if (role === "musicInstructor" || role === "privateEducator") {
    return "View Teaching Profile";
  }
  return "View Full Profile";
}

router.get("/getFiltered", authMiddleware, async (req, res) => {
  const id = req.userId;

  try {
    const currentUser = await User.findById(id).select("location zipCode +location.coordinates");
    if (!currentUser) {
      return res.status(404).send({
        status: 404,
        message: "Current user not found.",
      });
    }

    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const {
      avaiForWorking,
      ageGroupsExp,
      interestedPosi,
      salaryRange,
      location,
      start,
    } = req.query;

    const userType = req.query.userType || "Nanny";
    const radiusInMiles = location ? parseFloat(location) : 5;
    const radiusInKm = radiusInMiles * 1.60934;
    const radius = radiusInKm / 6378.1;

    const matchStage = { type: userType };
    const additionalInfoFilters = [];

    if (salaryRange && salaryRange.length === 2) {
      const [minSalary, maxSalary] = salaryRange.map(Number);
      if (!isNaN(minSalary) && !isNaN(maxSalary)) {
        additionalInfoFilters.push({
          key: "salaryRange",
          $and: [
            { "value.min": { $gte: minSalary } },
            { "value.max": { $lte: maxSalary } },
          ],
        });
      }
    }

    if (avaiForWorking) {
      additionalInfoFilters.push({
        key: userType === "Parents" ? "preferredSchedule" : "avaiForWorking",
        "value.option": { $in: avaiForWorking.split(",").map((a) => a.trim()) },
      });
    }

    if (start) {
      additionalInfoFilters.push({
        key: "start",
        "value.option": { $in: start.split(",").map((a) => a.trim()) },
      });
    }

    if (ageGroupsExp) {
      additionalInfoFilters.push({
        key: "ageGroupsExp",
        "value.option": {
          $in: ageGroupsExp.split(",").map((exp) => exp.trim()),
        },
      });
    }

    if (interestedPosi) {
      additionalInfoFilters.push({
        key: userType === "Parents" ? "additionalServices" : "interestedPosi",
        "value.option": {
          $in: interestedPosi.split(",").map((pos) => pos.trim()),
        },
      });
    }

    if (additionalInfoFilters.length > 0) {
      matchStage.$and = additionalInfoFilters.map((filter) => ({
        additionalInfo: { $elemMatch: filter },
      }));
    }

    // Geospatial or zip fallback
    if (currentUser?.location?.coordinates?.length === 2) {
      const [lng, lat] = currentUser.location.coordinates;
      matchStage.location = {
        $geoWithin: {
          $centerSphere: [[lng, lat], radius],
        },
      };
    } else if (currentUser?.zipCode) {
      matchStage.zipCode = currentUser.zipCode;
    } else {
      return res.status(400).send({
        status: 400,
        message: "User must have either location coordinates or a zip code.",
      });
    }

    const users = await User.aggregate([
      { $match: matchStage },
      { $skip: skip },
      { $limit: limit },
      // Whitelist, not blacklist: the old exclusion list let email, phoneNo,
      // dob, stripeId and the exact home coordinates through to every browsing
      // member. See Services/utils/userPrivacy.js.
      { $project: PUBLIC_USER_PROJECTION },
    ]);

    const totalCount = await User.countDocuments(matchStage);
    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).send({
      status: 200,
      message: toPublicUsers(users),
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
      message: "Server error while fetching filtered users.",
      error: err.message,
    });
  }
});

router.get("/getUserById/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select("name profilePic imageUrl type")
      .lean();

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: user,
    });
  } catch (err) {
    return res.status(500).json({
      status: 500,
      message: "Error fetching user",
      error: err.message,
    });
  }
});

router.get("/count/perType", async (req, res) => {                        // ** come back to it later
  try {
    const familyCount = await User.countDocuments({ type: "Parents" });
    const nannyCount = await User.countDocuments({ type: "Nanny" });
    return res.status(200).json({ familyCount, nannyCount });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
})

// The member profile page.
//
// This was unauthenticated and served the entire user document: anyone who
// could guess or scrape an ObjectId got that person's email, phone number, date
// of birth, Stripe customer id and the exact lat/lng of their home. It now
// requires a signed-in caller and returns the public projection only.
router.get("/getById/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params; // Extract the ID from the request parameters

    const user = await User.findById(id)
      .select(PUBLIC_USER_SELECT)
      .populate({
        path: "reviews.userId", // Populate the userId in reviews
        select: "name imageUrl", // Only fetch name and imageUrl fields for the reviewer
      })
      .lean(); // Optional: convert the result to plain JS objects

    // Check if the user was found
    if (!user) {
      return res.status(404).send({
        status: 404,
        message: "User not found",
      });
    }

    // Fetch the detailed profile from the new NannyProfile schema
    const nannyProfile = await NannyProfile.findOne({ userId: id }).lean();

    const totalRating = user.reviews.reduce(
      (acc, review) => acc + review.rating,
      0
    );
    const averageRating =
      user.reviews.length > 0
        ? (totalRating / user.reviews.length).toFixed(1)
        : 0;
    // Send the found user along with their dedicated profile data
    return res.status(200).send({
      status: 200,
      message: {
        ...toPublicUser(user), // coarsens location on top of the select above
        nannyProfile: nannyProfile || null, // Attach the new profile data!
        averageRating, // Include the average rating at the end
      },
    });
  } catch (err) {
    return res.status(500).send({
      status: 500,
      message: err.message,
    });
  }
});

router.get("/top-users", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.type !== "Admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Aggregation to compute avgRating and reviewCount for Nannies
    const topNannies = await User.aggregate([
      {
        $match: {
          type: "Nanny",
          "reviews.0": { $exists: true },
        },
      },
      {
        $addFields: {
          avgRating: { $avg: "$reviews.rating" },
          reviewCount: { $size: "$reviews" },
        },
      },
      { $sort: { avgRating: -1, reviewCount: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 1,
          name: 1,
          imageUrl: 1,
          avgRating: 1,
          reviewCount: 1,
        },
      },
    ]);

    const topParents = await User.aggregate([
      {
        $match: {
          type: "Parents",
          "reviews.0": { $exists: true },
        },
      },
      {
        $addFields: {
          avgRating: { $avg: "$reviews.rating" },
          reviewCount: { $size: "$reviews" },
        },
      },
      { $sort: { avgRating: -1, reviewCount: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 1,
          name: 1,
          imageUrl: 1,
          avgRating: 1,
          reviewCount: 1,
        },
      },
    ]);

    // Format function
    const formatUser = (user) => {
      const [firstName, ...rest] = user.name.split(" ");
      return {
        id: user._id,
        firstName,
        lastName: rest.join(" ") || "",
        profileImage: user.imageUrl,
        avgRating: user.avgRating || 0,
        reviewCount: user.reviewCount || 0,
      };
    };

    return res.status(200).json({
      topNannies: topNannies.map(formatUser),
      topParents: topParents.map(formatUser),
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch top users",
      error: err.message,
    });
  }
});

router.get("/families", authMiddleware, async (req, res) => {
  try {
    // Ensure only admins can access this route
    const user = await User.findById(req.userId);
    if (!user || user.type !== "Admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    // Pagination setup
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const query = { type: "Parents" };

    // Fetch paginated families
    const families = await User.find(query)
      .select(`${SELF_USER_SELECT} -notifications -__v`)
      .sort({ createdAt: -1 }) // 🆕 sort most recent first
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await User.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Format families into the frontend Users interface
    const formatted = families.map((family) => {
      const [firstName = "", ...rest] = family.name?.split(" ") ?? [];
      const lastName = rest.join(" ");
      const cityStateParts = family.location?.format_location?.split(", ") ?? [];

      const avgRating =
        family.reviews?.length > 0
          ? family.reviews.reduce((acc, r) => acc + r.rating, 0) / family.reviews.length
          : 0;

      return {
        id: family._id,
        username: family.email.split("@")[0],
        email: family.email,
        firstName,
        lastName,
        role: "Parents",
        profileImage: family.imageUrl || null,
        phone: family.phoneNo || "",
        city: cityStateParts[cityStateParts.length - 3] || "",
        state: cityStateParts[cityStateParts.length - 2] || "",
        hourlyRate: undefined,
        bio: family.aboutMe || "",
        avgRating: parseFloat(avgRating.toFixed(1)),
        totalReviews: family.reviews?.length || 0,
        isVerifiedEmail: family.verified?.emailVer || false,
        isVerifiedID: family.verified?.nationalIDVer === "true",
        isActive: family.status === "Active",
        createdAt: family.createdAt,
        online: family.online
      };
    });

    return res.status(200).json({
      data: formatted,
      pagination: {
        totalRecords: totalCount,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch families",
      error: error.message,
    });
  }
});


router.get("/nannies", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.type !== "Admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const query = { type: 'Nanny' };

    const nannies = await User.find(query)
      .select(`${SELF_USER_SELECT} -notifications -__v`) // sanitize
      .sort({ createdAt: -1 }) // 🆕 sort most recent first
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await User.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Transform MongoDB User -> Frontend Nanny interface
    const formatted = nannies.map((nanny) => {
      const [firstName, ...rest] = nanny.name?.split(" ") ?? [];
      const lastName = rest.join(" ");
      const cityState = nanny.location?.format_location?.split(", ") ?? [];
      const avgRating = nanny.reviews.length > 0
        ? nanny.reviews.reduce((sum, r) => sum + r.rating, 0) / nanny.reviews.length
        : 0;

      return {
        id: nanny._id,
        username: nanny.email.split("@")[0],
        email: nanny.email,
        firstName,
        lastName,
        role: "Nanny",
        profileImage: nanny.imageUrl || null,
        phone: nanny.phoneNo || "",
        city: cityState[cityState.length - 3] || "",
        state: cityState[cityState.length - 2] || "",
        hourlyRate: undefined, // you can derive this from additionalInfo if needed
        bio: nanny.additionalInfo.find(info => info.key === "jobDescription").value || "",
        avgRating: avgRating,
        totalReviews: nanny.reviews.length,
        isVerifiedEmail: nanny.verified?.emailVer || false,
        isVerifiedID: nanny.verified?.nationalIDVer === "true",
        isActive: nanny.status === "Active",
        createdAt: nanny.createdAt,
        additionalInfo: nanny.additionalInfo,
        online: nanny.online,
        premium:nanny.premium,
        ActiveAt: nanny.ActiveAt,
        dob: nanny.dob
      };
    });

    res.status(200).json({
      data: formatted,
      pagination: {
        totalRecords: totalCount,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch users",
      error: error.message,
    });
  }
});


router.get("/getAllData/admin", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the logged-in user is an admin
    if (user.type !== "Admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Only Admins can get data." });
    }

    const limit = parseInt(req.query.limit) || 10; // Default limit is 10
    const page = parseInt(req.query.page) || 1; // Default page is 1
    const skip = (page - 1) * limit; // Calculate the number of records to skip

    const userType = req.query.userType || null; // Get userType from query, default is null

    // Query to exclude admins and filter by userType if provided
    const query = {};
    if (userType) {
      query.type = userType;
    } else {
      query.type = { $ne: "Admin" }; // Exclude admins
    }

    // Fetch users with pagination
    const users = await User.find(query)
      .select(SELF_USER_SELECT) // Admin console: everything but the credentials
      .skip(skip) // Pagination: Skip records
      .limit(limit) // Pagination: Limit records per page
      .lean(); // Convert the result to plain JS objects

    // Count total users matching the query (ignoring skip/limit for pagination metadata)
    const totalCount = await User.countDocuments(query);

    const totalPages = Math.ceil(totalCount / limit); // Calculate total pages

    // Respond with the paginated user list and metadata
    return res.status(200).send({
      status: 200,
      data: users,
      pagination: {
        totalRecords: totalCount, // Total number of matching records
        totalPages, // Total number of pages
        currentPage: page, // Current page number
        limit, // Records per page
      },
    });
  } catch (err) {
    // Handle errors
    return res.status(500).send({
      status: 500,
      message: err.message,
    });
  }
});

router.get("/getById/admin/:id", authMiddleware, async (req, res) => {
  try {
    const adminId = req.userId; // Extract admin ID from auth middleware
    const { id } = req.params; // Extract the user ID from route parameters

    // Find the admin user
    const adminUser = await User.findById(adminId);
    if (!adminUser) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Ensure the logged-in user is an admin
    if (adminUser.type !== "Admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Only Admins can access user data." });
    }

    // Find the user by ID, excluding sensitive fields
    const user = await User.findById(id)
      .select(SELF_USER_SELECT) // Admin console: everything but the credentials
      .lean(); // Convert to plain JS object for easier manipulation

    // If user not found, return 404
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Respond with the user's details
    return res.status(200).json({
      status: 200,
      data: user,
      message: "user edit sucessfully",
    });
  } catch (err) {
    // Handle server errors
    return res.status(500).json({
      status: 500,
      message: err.message,
    });
  }
});

export default router;
