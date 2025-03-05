import express from "express";
import {
    scheduleRecurringEmails,
    stopRecurringEmails,
} from "../controller/tasksetting.controller.js";

const router = express.Router();

router.post("/send-reminder", scheduleRecurringEmails);
router.post("/stop-reminder", stopRecurringEmails);

export default router;
