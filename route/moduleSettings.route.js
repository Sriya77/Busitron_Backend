import { createModuleSettings, getAllModuleSettings, updateModuleSettings } from "../controller/moduleSettings.controller.js";
import express from "express";

const router = express.Router();


router.post("/", createModuleSettings);
router.get("/", getAllModuleSettings);
router.put("/:id", updateModuleSettings);

export default router;