import express from "express";
import {
  getSavedSearches,
  createSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
} from "../controllers/savedSearchCtrl";
import { verifyToken } from "../middleware/auth.middleware";

const router = express.Router();

// Apply auth middleware to all saved searches routes
router.use(verifyToken);

router.get("/", getSavedSearches as any);
router.post("/", createSavedSearch as any);
router.put("/:id", updateSavedSearch as any);
router.delete("/:id", deleteSavedSearch as any);

export default router;
