import mongoose from "mongoose";
import matchRequest from "../Schema/matchRequest.js";
import nannyProfile from "../Schema/nannyProfile.js";
import User from "../Schema/user.js";
import Chat from "../Schema/chat.js";
import { sendMatchRequestEmail, sendMatchAcceptedEmail } from "../Services/email/email.js";
import { hasActiveReferralMatching } from "../Services/utils/referral.js";
import {
  PUBLIC_USER_SELECT,
  toPublicUser,
  toPublicUsers,
} from "../Services/utils/userPrivacy.js";

// A match-request row as the other party may see it. Accepting a request opens
// an in-app chat — it does not hand over a contact address — so the owner is
// reduced to the public projection here too, and the share token stays private.
const toMatchCard = (profileDoc, extra) => {
  const src = typeof profileDoc?.toObject === "function" ? profileDoc.toObject() : profileDoc;
  const { shareToken: _shareToken, ...rest } = src || {};
  return { ...rest, userId: toPublicUser(src?.userId), ...extra };
};

// Compose a short "2 children · Full-time · Looking for nanny" summary for the
// sender/match cards in match emails, from whatever profile fields are present.
const buildProfileSummary = (profile, user) => {
  const parts = [];
  const num = profile?.numberOfChildren ?? user?.noOfChildren;
  const n = typeof num === "number" ? num : parseInt(num, 10);
  if (n && !Number.isNaN(n)) parts.push(`${n} ${n === 1 ? "child" : "children"}`);
  if (profile?.nannyShareType) parts.push(profile.nannyShareType);
  if (profile?.hasNanny != null)
    parts.push(profile.hasNanny ? "Has a nanny" : "Looking for nanny");
  return parts.join(" · ") || undefined;
};

// Idempotently return (or create) the 1:1 chat between two users. Mirrors the
// logic in Routes/chat.js POST "/" so an accepted match instantly becomes an
// active conversation instead of waiting for the user to click "Open chat".
const getOrCreateChat = async (userIdA, userIdB) => {
  const participants = [userIdA, userIdB]
    .map((p) => new mongoose.Types.ObjectId(p))
    .sort();

  const existingChat = await Chat.findOne({
    participants: { $all: participants, $size: participants.length },
  });

  if (existingChat) return existingChat;

  return Chat.create({ participants });
};

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
    const famAuto = req.body?.source === "fam";
    if (!famAuto && user.type === "Parents" && user.matchRequestsSent > 0 && !user.premium) {
      return res.status(403).json({ message: "Free request limit exhausted. Subscribe to keep matching" });
    }

    // Caregivers looking for a share position pay nothing — they keep matching
    // by referring a friend. Same shape as the family paywall above (one free
    // request, then a gate), redeemed with a referral month instead of a card.
    // `premium` still passes: a caregiver who did subscribe isn't sent back to
    // the referral wall.
    if (!famAuto && user.type === "Nanny" && !user.premium) {
      const senderProfile = await nannyProfile
        .findOne({ userId })
        .select("hasFamily")
        .lean();

      // hasFamily may be a boolean or the string "true"/"false" depending on how
      // the profile was saved, so normalise before deciding. A caregiver looking
      // for a share job (hasFamily false) is the referral audience: one free
      // match, then the referral wall.
      const hasFamily =
        senderProfile?.hasFamily === true || senderProfile?.hasFamily === "true";
      const isJobSeekingCaregiver = senderProfile != null && !hasFamily;

      if (
        isJobSeekingCaregiver &&
        user.matchRequestsSent > 0 &&
        !hasActiveReferralMatching(user)
      ) {
        return res.status(403).json({
          // The frontend switches on this to show the referral modal rather
          // than the subscribe modal — the message alone would be too brittle.
          code: "REFERRAL_REQUIRED",
          message:
            "Free match used. Refer a friend to unlock another month of matching",
        });
      }
    }

    try {
      const data = await matchRequest.create({ senderId, receiverId, message });
      await User.findByIdAndUpdate(userId, {
        $inc: {
          matchRequestsSent: 1,
        },
      });
      console.log("Data saved and matchrequest incremented")

      // Notify the receiver about the new match request (non-blocking)
      try {
        const receiver = await User.findById(receiverId).select("email name");
        if (receiver?.email) {
          const senderProfile = await nannyProfile
            .findOne({ userId })
            .lean()
            .catch(() => null);
          const senderInfo = {
            id: String(user._id),
            name: user.name,
            location:
              user.location?.neighborhood || user.location?.city || undefined,
            summary: buildProfileSummary(senderProfile, user),
          };
          sendMatchRequestEmail(receiver.email, receiver.name, senderInfo).catch(
            (err) => console.error("Failed to send match-request email:", err)
          );
        }
      } catch (e) {
        console.error("match-request email lookup failed:", e);
      }

      return res.status(200).json({
        message: "Request sent successfully",
        data: []
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: err.message,
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
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
        const nanny = await nannyProfile
          .findOne({
            userId: profile.receiverId,
          })
          .populate("userId", PUBLIC_USER_SELECT);

        if (!nanny) return null;

        return toMatchCard(nanny, {
          requestType: "outgoing", // sent by current user
          status: profile.status,
          matchId: profile._id,
        });
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
          .populate("userId", PUBLIC_USER_SELECT);

        if (!nanny) return null;

        return toMatchCard(nanny, {
          requestType: "incoming",
          status: profile.status,
          matchId: profile._id,
        });
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
    // Stamped here rather than derived later: status is mutated in place, so
    // this is the only moment the response time is knowable.
    request.respondedAt = new Date();

    await request.save();

    // Create the conversation immediately on acceptance so both users see it in
    // their active conversations / Messages count without needing to click
    // "Open chat" first (non-blocking — acceptance still succeeds if this fails).
    try {
      await getOrCreateChat(request.senderId, request.receiverId);
    } catch (e) {
      console.error("Failed to create chat on match acceptance:", e);
    }

    // Notify the original sender that their request was accepted (non-blocking)
    try {
      const sender = await User.findById(request.senderId).select("email name");
      if (sender?.email) {
        const accepterProfile = await nannyProfile
          .findOne({ userId })
          .lean()
          .catch(() => null);
        const matchInfo = {
          id: String(user._id),
          name: user.name,
          location:
            user.location?.neighborhood || user.location?.city || undefined,
          summary: buildProfileSummary(accepterProfile, user),
        };
        sendMatchAcceptedEmail(
          sender.email,
          sender.name,
          user.name,
          matchInfo
        ).catch((err) =>
          console.error("Failed to send match-accepted email:", err)
        );
      }
    } catch (e) {
      console.error("match-accepted email lookup failed:", e);
    }

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
    request.respondedAt = new Date();

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

// Block a matched profile. Either participant may block; the conversation
// becomes unavailable until the blocker unblocks.
export const blockMatch = async (req, res) => {
  const matchId = req.query.matchId;
  const userId = req.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        message: "Access denied",
      });
    }

    const request = await matchRequest.findById(matchId);

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    // Only a participant of the match may block it.
    const isParticipant =
      String(request.senderId) === String(userId) ||
      String(request.receiverId) === String(userId);

    if (!isParticipant) {
      return res.status(403).json({
        message: "Not allowed",
      });
    }

    request.status = "blocked";
    request.blockedBy = userId;

    await request.save();

    return res.status(200).json({
      message: "Profile blocked",
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

// Unblock a previously blocked profile — only the user who blocked can undo it.
// Restores the match to "accepted" so the conversation resumes.
export const unblockMatch = async (req, res) => {
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
      status: "blocked",
    });

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    if (String(request.blockedBy) !== String(userId)) {
      return res.status(403).json({
        message: "Only the user who blocked can unblock",
      });
    }

    request.status = "accepted";
    request.blockedBy = null;

    await request.save();

    return res.status(200).json({
      message: "Profile unblocked",
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

// Return the match between the current user and another user (either direction),
// so the chat screen can reflect a blocked state. Responds with { data: null }
// when no match exists between them.
export const getMatchWithUser = async (req, res) => {
  const otherUserId = req.query.userId;
  const userId = req.userId;

  try {
    if (!otherUserId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    const request = await matchRequest
      .findOne({
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      })
      .sort({ createdAt: -1 });

    if (!request) {
      return res.status(200).json({ data: null });
    }

    return res.status(200).json({
      data: {
        matchId: request._id,
        status: request.status,
        blockedBy: request.blockedBy,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// Not currently mounted in Routes/match.routes.js, but exported — so it is one
// router line away from being live. It used to res.json() whole user documents
// for a userId taken straight off the URL: no auth, no projection.
export const getNearbyMatches = async (req, res) => {
  const user = await User.findById(req.params.userId).select(
    "location"
  );

  const coordinates = user?.location?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return res.status(400).json({ message: "User location not found" });
  }

  const matches = await User.find({
    type: "Parents",
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates,
        },
        $maxDistance: 10000,
      },
    },
  })
    .select(PUBLIC_USER_SELECT)
    .lean();

  res.json(toPublicUsers(matches));
};