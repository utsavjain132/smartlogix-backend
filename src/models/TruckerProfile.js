const mongoose = require("mongoose");

const truckerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    vehicleType: {
      type: String,
      required: true
    },

    capacity: {
      type: Number,
      required: true
    },

    // Phase 2: Online/Offline status
    isOnline: {
      type: Boolean,
      default: false
    },
    
    // Phase 2: GeoJSON for location tracking
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"]
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: "2dsphere" 
      },
      address: {
        type: String // Readable city/address
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      }
    },

    // Phase 2: Compliance
    licensePlate: {
      type: String
    },
    driverLicense: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Indexes
truckerProfileSchema.index({ currentLocation: "2dsphere" });
truckerProfileSchema.index({ isOnline: 1 });

module.exports = mongoose.model("TruckerProfile", truckerProfileSchema);