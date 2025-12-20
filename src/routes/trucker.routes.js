// src/routes/trucker.routes.js

const express = require("express");
const router = express.Router();

const {
  upsertProfile,
  getMyProfile
} = require("../controllers/trucker.controller");

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

router.post("/profile", auth, role("TRUCKER"), upsertProfile);
router.get("/profile/me", auth, role("TRUCKER"), getMyProfile);

module.exports = router;
