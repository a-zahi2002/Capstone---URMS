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

router.get("/schedules", getSchedules);
router.post("/schedules", createSchedule);
router.patch("/schedules/:id", updateSchedule);
router.delete("/schedules/:id", deleteSchedule);

export default router;
