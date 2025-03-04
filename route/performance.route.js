import express from "express";
import {
    getParticularUserTask,
    getCombinedStatistics,
} from "../controller/performance.controller.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.get("/getParticularUserTask/:userId", authenticateUser, getParticularUserTask);

router.get("/getCombinedStatistics", authenticateUser, getCombinedStatistics);

export default router;
