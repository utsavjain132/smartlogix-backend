const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const { 
  createLoad, 
  getMyLoads, 
  getLoadDetails,
  assignTrucker, 
  cancelLoad, 
  closeLoad,
  
  getAvailableLoads, 
  getMyJobs, 
  acceptLoad, 
  pickupLoad, 
  deliverLoad 
} = require("../controllers/load.controller");

// --- Business Routes ---
router.post("/", auth, role(["BUSINESS"]), createLoad);
router.get("/my-loads", auth, role(["BUSINESS"]), getMyLoads);
router.patch("/:loadId/assign", auth, role(["BUSINESS"]), assignTrucker);
router.patch("/:loadId/cancel", auth, role(["BUSINESS"]), cancelLoad);
router.patch("/:loadId/close", auth, role(["BUSINESS"]), closeLoad);

// --- Trucker Routes ---
router.get("/available", auth, role(["TRUCKER"]), getAvailableLoads);
router.get("/my-jobs", auth, role(["TRUCKER"]), getMyJobs);
router.patch("/:loadId/accept", auth, role(["TRUCKER"]), acceptLoad);
router.patch("/:loadId/pickup", auth, role(["TRUCKER"]), pickupLoad);
router.patch("/:loadId/deliver", auth, role(["TRUCKER"]), deliverLoad);

// --- Shared Routes ---
// Must be last to avoid capturing specific paths like "available" or "my-loads" as :loadId
router.get("/:loadId", auth, getLoadDetails);

module.exports = router;
