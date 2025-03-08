import { Router } from "express";
import {
    inactivateUser,
    getAllUser,
    getSpecificUser,
    getUserTasks,
} from "../controller/userManagement.controller.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/all-users", authenticateUser, getAllUser);

router.get("/select-user/:id", authenticateUser, getSpecificUser);

router.put("/inactive", authenticateUser, inactivateUser);

router.get("/getUserTasks", authenticateUser, getUserTasks);

export default router;
