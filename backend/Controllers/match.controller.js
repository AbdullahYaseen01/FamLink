import matchRequest from "../Schema/matchRequest.js";
import nannyProfile from "../Schema/nannyProfile.js";
import User from "../Schema/user.js";

export const requestMatch = async (req, res) => {
  const { senderId, receiverId, message } = req.body;
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "Access denied" });
    }
    if (!user.nannyProfileCompleted) {
      return res.status(403).json({ message: "Please complete your profile before matching" });
    }
    if ((!user.premium && user.type === "Nanny") || (user.type === "Parents" && user.matchRequestsSent > 0 && !user.premium)) {
      return res.status(403).json({ message: "Free request limit exhausted. Subscribe to keep matching" });
    }
    try {
      const data = await matchRequest.create({ senderId, receiverId, message });
      await User.findByIdAndUpdate(userId, {
        $inc: {
          matchRequestsSent: 1,
        },
      });
      console.log("Data saved and matchrequest incremented")
      return res.status(200).json({
        message: "Request sent successfully",
        data: []
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: err.message,
        stack: err.stack, // ← temporary, remove after fixing
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
      stack: err.stack, // ← temporary, remove after fixing
    });
  }
};

export const getOutgoingRequests = async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);

  const skip = (page - 1) * limit;
  const userId = req.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        message: "Access denied",
      });
    }

    const requests = await matchRequest.find({
      senderId: userId,
    });

    const profiles = await Promise.all(
      requests.map(async (profile) => {
        return await nannyProfile
          .findOne({
            userId: profile.receiverId,
          })
          .populate(
            "userId",
            "name email goal type imageUrl zipCode location"
          );

        return {
          ...nanny.toObject(),
          requestType: "outgoing", // sent by current user
          status: profile.status,
          matchId: profile._id,
          // OR
          // isSender: true
        };
      })
    );

    const filteredProfiles = profiles.filter(Boolean);

    const totalRecords = filteredProfiles.length;
    const totalPages = Math.ceil(totalRecords / limit);

    const paginatedData = filteredProfiles.slice(
      skip,
      skip + limit
    );

    return res.status(200).json({
      status: 200,
      message: "Request success",

      pagination: {
        totalRecords,
        totalPages,
        currentPage: page,
        pageSize: limit,
        hasMore: page < totalPages,
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
};

export const getIncomingRequests = async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const status = req.query.status || "";

  const skip = (page - 1) * limit;
  const userId = req.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        message: "Access denied",
      });
    }

    const requests = await matchRequest.find({
      receiverId: userId,
      // status: status.length > 0 && status
    });

    const profiles = await Promise.all(
      requests.map(async (profile) => {
        const nanny = await nannyProfile
          .findOne({
            userId: profile.senderId,
          })
          .populate(
            "userId",
            "name email goal type imageUrl zipCode location"
          );

        return {
          ...nanny.toObject(),
          requestType: "incoming",
          status: profile.status,
          matchId: profile._id,
        };
      })
    );

    const filteredProfiles = profiles.filter(Boolean);

    const totalRecords = filteredProfiles.length;
    const totalPages = Math.ceil(totalRecords / limit);

    const paginatedData = filteredProfiles.slice(
      skip,
      skip + limit
    );

    return res.status(200).json({
      status: 200,
      message: "Request success",

      pagination: {
        totalRecords,
        totalPages,
        currentPage: page,
        pageSize: limit,
        hasMore: page < totalPages,
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
};

export const acceptIncomingRequest = async (req, res) => {
  const matchId = req.query.matchId;
  const userId = req.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        message: "Access denied",
      });
    }

    const request = await matchRequest.findOne({
      _id: matchId,
      status: "pending",
    });

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    request.status = "accepted";

    await request.save();

    return res.status(200).json({
      message: "Request accepted",
      data: request,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

export const rejectIncomingRequest = async (req, res) => {
  const matchId = req.query.matchId;
  const userId = req.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        message: "Access denied",
      });
    }

    const request = await matchRequest.findOne({
      _id: matchId,
      status: "pending",
    });

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    request.status = "rejected";

    await request.save();

    return res.status(200).json({
      message: "Request accepted",
      data: request,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

export const undoRejectedIncomingRequest = async (req, res) => {
  const matchId = req.query.matchId;
  const userId = req.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        message: "Access denied",
      });
    }

    const request = await matchRequest.findOne({
      _id: matchId,
      status: "rejected",
    });

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    request.status = "pending";

    await request.save();

    return res.status(200).json({
      message: "Request accepted",
      data: request,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

export const getNearbyMatches = async (req, res) => {
  const user = await User.findById(req.params.userId);

  const matches = await User.find({
    type: "Parents",
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: user.location.coordinates,
        },
        $maxDistance: 10000,
      },
    },
  });

  res.json(matches);
};