import express from "express";

import { authenticateUser } from "../middlewares/auth.middleware.js";
import { getHistoryById } from "../controller/history.controller.js";

const router = express.Router();

router.get("/getHistory/:taskId", authenticateUser, getHistoryById);

export default router;
