const authService = require("../services/auth.service");
const { validationResult } = require("express-validator");
const logger = require("../utils/logger");

exports.signup = async (req, res) => {
  logger.debug("Signup attempt for email: %s", req.body.email);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn("Signup validation failed for %s", req.body.email);
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const result = await authService.registerUser(req.body);
    logger.info("User registered successfully: %s", req.body.email);
    res.status(201).json(result);
  } catch (err) {
    logger.error("Signup error for %s: %s", req.body.email, err.message);
    res.status(400).json({ message: err.message });
  }
};



exports.login = async (req, res) => {
  logger.debug("Login attempt for email: %s", req.body.email);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const result = await authService.loginUser(req.body);
    logger.info("User logged in: %s", req.body.email);
    res.json(result);
  } catch (err) {
    logger.warn("Login failed for %s: %s", req.body.email, err.message);
    res.status(401).json({ message: err.message });
  }
};
