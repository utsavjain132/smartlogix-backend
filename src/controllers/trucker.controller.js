// src/controllers/trucker.controller.js

const TruckerProfile = require("../models/TruckerProfile");
const { validationResult } = require("express-validator");
const { validateFields } = require("../utils/validation");
const logger = require("../utils/logger");

exports.upsertProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { 
      vehicleType, 
      capacity, 
      currentLocation,
      licensePlate, 
      driverLicense 
    } = req.body;

    const city = currentLocation?.city || "Unknown";
    logger.debug("Upserting trucker profile for user %s in %s", req.user.id, city);

    // Default to [0,0] if no coordinates provided yet
    const defaultCoords = [0, 0];

    const profile = await TruckerProfile.findOneAndUpdate(
      { userId: req.user.id },
      {
        vehicleType,
        capacity,
        availableCapacity: capacity, // Reset available capacity on profile update/create
        licensePlate,
        driverLicense,
        // Initialize location with a valid GeoJSON structure if it doesn't exist
        $setOnInsert: {
          currentLocation: {
            type: "Point",
            coordinates: defaultCoords,
            address: city || "Unknown"
          },
          isOnline: false
        }
      },
      { new: true, upsert: true }
    );
    
    // If the city was updated and we want to reflect that in address (ignoring coords for now)
    if (city) {
        profile.currentLocation.address = city;
        await profile.save();
    }

    res.json(profile);
  } catch (err) {
    console.error("Profile update error:", err);
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

exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng, address } = req.body;
    
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: "Latitude and longitude required" });
    }

    const profile = await TruckerProfile.findOne({ userId: req.user.id });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    profile.currentLocation = {
      type: "Point",
      coordinates: [lng, lat], // Mongo uses [lng, lat]
      address: address || profile.currentLocation.address,
      lastUpdated: new Date()
    };

    await profile.save();
    res.json({ message: "Location updated" });
  } catch (err) {
    console.error("Location update error:", err);
    res.status(500).json({ message: "Location update failed" });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const { isOnline } = req.body;
    
    const profile = await TruckerProfile.findOne({ userId: req.user.id });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    profile.isOnline = isOnline;
    await profile.save();
    
    res.json({ message: `Status updated to ${isOnline ? 'Online' : 'Offline'}` });
  } catch (err) {
    res.status(500).json({ message: "Status update failed" });
  }
};