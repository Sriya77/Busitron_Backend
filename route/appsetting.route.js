import express from "express";
import { getAppSetting, updateAppSetting } from "../controller/appSetting.controller.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/getAppSetting", authenticateUser, getAppSetting);

router.put("/updateAppSetting/:_id", authenticateUser, updateAppSetting);

export default router;
