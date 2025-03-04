import {
	createModuleSettings,
	deletemodulesettings,
	getAllModuleSettings,
	updateModuleSettings,
} from "../controller/moduleSettings.controller.js";
import express from "express";

const router = express.Router();

router.post("/", createModuleSettings);
router.get("/", getAllModuleSettings);
router.put("/:id", updateModuleSettings);
router.delete("/:id", deletemodulesettings);
export default router;
