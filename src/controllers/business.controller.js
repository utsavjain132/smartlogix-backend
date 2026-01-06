// src/controllers/business.controller.js

const BusinessProfile = require("../models/BusinessProfile");
const { validateFields } = require("../utils/validation");

exports.upsertProfile = async (req, res) => {
  try {
    const required = ["businessName", "businessType", "contactPerson", "contactPhone"];
    validateFields(req.body, required);

    const {
      businessName,
      businessType,
      contactPerson,
      contactPhone,
      location,
      city,
      state,
      gstin // Phase 2
    } = req.body;

    // Handle location whether passed as an object or flat fields
    const locationData = location || { city, state };
    if (!locationData.city) return res.status(400).json({ message: "City is required" });

    res.json(profile);
  } catch (err) {
    console.error("Profile update error:", err);
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