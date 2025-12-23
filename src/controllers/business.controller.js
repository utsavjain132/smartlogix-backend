
const TruckerProfile = require("../models/BusinessProfile");

exports.upsertProfile = async (req, res) => {
  try {
    const { vehicleType, capacity, city, lat, lng } = req.body;

    const profile = await TruckerProfile.findOneAndUpdate(
      { userId: req.user.id },
      {
        vehicleType,
        capacity,
        currentLocation: { city, lat, lng }
      },
      { new: true, upsert: true }
    );

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: "Profile update failed" });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const profile = await TruckerProfile.findOne({
      userId: req.user.id
    });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile" });
  }
};
