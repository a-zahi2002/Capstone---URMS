import express from "express";
import { getProfile, updateProfile, hashPasswordHandler, verifyPasswordHandler } from "../controllers/userCtrl";
import { verifyToken } from "../middleware/auth.middleware";

const router = express.Router();

// Profile routes
router.get("/profile", verifyToken as express.RequestHandler, getProfile as express.RequestHandler);
router.put("/profile", verifyToken as express.RequestHandler, updateProfile as express.RequestHandler);

// Password encryption routes (bcrypt)
router.post("/hash-password", verifyToken as express.RequestHandler, hashPasswordHandler as express.RequestHandler);
router.post("/verify-password", verifyToken as express.RequestHandler, verifyPasswordHandler as express.RequestHandler);

export default router;
