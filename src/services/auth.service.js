const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.registerUser = async ({ name, email, password, role }) => {
  if (!name || !email || !password || !role) {
    throw new Error("All fields are required");
  }

  if (!["TRUCKER", "BUSINESS"].includes(role)) {
    throw new Error("Invalid role");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    name,
    email,
    password: hashedPassword,
    role
  });

  return { message: "User registered successfully" };
};


exports.loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    { id: user._id,
      role: user.role
     },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "12h" }
  );

  return { 
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};
