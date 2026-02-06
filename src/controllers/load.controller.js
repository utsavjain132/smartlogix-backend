const Load = require("../models/Load");
const TruckerProfile = require("../models/TruckerProfile");
const { validateTransition } = require("../utils/freightStateMachine");
const { validateFields } = require("../utils/validation");
const logger = require("../utils/logger");

// --- Helper for Atomic Update ---
const executeAtomicTransition = async (loadId, currentStatus, nextStatus, userId, updateFields = {}) => {
  logger.debug("Attempting atomic transition for load %s from %s to %s by user %s", loadId, currentStatus, nextStatus, userId);
  const query = { 
    _id: loadId, 
    status: currentStatus
  };

  const update = {
    $set: { 
      status: nextStatus, 
      ...updateFields 
    },
    $push: {
      history: {
        status: nextStatus,
        updatedBy: userId,
        timestamp: new Date()
      }
    }
  };

  const load = await Load.findOneAndUpdate(query, update, { new: true });
  
  if (!load) {
    // Check if load exists at all to give better error
    const check = await Load.findById(loadId);
    if (!check) {
      logger.error("Load not found: %s", loadId);
      throw new Error("Load not found");
    }
    logger.warn("Atomic transition failed for load %s. Expected %s but found %s", loadId, currentStatus, check.status);
    throw new Error(`Load status mismatch. Expected '${currentStatus}' but found '${check.status}'. Transition failed.`);
  }

  logger.info("Load %s status updated to %s", loadId, nextStatus);
  return load;
};

// --- Business Endpoints ---

exports.createLoad = async (req, res) => {
  try {
    logger.debug("Creating new load for business user %s", req.user.id);
    const required = ["origin", "destination", "cargoType", "weight", "price", "pickupDate", "vehicleTypeRequired"];
    validateFields(req.body, required);

    const {
      origin, destination, cargoType, weight, price, pickupDate, vehicleTypeRequired,
      originCoords, destinationCoords, distance, loadType 
    } = req.body;

    const originLocation = originCoords ? { type: "Point", coordinates: originCoords } : undefined;
    const destinationLocation = destinationCoords ? { type: "Point", coordinates: destinationCoords } : undefined;

    const newLoad = await Load.create({
      createdBy: req.user.id,
      origin,
      originLocation,
      destination,
      destinationLocation,
      cargoType,
      weight,
      price,
      pickupDate,
      vehicleTypeRequired,
      distance,
      loadType: loadType || "FTL", // Default to FTL if not specified
      status: "POSTED",
      history: [{ status: "POSTED", updatedBy: req.user.id }]
    });

    logger.info("New load created: %s", newLoad._id);
    res.status(201).json(newLoad);
  } catch (err) {
    logger.error("Failed to create load: %s", err.message);
    res.status(400).json({ message: err.message });
  }
};

exports.getMyLoads = async (req, res) => {
  try {
    const loads = await Load.find({ createdBy: req.user.id })
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });
    res.json(loads);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch loads", error: err.message });
  }
};

exports.getLoadDetails = async (req, res) => {
  try {
    const { loadId } = req.params;
    const load = await Load.findById(loadId).populate("assignedTo", "name email");
    
    if (!load) return res.status(404).json({ message: "Load not found" });

    // Security: Only creator or assigned trucker can see details
    const isCreator = String(load.createdBy) === req.user.id;
    const isAssigned = load.assignedTo && String(load.assignedTo._id) === req.user.id;

    if (!isCreator && !isAssigned) {
      return res.status(403).json({ message: "Not authorized to view these details" });
    }

    let truckerProfile = null;
    if (load.assignedTo) {
      truckerProfile = await TruckerProfile.findOne({ userId: load.assignedTo._id });
    }

    res.json({ load, truckerProfile });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch load details", error: err.message });
  }
};

exports.assignTrucker = async (req, res) => {
  try {
    const { loadId } = req.params;
    
    // 1. Ownership check
    const loadCheck = await Load.findById(loadId);
    if (!loadCheck) return res.status(404).json({ message: "Load not found" });
    if (String(loadCheck.createdBy) !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    // 2. Validate Transition
    validateTransition(loadCheck.status, "ASSIGNED", "BUSINESS");

    // 3. Check Trucker Capacity (Critical Step)
    // We expect the business to provide the truckerId they are assigning to (normally chosen from applicants)
    // But in our current flow, 'MATCHED' status implies `assignedTo` is already tentatively set to the Trucker who requested it.
    // If not, we'd need `req.body.truckerId`.
    const truckerId = loadCheck.assignedTo;
    if (!truckerId) return res.status(400).json({ message: "No trucker has requested this load yet." });

    const truckerProfile = await TruckerProfile.findOne({ userId: truckerId });
    if (!truckerProfile) return res.status(404).json({ message: "Trucker profile not found" });

    // Capacity Logic
    if (loadCheck.loadType === "FTL") {
      // For FTL, trucker must be effectively empty (available == total capacity)
      if (truckerProfile.availableCapacity < truckerProfile.capacity) {
        return res.status(400).json({ message: "Trucker does not have full capacity for FTL." });
      }
    } else {
      // For PTL
      if (truckerProfile.availableCapacity < loadCheck.weight) {
        return res.status(400).json({ message: "Trucker does not have enough available capacity." });
      }
    }

    // 4. Atomic Update Load
    constupdatedLoad = await executeAtomicTransition(
      loadId, 
      "MATCHED", 
      "ASSIGNED", 
      req.user.id
    );

    // 5. Update Trucker Capacity
    // Decrease available capacity
    await TruckerProfile.findOneAndUpdate(
      { userId: truckerId },
      { $inc: { availableCapacity: -loadCheck.weight } }
    );

    res.json({ message: "Trucker confirmed. Load assigned.", load: constupdatedLoad });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.cancelLoad = async (req, res) => {
  try {
    const { loadId } = req.params;
    
    const loadCheck = await Load.findById(loadId);
    if (!loadCheck) return res.status(404).json({ message: "Load not found" });
    if (String(loadCheck.createdBy) !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    validateTransition(loadCheck.status, "CANCELLED", "BUSINESS");

    // If load was already assigned/in_transit (though validateTransition blocks that for Business usually),
    // we might need to restore capacity. But Business can usually only cancel POSTED or MATCHED.
    // If we allow canceling ASSIGNED, we must restore capacity.
    // Our state machine says MATCHED -> CANCELLED is allowed.
    // If ASSIGNED -> CANCELLED were allowed, we'd need logic here.
    // Current state machine: POSTED->CANCELLED, MATCHED->CANCELLED. No capacity taken yet.

    const updatedLoad = await executeAtomicTransition(
      loadId, 
      loadCheck.status, 
      "CANCELLED", 
      req.user.id
    );

    res.json({ message: "Load cancelled", load: updatedLoad });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.closeLoad = async (req, res) => {
  try {
    const { loadId } = req.params;
    
    const loadCheck = await Load.findById(loadId);
    if (!loadCheck) return res.status(404).json({ message: "Load not found" });
    if (String(loadCheck.createdBy) !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    validateTransition(loadCheck.status, "CLOSED", "BUSINESS");

    const updatedLoad = await executeAtomicTransition(
      loadId, 
      "DELIVERED", 
      "CLOSED", 
      req.user.id
    );

    res.json({ message: "Load closed successfully", load: updatedLoad });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// --- Trucker Endpoints ---

exports.getAvailableLoads = async (req, res) => {
  try {
    const { radius } = req.query;
    const maxDistance = radius ? parseInt(radius) * 1000 : 100000; // Convert km to meters, default 100km

    const truckerProfile = await TruckerProfile.findOne({ userId: req.user.id });
    
    let query = { status: "POSTED" };
    
    if (truckerProfile) {
      // Capacity check logic for query
      // We only show loads they can potentially take
      // If they have 5 tons available, don't show 10 ton loads
      query.weight = { $lte: truckerProfile.availableCapacity };
      
      // If FTL, they must have full capacity. If not full capacity, hide FTLs.
      if (truckerProfile.availableCapacity < truckerProfile.capacity) {
         query.loadType = "PTL"; // Can only see PTL if partially full
      }

      query.vehicleTypeRequired = truckerProfile.vehicleType;
      
      if (truckerProfile.currentLocation && truckerProfile.currentLocation.coordinates && truckerProfile.currentLocation.coordinates.length === 2) {
         const [lng, lat] = truckerProfile.currentLocation.coordinates;
         if (lng !== 0 || lat !== 0) {
             query.originLocation = {
                 $near: {
                     $geometry: { type: "Point", coordinates: [lng, lat] },
                     $maxDistance: maxDistance
                 }
             };
         }
      }
    }

    const loads = await Load.find(query).sort({ createdAt: -1 }).limit(20);
    res.json(loads);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch available loads", error: err.message });
  }
};

exports.getMyJobs = async (req, res) => {
  try {
    const loads = await Load.find({ assignedTo: req.user.id }).sort({ updatedAt: -1 });
    res.json(loads);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch jobs", error: err.message });
  }
};

exports.acceptLoad = async (req, res) => {
  try {
    const { loadId } = req.params;
    
    const loadCheck = await Load.findById(loadId);
    if (!loadCheck) return res.status(404).json({ message: "Load not found" });
    
    validateTransition(loadCheck.status, "MATCHED", "TRUCKER");

    // Preliminary Capacity Check
    const truckerProfile = await TruckerProfile.findOne({ userId: req.user.id });
    if (loadCheck.loadType === "FTL" && truckerProfile.availableCapacity < truckerProfile.capacity) {
        return res.status(400).json({ message: "You must be empty to accept an FTL load." });
    }
    if (truckerProfile.availableCapacity < loadCheck.weight) {
        return res.status(400).json({ message: "Insufficient capacity for this load." });
    }

    const updatedLoad = await executeAtomicTransition(
      loadId, 
      "POSTED", 
      "MATCHED", 
      req.user.id,
      { assignedTo: req.user.id } // Set assignment tentatively
    );

    res.json({ message: "Load accepted. Waiting for business approval.", load: updatedLoad });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.pickupLoad = async (req, res) => {
  try {
    const { loadId } = req.params;
    
    const loadCheck = await Load.findById(loadId);
    if (!loadCheck) return res.status(404).json({ message: "Load not found" });
    if (String(loadCheck.assignedTo) !== req.user.id) return res.status(403).json({ message: "Not assigned to you" });

    validateTransition(loadCheck.status, "IN_TRANSIT", "TRUCKER");

    const updatedLoad = await executeAtomicTransition(
      loadId, 
      "ASSIGNED", 
      "IN_TRANSIT", 
      req.user.id
    );

    res.json({ message: "Load picked up", load: updatedLoad });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deliverLoad = async (req, res) => {
  try {
    const { loadId } = req.params;
    
    const loadCheck = await Load.findById(loadId);
    if (!loadCheck) return res.status(404).json({ message: "Load not found" });
    if (String(loadCheck.assignedTo) !== req.user.id) return res.status(403).json({ message: "Not assigned to you" });

    validateTransition(loadCheck.status, "DELIVERED", "TRUCKER");

    const updatedLoad = await executeAtomicTransition(
      loadId, 
      "IN_TRANSIT", 
      "DELIVERED", 
      req.user.id
    );

    // Restore Capacity on Delivery
    await TruckerProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $inc: { availableCapacity: loadCheck.weight } }
    );

    res.json({ message: "Load delivered", load: updatedLoad });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
