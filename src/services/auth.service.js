// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const User = require("../models/User");

// const SECRET = process.env.JWT_SECRET_KEY;

// exports.signupUser = async ({ name, email, password }) => {
//   const userExists = await User.findOne({ email });
//   if (userExists) {
//     return { success: false, message: "User already exists" };
//   }

//   const hashedPassword = bcrypt.hashSync(password, 10);

//   const newUser = new User({
//     id: user_id,
//     name,
//     email,
//     password: hashedPassword,
//     isActive: true,
//     token: token,
//   });

//   await newUser.save();

//   return { message: "User registered successfully" };
// };

// exports.loginUser = async ({ email, password }) => {
//   const user = await User.findOne({ email });
//   if (!user) {
//     return { success: false, message: "User not found, DO Signup first" };
//   }

//   const isMatch = bcrypt.compareSync(password, user.password);
//   if (!isMatch) {
//     return { message: "Invalid password" };
//   }

//   const token = jwt.sign({
//     id: user.id,
//     name: user.name,
//     email: user.email
//   }, SECRET, { expiresIn: "1h" });

//   const refreshtoken = jwt.sign(
//     {
//       id: user.id
//     }, SECRET, {
//     expiresIn: "24h"
//   }
//   );

//   return {
//     message: "Login successful",
//     token,
//     refreshtoken,
//   };
// };


const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.registerUser = async ({ name, email, password }) => {
  if (!name || !email || !password) {
    throw new Error("Name, email, and password are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    name,
    email,
    password: hashedPassword
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
    { id: user._id },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "1d" }
  );

  return { token };
};
