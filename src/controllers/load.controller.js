const Load = require("../models/Load");
const TruckerProfile = require("../models/TruckerProfile");
const { validateTransition } = require("../utils/freightStateMachine");
const { validateFields } = require("../utils/validation");

// --- Helper for Atomic Update ---
const executeAtomicTransition = async (loadId, currentStatus, nextStatus, userId, updateFields = {}) => {
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
    if (!check) throw new Error("Load not found");
    throw new Error(`Load status mismatch. Expected '${currentStatus}' but found '${check.status}'. Transition failed.`);
  }

  return load;
};

// --- Business Endpoints ---

exports.createLoad = async (req, res) => {
  try {
    const required = ["origin", "destination", "cargoType", "weight", "price", "pickupDate", "vehicleTypeRequired"];
    validateFields(req.body, required);

    const {
      origin, destination, cargoType, weight, price, pickupDate, vehicleTypeRequired,
      originCoords, destinationCoords, distance 
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
      status: "POSTED",
      history: [{ status: "POSTED", updatedBy: req.user.id }]
    });

    res.status(201).json(newLoad);
  } catch (err) {
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
    
    // 1. Ownership check (Must find doc first to verify owner)
    const loadCheck = await Load.findById(loadId);
    if (!loadCheck) return res.status(404).json({ message: "Load not found" });
    if (String(loadCheck.createdBy) !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    // 2. Validate Transition
    validateTransition(loadCheck.status, "ASSIGNED", "BUSINESS");

    // 3. Atomic Update
    const updatedLoad = await executeAtomicTransition(
      loadId, 
      "MATCHED", 
      "ASSIGNED", 
      req.user.id
    );

    res.json({ message: "Trucker confirmed. Load assigned.", load: updatedLoad });
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

    // Atomic Update with flexible current status (POSTED or MATCHED)
    // We reuse logic but need custom query for this specific case since executeAtomicTransition takes single string
    // Or we just pass the current status we found. Race condition risk is small here but exists if status changed *after* find.
    // Ideally we pass loadCheck.status. If it changed in between, the update fails, ensuring atomicity.
    
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
    const truckerProfile = await TruckerProfile.findOne({ userId: req.user.id });
    
    let query = { status: "POSTED" };
    
    if (truckerProfile) {
      query.weight = { $lte: truckerProfile.capacity };
      query.vehicleTypeRequired = truckerProfile.vehicleType;
      
      if (truckerProfile.currentLocation && truckerProfile.currentLocation.coordinates && truckerProfile.currentLocation.coordinates.length === 2) {
         const [lng, lat] = truckerProfile.currentLocation.coordinates;
         if (lng !== 0 || lat !== 0) {
             query.originLocation = {
                 $near: {
                     $geometry: { type: "Point", coordinates: [lng, lat] },
                     $maxDistance: 100000 
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
    
    // We can skip ownership check for accepting, BUT we must ensure status is POSTED
    // If multiple truckers click Accept at same time, only one wins due to atomic update on POSTED status
    
    // Pre-check for better error message (optional, but good for UX)
    const loadCheck = await Load.findById(loadId);
    if (!loadCheck) return res.status(404).json({ message: "Load not found" });
    
    validateTransition(loadCheck.status, "MATCHED", "TRUCKER");

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

    res.json({ message: "Load delivered", load: updatedLoad });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
