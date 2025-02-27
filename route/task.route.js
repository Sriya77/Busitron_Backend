import express from "express";
import {
	createTask,
	deleteTask,
	getTaskById,
	getTasks,
	updateTask,
} from "../controller/task.controller.js";
import authenticateUser from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/fileupload.middleware.js";

const router = express.Router();


router.get("/gettasks", authenticateUser, getTasks);
router.post(
	"/postask",
	authenticateUser,
	upload.array("attachments", 5),
	createTask
);
router.get("/:taskId", authenticateUser, getTaskById);
router.put("/:taskId", authenticateUser, updateTask);
router.delete("/:taskId", authenticateUser, deleteTask);

export default router;
