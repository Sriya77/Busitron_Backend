import express from "express";
import { sendContactEmail } from "../controller/contact.controller.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/emailRequest", authenticateUser, sendContactEmail);

export default router;
