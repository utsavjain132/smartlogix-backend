// src/routes/trucker.routes.js

const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

const {
  upsertProfile,
  getMyProfile
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

module.exports = router;
