# SmartLogix Backend (Phase 2)

SmartLogix is a freight and logistics marketplace connecting Business Owners (Shippers) with Truckers (Carriers). This backend powers the operational workflow, state management, and geospatial tracking features.

## 🚀 Core Features (Phase 2)

*   **Role-Based Access Control:** Strict separation between `BUSINESS` and `TRUCKER` roles.
*   **Freight Lifecycle Engine:** A centralized state machine ensuring legal transitions for shipments.
*   **Geospatial Tracking:** Basic location updates for truckers and "Find Loads Near Me" functionality.
*   **Atomic Operations:** Concurrency-safe load status updates to prevent race conditions.
*   **Security:** 12-hour JWT expiry, input validation, and ownership enforcement.

---

## 👥 User Roles

### 1. Business Owner (Shipper)
*   Create and manage company profile.
*   Post new freight loads with origin/destination coordinates.
*   Assign active truckers to loads.
*   Track shipments (View Trucker Location).
*   Verify delivery and close loads.

### 2. Trucker (Carrier)
*   Manage vehicle details and capacity.
*   View available loads (filtered by vehicle type and capacity).
*   **Request Load:** Express interest in a shipment.
*   **Pickup:** Confirm cargo retrieval.
*   **Deliver:** Confirm cargo drop-off.
*   **GPS Sync:** Update last known location for tracking.

---

## 📦 Freight Lifecycle (State Machine)

The `Load` entity follows a strict path. Invalid transitions are rejected by the API.

| Current State | Action | Actor | Next State |
| :--- | :--- | :--- | :--- |
| **POSTED** | Create Load | Business | `MATCHED` (via Trucker) |
| **MATCHED** | Request Load | Trucker | `ASSIGNED` (via Business) |
| **ASSIGNED** | Confirm Match | Business | `IN_TRANSIT` (via Trucker) |
| **IN_TRANSIT**| Pickup Load | Trucker | `DELIVERED` (via Trucker) |
| **DELIVERED** | Deliver Load | Trucker | `CLOSED` (via Business) |
| **CLOSED** | Verify & Close | Business | *Terminal* |
| **CANCELLED**| Cancel | Business | *Terminal* |

---

## 🛠️ API Endpoints

### Auth
*   `POST /api/auth/signup` - Register (Business/Trucker).
*   `POST /api/auth/login` - Authenticate and get JWT.

### Business
*   `POST /api/business/profile` - Create/Update profile.
*   `GET /api/business/profile/me` - Get current profile.

### Trucker
*   `POST /api/trucker/profile` - Create/Update profile.
*   `GET /api/trucker/profile/me` - Get current profile.
*   `PATCH /api/trucker/location` - Update GPS coordinates.

### Loads (Freight)
*   `POST /api/loads` - Create a new load (Business).
*   `GET /api/loads/available` - Get open loads near trucker (Trucker).
*   `GET /api/loads/my-loads` - Get created loads (Business).
*   `GET /api/loads/my-jobs` - Get assigned jobs (Trucker).
*   `GET /api/loads/:id` - Get load details & map data (Protected).
*   **State Actions:**
    *   `PATCH /api/loads/:id/accept` (Trucker)
    *   `PATCH /api/loads/:id/assign` (Business)
    *   `PATCH /api/loads/:id/pickup` (Trucker)
    *   `PATCH /api/loads/:id/deliver` (Trucker)
    *   `PATCH /api/loads/:id/close` (Business)
    *   `PATCH /api/loads/:id/cancel` (Business)

---

## 🔧 Setup & Installation

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Variables (.env):**
    ```env
    PORT=5000
    MONGODB_URI=mongodb://localhost:27017/smartlogix
    JWT_SECRET_KEY=your_secure_secret
    ```

3.  **Run Server:**
    ```bash
    npm run dev  # Development (Nodemon)
    npm start    # Production
    ```

## 🔒 Security Notes
*   **Ownership Validation:** Middleware checks `createdBy` vs `req.user.id` for every modification.
*   **Input Validation:** Critical fields are validated before DB insertion.
*   **Rate Limiting:** (Recommended for Production) Not currently implemented.
