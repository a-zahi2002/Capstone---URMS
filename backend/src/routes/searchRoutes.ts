import express from "express";
import { searchAll } from "../controllers/searchCtrl";
import { verifyToken } from "../middleware/auth.middleware";

const router = express.Router();

// All search queries are scoped and authenticated via token
router.get("/", verifyToken as express.RequestHandler, searchAll as express.RequestHandler);

export default router;
