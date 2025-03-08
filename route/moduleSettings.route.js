import {
    createModuleSettings,
    deletemodulesettings,
    getAllModuleSettings,
    updateModuleSettings,
} from "../controller/moduleSettings.controller.js";
import express from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", authenticateUser, createModuleSettings);
router.get("/", authenticateUser, getAllModuleSettings);
router.put("/:id", authenticateUser, updateModuleSettings);
router.delete("/:id", authenticateUser, deletemodulesettings);
export default router;
