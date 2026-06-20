import express from "express";
import { 
    getProfile, 
    updateProfile, 
    hashPasswordHandler, 
    verifyPasswordHandler,
    getAllUsers,
    adminCreateUser,
    adminUpdateUser,
    adminDeleteUser
} from "../controllers/userCtrl";
import { verifyToken, requireAdmin } from "../middleware/auth.middleware";

const router = express.Router();

// Apply auth middleware to all user routes
router.use(verifyToken);

// Profile routes
router.get("/profile", getProfile as any);
router.put("/profile", updateProfile as any);

// Password encryption routes (bcrypt)
router.post("/hash-password", hashPasswordHandler as any);
router.post("/verify-password", verifyPasswordHandler as any);

// Admin-only user management routes
router.get("/", requireAdmin as any, getAllUsers as any);
router.post("/", requireAdmin as any, adminCreateUser as any);
router.put("/:id", requireAdmin as any, adminUpdateUser as any);
router.delete("/:id", requireAdmin as any, adminDeleteUser as any);

export default router;
