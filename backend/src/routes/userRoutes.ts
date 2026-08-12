import express from "express";
import { 
    getProfile, 
    updateProfile, 
    hashPasswordHandler, 
    verifyPasswordHandler,
    getAllUsers,
    adminCreateUser,
    adminUpdateUser,
    adminDeleteUser,
    selfRegister
} from "../controllers/userCtrl";
import { verifyToken, requireAdmin } from "../middleware/auth.middleware";

const router = express.Router();

// ── Public routes (no auth required) ─────────────────────────
// Self-registration: the handler verifies the Firebase token internally
// and writes to Supabase via the service role key (bypasses RLS).
router.post("/register", selfRegister as any);

// Apply auth middleware to all routes below this line
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
