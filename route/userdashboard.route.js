import { getUserData } from "../controller/userdashboard.controller.js";
import express from "express";


const router = express.Router();


router.get("/:userId",getUserData);





export default router;