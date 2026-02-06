require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const logger = require("./utils/logger");
const fs = require("fs");
const path = require("path");

const app = express();

/* Middleware */
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));
app.use(express.json());

// Log requests to app.log using morgan
const accessLogStream = fs.createWriteStream(path.join(__dirname, '../app.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev')); // Still log to console for development

/* Routes */
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/trucker", require("./routes/trucker.routes"));
app.use("/api/business", require("./routes/business.routes"));
app.use("/api/loads", require("./routes/load.routes"));

/* Health */
app.get("/", (req, res) => {
  res.send("SmartLogix backend running");
});

/* Error Middleware */
app.use(require("./middleware/error.middleware"));

/* DB + Server */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info("MongoDB connected");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      logger.info(`Server running on port ${PORT}`)
    );
  })
  .catch((err) => {
    logger.error("DB connection failed:", err);
    process.exit(1);
  });
