
const express = require("express");
const router = express.Router();

const {
  upsertProfile,
  getMyProfile
} = require("../controllers/business.controller");

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

router.post("/profile", auth, role("BUSINESS"), upsertProfile);
router.get("/profile/me", auth, role("BUSINESS"), getMyProfile);

module.exports = router;
