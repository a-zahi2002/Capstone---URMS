import express from "express";
import {
  getResources,
  addResource,
  updateResource,
  deleteResource,
  importResources,
} from "../controllers/resourceCtrl";

const router = express.Router();

router.get("/", getResources as any);
router.post("/", addResource as any);
router.post("/import", importResources as any);
router.patch("/:id", updateResource as any);
router.delete("/:id", deleteResource as any);

export default router;