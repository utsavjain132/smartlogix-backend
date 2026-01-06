const mongoose = require("mongoose");

const businessProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    businessName: {
      type: String,
      required: true
    },

    businessType: {
      type: String,
      required: true
      // e.g. Manufacturer, Distributor, Retailer, Logistics Broker
    },

    // Phase 2: Compliance
    gstin: {
      type: String
    },

    contactPerson: {
      type: String,
      required: true
    },

    contactPhone: {
      type: String,
      required: true
    },

    location: {
      city: {
        type: String,
        required: true
      },
      state: {
        type: String
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("BusinessProfile", businessProfileSchema);