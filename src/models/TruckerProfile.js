
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

    availability: {
      type: Boolean,
      default: true
    },

    currentLocation: {
      city: {
        type: String,
        required: true
      },
      lat: Number,
      lng: Number
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("TruckerProfile", truckerProfileSchema);
