const mongoose = require("mongoose");

const loadSchema = new mongoose.Schema(
  {
    // OWNER (Business)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // ASSIGNEE (Trucker)
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    
    // Future: List of truckers who requested this load (Bidding/Matching queue)
    requestedTruckers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],

    // LOGISTICS DETAILS
    origin: { type: String, required: true },
    originLocation: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number], index: "2dsphere" } // [lng, lat]
    },

    destination: { type: String, required: true },
    destinationLocation: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] }
    },

    vehicleTypeRequired: { type: String, required: true },
    cargoType: { type: String, required: true },
    weight: { type: Number, required: true },
    price: { type: Number, required: true },
    distance: { type: Number },
    ratePerKm: { type: Number },

    // STATUS FLOW
    status: {
      type: String,
      enum: [
        "POSTED", 
        "MATCHED", 
        "ASSIGNED", 
        "IN_TRANSIT", 
        "DELIVERED", 
        "CLOSED", 
        "CANCELLED"
      ],
      default: "POSTED",
      index: true
    },
    
    // TIMESTAMPS (Explicit for easy querying)
    pickupDate: { type: Date, required: true },
    pickedUpAt: { type: Date },
    deliveredAt: { type: Date },

    // AUDIT TRAIL
    history: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Load", loadSchema);
