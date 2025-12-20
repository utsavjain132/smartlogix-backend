import express from "express";
const connectDB = require("./config/db")
const app = express();

app.use("express.json");
connectDB()

app.use("/api/auth", require("./routes/auth.routes"))

export default app;