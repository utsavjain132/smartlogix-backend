// src/routes/business.routes.js

const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

const {
  upsertProfile,
  getMyProfile
} = require("../controllers/business.controller");

// Create / update business profile
router.post(
  "/profile",
  auth,
  role(["BUSINESS"]),
  upsertProfile
);

// Get logged-in business profile
router.get(
  "/profile/me",
  auth,
  role(["BUSINESS"]),
  getMyProfile
);

module.exports = router;
