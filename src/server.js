require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

/* Middleware */
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express.json());

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
    console.log("MongoDB connected");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
    process.exit(1);
  });
