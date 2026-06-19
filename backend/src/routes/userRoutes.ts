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

// Profile routes
router.get("/profile", verifyToken as express.RequestHandler, getProfile as express.RequestHandler);
router.put("/profile", verifyToken as express.RequestHandler, updateProfile as express.RequestHandler);

// Password encryption routes (bcrypt)
router.post("/hash-password", verifyToken as express.RequestHandler, hashPasswordHandler as express.RequestHandler);
router.post("/verify-password", verifyToken as express.RequestHandler, verifyPasswordHandler as express.RequestHandler);

// Admin-only user management routes
router.get("/", verifyToken as express.RequestHandler, requireAdmin as express.RequestHandler, getAllUsers as express.RequestHandler);
router.post("/", verifyToken as express.RequestHandler, requireAdmin as express.RequestHandler, adminCreateUser as express.RequestHandler);
router.put("/:id", verifyToken as express.RequestHandler, requireAdmin as express.RequestHandler, adminUpdateUser as express.RequestHandler);
router.delete("/:id", verifyToken as express.RequestHandler, requireAdmin as express.RequestHandler, adminDeleteUser as express.RequestHandler);

export default router;
