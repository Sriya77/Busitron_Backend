import { Router } from "express";
import {
    inactivateUser,
    getAllUser,
    getSpecificUser,
} from "../controller/userManagement.controller.js";

const router = Router();

router.get("/all-users", getAllUser);
router.get("/select-user/:id", getSpecificUser);
router.put("/inactive", inactivateUser);

export default router;
