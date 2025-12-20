import express from "express";
const router = express.Router();

const {
    login, 
    signup
} = require("./controllers/auth.controller")

router.post("/signup", signup);
router.post("/login", login);

module.exports = router;