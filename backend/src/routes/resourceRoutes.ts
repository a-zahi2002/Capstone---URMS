import express from "express";
import {
  getResources,
  addResource,
  updateResource,
  deleteResource,
  importResources,
} from "../controllers/resourceCtrl";
import { verifyToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/rbac.middleware";

const router = express.Router();

// Existing routes (you can protect these similarly)
router.get("/", getResources as any);
router.post("/", addResource as any);
router.post("/import", importResources as any);
router.patch("/:id", updateResource as any);
router.delete("/:id", deleteResource as any);

// --- RBAC Example Routes ---

// 1. Admin only route (e.g., deleting a user, though normally in userRoutes)
router.delete(
  "/:id/delete-user-example", 
  verifyToken, 
  authorizeRoles("admin"), 
  (req, res) => {
    res.json({ message: "Success: Admin action performed." });
  }
);

// 2. Lecturer and Admin route (e.g., approving a student resource request)
router.post(
  "/:id/approve", 
  verifyToken, 
  authorizeRoles("admin", "lecturer"), 
  (req, res) => {
    res.json({ message: "Success: Resource request approved." });
  }
);

// 3. Maintenance only route (e.g., updating a broken equipment ticket)
router.patch(
  "/:id/maintenance-ticket", 
  verifyToken, 
  authorizeRoles("maintenance", "admin"), // often admins can do anything
  (req, res) => {
    res.json({ message: "Success: Maintenance ticket updated." });
  }
);

export default router;