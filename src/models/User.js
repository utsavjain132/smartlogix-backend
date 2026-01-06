const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },

    password: {
      type: String,
      required: true
    },
    
    role: {
      type: String,
      enum: ["TRUCKER", "BUSINESS", "ADMIN"],
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Explicitly define index for email to avoid any potential auto-index creation issues
// userSchema.index({ email: 1 }, { unique: true }); // Mongoose does this automatically with unique: true

module.exports = mongoose.model("User", userSchema);