const authService = require("../services/auth.service");

exports.signup = (req, res) => {
  const result = authService.registerUser(req.body);
  res.json(result);
};

exports.login = (req, res) => {
  const result = authService.loginUser(req.body);
  res.json(result);
};
