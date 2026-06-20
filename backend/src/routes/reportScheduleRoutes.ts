import { Router } from "express";
import { 
    getSchedules, 
    createSchedule, 
    updateSchedule, 
    deleteSchedule 
} from "../controllers/reportScheduleCtrl";
import { verifyToken, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

// All scheduling routes are protected and admin-only
router.use(verifyToken);
router.use(requireAdmin);

router.get("/", getSchedules);
router.post("/", createSchedule);
router.patch("/:id", updateSchedule);
router.delete("/:id", deleteSchedule);

export default router;
