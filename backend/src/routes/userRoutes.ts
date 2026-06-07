import express from "express";
import { getProfile, updateProfile } from "../controllers/userCtrl";
import { verifyToken } from "../middleware/auth.middleware";

const router = express.Router();

// Profile routes
router.get("/profile", verifyToken as express.RequestHandler, getProfile as express.RequestHandler);
router.put("/profile", verifyToken as express.RequestHandler, updateProfile as express.RequestHandler);

export default router;
