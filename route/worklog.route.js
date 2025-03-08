import { Router } from "express";
import {
    assignWorkLog,
    deleteWorklog,
    fetchAllWorkLog,
    updateWorklog,
} from "../controller/worklog.controller.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/worklogs/:taskId", authenticateUser, fetchAllWorkLog);

router.post("/create-workLog/:taskId", authenticateUser, assignWorkLog);

router.put("/update-workLog/:id", authenticateUser, updateWorklog);

router.delete("/delete-workLog/:id", authenticateUser, deleteWorklog);

export default router;
