// src/routes/business.routes.js

const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

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
  [
    body("businessName").notEmpty().withMessage("Business name is required").trim(),
    body("businessType").notEmpty().withMessage("Business type is required").trim(),
    body("contactPerson").notEmpty().withMessage("Contact person is required").trim(),
    body("contactPhone").notEmpty().withMessage("Contact phone is required").trim(),
    body("location.city").notEmpty().withMessage("City is required").trim(),
  ],
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
