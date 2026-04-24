import matchRequest from "../Schema/matchRequest.js";
import User from "../Schema/user.js";

export const requestMatch = async (req, res) => {
  const { nannyId, familyId } = req.body;
  const data = await matchRequest.create({ nannyId, familyId });
  res.json(data);
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