import express from "express";
import {
    scheduleRecurringEmails,
    stopRecurringEmails,
} from "../controller/tasksetting.controller.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/send-reminder", authenticateUser, scheduleRecurringEmails);
router.post("/stop-reminder", authenticateUser, stopRecurringEmails);

export default router;
