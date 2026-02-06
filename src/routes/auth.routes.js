const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const {
    login, 
    signup
} = require("../controllers/auth.controller.js")

router.post(
    "/signup", 
    [
        body("name").notEmpty().withMessage("Name is required").trim(),
        body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
        body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
        body("role").isIn(["TRUCKER", "BUSINESS"]).withMessage("Invalid role")
    ],
    signup
);

router.post(
    "/login", 
    [
        body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
        body("password").notEmpty().withMessage("Password is required")
    ],
    login
);

module.exports = router;