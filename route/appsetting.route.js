import express from "express";
import {
    getAppSetting,
    updateAppSetting,
} from "../controller/appSetting.controller.js";

const router = express.Router();

router.get("/getAppSetting", getAppSetting);

router.put("/updateAppSetting/:_id", updateAppSetting);

export default router;
