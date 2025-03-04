import express from "express";
import {
	createTasksetting,
	updateTasksetting,
	getTasksetting,
	scheduleRecurringEmails,
	stopRecurringEmails,
} from "../controller/tasksetting.controller.js";

const router = express.Router();

router.post("/send", createTasksetting);
router.put("/put/:id", updateTasksetting);
router.get("/get", getTasksetting);
router.post("/send-reminder", scheduleRecurringEmails);
router.post("/stop-reminder", stopRecurringEmails);

export default router;
