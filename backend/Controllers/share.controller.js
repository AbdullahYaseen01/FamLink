import matchRequest from "../Schema/matchRequest.js";
import nannyProfile from "../Schema/nannyProfile.js";
import User from "../Schema/user.js";
import { PUBLIC_USER_SELECT, toPublicUser } from "../Services/utils/userPrivacy.js";
import { escapeRegex } from "../Services/utils/adminAuth.js";

// A nanny-share profile as another member may see it: the owner reduced to the
// public projection, and the share token withheld.
//
// The token is the capability behind /share/<token>. It isn't secret in the
// sense a password is, but attaching it to every row of a browse response lets
// one account walk away with a working public link for every member in its
// radius — so it stays with the owner, who gets it from /share/my-link.
const toBrowsableProfile = (profile, extra = {}) => {
  const src = typeof profile?.toObject === "function" ? profile.toObject() : profile;
  const { shareToken: _shareToken, ...rest } = src || {};
  return { ...rest, userId: toPublicUser(src?.userId), ...extra };
};

// Every shape "this profile told us no ages" has ever taken. null covers both a
// null value and a key that was never written at all.
const NO_AGE_DATA = [null, "", []];

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

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // A member browsing before they have given us an address is the normal state
    // between signup and the end of the wizard. The distance filter is the only
    // thing that needs coordinates, so it is the only thing that goes away —
    // dropping the whole response left every new signup reading "no profiles
    // available", which was never true.
    //
    // The projection above names `location` whole, which is what carries the
    // select:false coordinates through. Do NOT "improve" it to
    // `select("location +location.coordinates")` — MongoDB rejects the path
    // collision and 500s the route. See Schema/user.js.
    const coordinates = currentUser.location?.coordinates;
    const hasViewerLocation = Array.isArray(coordinates) && coordinates.length === 2;
    const radiusRequested = Boolean(location);
    const applyRadius = hasViewerLocation && radiusRequested;

    let userQuery = {
      $or: [
        { _id: userId },
        { _id: { $ne: userId }, nannyProfileCompleted: true },
      ],
    };

    if (applyRadius) {
      const [lng, lat] = coordinates;
      const radiusInRadians = (parseFloat(location) * 1.60934) / 6378.1;
      userQuery.location = {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusInRadians],
        },
      };
    }

    const nearbyUsers = await User.find(userQuery, { _id: 1, type: 1 });
    const nearbyUserIds = nearbyUsers.map((u) => u._id);
    // Split nearby users by role. Every profile stores BOTH hasNanny and
    // hasFamily (schema-required), so filtering on the boolean alone would also
    // match the opposite role (e.g. a Nanny profile with hasNanny:false leaking
    // into "Family · Looking for a share"). The job-type filter below scopes each
    // option to the correct role via these id lists.
    const familyUserIds = nearbyUsers
      .filter((u) => u.type === "Parents")
      .map((u) => u._id);
    const nannyUserIds = nearbyUsers
      .filter((u) => u.type === "Nanny")
      .map((u) => u._id);

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
        jobTypeConditions.push({ userId: { $in: familyUserIds }, hasNanny: false });

      if (jobType.includes("Family ● Has a Nanny, Looking for a share"))
        jobTypeConditions.push({ userId: { $in: familyUserIds }, hasNanny: true });

      if (jobType.includes("Nanny ● Looking for a share position"))
        jobTypeConditions.push({ userId: { $in: nannyUserIds }, hasFamily: false });

      if (jobType.includes("Nanny ● With a Family, Looking for a share"))
        jobTypeConditions.push({ userId: { $in: nannyUserIds }, hasFamily: true });

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
          // Profiles with no age data — pass through. This used to test $size: 0,
          // which matches only a field that EXISTS and is an empty array. A nanny
          // looking for a share has no children of her own, so childrenAges is
          // absent from her document rather than empty — the clause never fired and
          // she vanished from every narrowed age search. Legacy saves that wrote ""
          // missed it for the same reason.
          {
            childrenAges: { $in: NO_AGE_DATA },
            preferredAges: { $in: NO_AGE_DATA },
          },
        ],
      });
    }

    // ── Fetch all matching profiles ──────────────────────────────────────────
    // The owner is projected down to what one member may see of another. This
    // used to select `email`, `sheetId` and the whole `location` subdocument —
    // so every browse response carried a contact address and the exact
    // coordinates of the home for every profile on the page.
    const allMatchingProfiles = await nannyProfile
      .find(query)
      .populate("userId", PUBLIC_USER_SELECT)
      .sort({ createdAt: -1 });

    // ── Attach match status ──────────────────────────────────────────────────
    const addedMatchStatusProfiles = await Promise.all(
      allMatchingProfiles.map(async (profile) => {
        const match = await matchRequest.findOne({
          $or: [
            { senderId: userId, receiverId: profile.userId._id },
            { senderId: profile.userId._id, receiverId: userId }
          ]
        });
        return toBrowsableProfile(profile, {
          status: match ? match.status : null,
          matchId: match ? match._id : null,
        });
      })
    );

    // ── Filter Out Requested Profiles ────────────────────────────────────────
    // This removes any profile you have already sent a request to.
    const unmatchedProfiles = addedMatchStatusProfiles.filter(
      (profile) => profile.status === null
    );

    // ── Paginate ─────────────────────────────────────────────────────────────
    const totalRecords = unmatchedProfiles.length;
    const totalPages = Math.ceil(totalRecords / limitNumber);
    const paginatedData = unmatchedProfiles.slice(skip, skip + limitNumber);

    return res.status(200).json({
      status: 200,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: pageNumber,
        pageSize: limitNumber,
      },
      // Whether the distance filter the client asked for was actually honoured,
      // so the dashboard can say "showing all areas" instead of implying the
      // radius held.
      locationFilter: {
        requested: radiusRequested,
        applied: applyRadius,
        viewerHasLocation: hasViewerLocation,
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

    // No profile document is the expected shape of a member who hasn't finished
    // onboarding. This used to answer 404, which made the dashboard retry a
    // resource that was never going to appear and logged an error per attempt
    // for a state that is fine.
    return res.status(200).json({
      status: 200,
      data: currentUserProfile || null,
    });

  } catch (err) {
    console.error("❌ viewUserProfile ERROR:", err.name, err.message);
    console.error(err.stack);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// Admin-only: list every nanny-share profile (family + caregiver) with full details, paginated.
export const viewAllProfilesAdmin = async (req, res) => {
  try {
    const adminUser = await User.findById(req.userId).select("type");
    if (!adminUser || adminUser.type !== "Admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 12, 100);
    const skip = (page - 1) * limit;

    // Filtering runs here rather than in the console, which only ever holds one
    // page. A search applied to the rows already fetched would look like it
    // covered the platform while covering twelve records, so a member on page
    // three would read as "no results" rather than as "not on this page".
    const filter = {};

    const search = (req.query.search || "").trim();
    const role = (req.query.role || "all").trim();

    // Name, email, city and role all live on the referenced user, so both
    // filters resolve through one user query and land as a single id list.
    const userQuery = {};
    if (search) {
      const term = new RegExp(escapeRegex(search), "i");
      userQuery.$or = [
        { name: term },
        { email: term },
        { "location.format_location": term },
      ];
    }
    if (role === "family") userQuery.type = "Parents";
    else if (role === "caregiver") userQuery.type = "Nanny";

    if (Object.keys(userQuery).length > 0) {
      // Capped: an unbounded $in from a broad term builds a query document
      // megabytes wide.
      const matchedUsers = await User.find(userQuery).select("_id").limit(2000).lean();
      filter.userId = { $in: matchedUsers.map((u) => u._id) };
    }

    const shareType = (req.query.shareType || "").trim();
    if (shareType && shareType !== "all") {
      // Families answer `nannyShareType`, caregivers answer `careType`. Matching
      // only the first would drop every caregiver profile from a filtered view.
      filter.$or = [{ nannyShareType: shareType }, { careType: shareType }];
    }

    const [totalRecords, profiles] = await Promise.all([
      nannyProfile.countDocuments(filter),
      nannyProfile
        .find(filter)
        .populate("userId", "name email goal type imageUrl zipCode location noOfChildren additionalInfo sheetId createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      status: 200,
      pagination: {
        totalRecords,
        totalPages: Math.max(Math.ceil(totalRecords / limit), 1),
        currentPage: page,
        pageSize: limit,
      },
      data: profiles,
    });
  } catch (err) {
    console.error("❌ viewAllProfilesAdmin ERROR:", err.name, err.message);
    console.error(err.stack);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// Admin-only: the share types actually present in the data, for the console's
// filter dropdown.
//
// Read from the collection rather than hardcoded, because the questionnaires
// have added types over time and a fixed list silently hides every profile
// posted under one nobody remembered to add here.
export const profileFilterOptionsAdmin = async (req, res) => {
  try {
    const adminUser = await User.findById(req.userId).select("type");
    if (!adminUser || adminUser.type !== "Admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    // Both questionnaires, merged: families answer `nannyShareType`, caregivers
    // answer `careType`, and the console filters on one control.
    const [shareTypes, careTypes] = await Promise.all([
      nannyProfile.distinct("nannyShareType"),
      nannyProfile.distinct("careType"),
    ]);

    const clean = (values) =>
      values.filter((v) => typeof v === "string" && v.trim());

    return res.status(200).json({
      status: 200,
      data: [...new Set([...clean(shareTypes), ...clean(careTypes)])].sort(),
    });
  } catch (err) {
    console.error("❌ profileFilterOptionsAdmin ERROR:", err.name, err.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};