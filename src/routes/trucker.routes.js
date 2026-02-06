const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

const {
  upsertProfile,
  getMyProfile,
  updateLocation,
  toggleStatus
} = require("../controllers/trucker.controller");

// Create / update trucker profile
router.post(
  "/profile",
  auth,
  role(["TRUCKER"]),
  [
    body("vehicleType").notEmpty().withMessage("Vehicle type is required").trim(),
    body("capacity").isNumeric().withMessage("Capacity must be a number"),
    body("currentLocation.city").notEmpty().withMessage("City is required").trim(),
  ],
  upsertProfile
);

// Get logged-in trucker profile
router.get(
  "/profile/me",
  auth,
  role(["TRUCKER"]),
  getMyProfile
);

// Phase 2: Location & Status
router.patch("/location", auth, role(["TRUCKER"]), updateLocation);
router.patch("/status", auth, role(["TRUCKER"]), toggleStatus);

module.exports = router;