// Allowed transitions map
// Key: Current State
// Value: Object where key is Role, value is allowed Next State(s)
const TRANSITIONS = {
  "POSTED": {
    "TRUCKER": "MATCHED",
    "BUSINESS": "CANCELLED"
  },
  "MATCHED": {
    "BUSINESS": ["ASSIGNED", "CANCELLED"], // Business confirms match OR cancels
    // "TRUCKER": "POSTED" // If we implemented 'Un-match' or 'Reject', not needed for MVP Phase 2 yet
  },
  "ASSIGNED": {
    "TRUCKER": "IN_TRANSIT"
  },
  "IN_TRANSIT": {
    "TRUCKER": "DELIVERED"
  },
  "DELIVERED": {
    "BUSINESS": "CLOSED"
  },
  "CLOSED": {}, // Terminal state
  "CANCELLED": {} // Terminal state
};

/**
 * Validates if a transition is allowed.
 * @param {string} currentStatus - The current status of the load.
 * @param {string} nextStatus - The desired new status.
 * @param {string} userRole - The role of the user attempting the action ("BUSINESS" or "TRUCKER").
 * @returns {boolean} - True if allowed, throws error otherwise.
 */
const validateTransition = (currentStatus, nextStatus, userRole) => {
  const allowedForState = TRANSITIONS[currentStatus];
  
  if (!allowedForState) {
    throw new Error(`Load is in terminal state '${currentStatus}' and cannot be updated.`);
  }

  const allowedForRole = allowedForState[userRole];

  if (!allowedForRole) {
    throw new Error(`Role '${userRole}' is not allowed to update load from '${currentStatus}'.`);
  }

  const allowedNextStates = Array.isArray(allowedForRole) ? allowedForRole : [allowedForRole];

  if (!allowedNextStates.includes(nextStatus)) {
    throw new Error(`Invalid transition from '${currentStatus}' to '${nextStatus}' for role '${userRole}'.`);
  }

  return true;
};

module.exports = {
  TRANSITIONS,
  validateTransition
};
