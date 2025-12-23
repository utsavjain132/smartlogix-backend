// src/controllers/business.controller.js

const BusinessProfile = require("../models/BusinessProfile");

exports.upsertProfile = async (req, res) => {
  try {
    const {
      businessName,
      businessType,
      contactPerson,
      contactPhone,
      city,
      state
    } = req.body;

    const profile = await BusinessProfile.findOneAndUpdate(
      { userId: req.user.id },
      {
        businessName,
        businessType,
        contactPerson,
        contactPhone,
        location: {
          city,
          state
        }
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
    const profile = await BusinessProfile.findOne({
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
