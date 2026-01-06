const express = require("express");
const router = express.Router();

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