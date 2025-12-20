const bcrypt = require("bcryptjs");
const uuid = require("uuid")
const jwt = require("jsonwebtoken");
const users = require("../utils/users");

const SECRET = "mysecretkey";

exports.signupUser = ({ name, email, password }) => {
  const userExists = users.find(u => u.email === email);
  if (userExists) {
    return { message: "User already exists" };
  }

  const uuid = uuid 
  const hashedPassword = bcrypt.hashSync(password, 10);

  const newUser = {
    id: uuid,
    name,
    email,
    password: hashedPassword,
    isActive: true,
  };

  users.push(newUser);

  return { message: "User registered successfully" };
};

exports.loginUser = ({ email, password }) => {
  const user = users.find(u => u.email === email);
  if (!user) {
    return { message: "User not found" };
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return { message: "Invalid password" };
  }

  const token = jwt.sign({ 
    id: user.id,
    name: user.name,
    email: user.email
    }, SECRET, { expiresIn: "1h" });

const refreshtoken = jwt.sign(
    {
        id: user.id
    }, SECRET, {
        expiresIn: "24h"
    }
);

  return {
    message: "Login successful",
    token,
    refreshtoken,
  };
};
