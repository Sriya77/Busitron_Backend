import express from "express";
import {
    forgotPassword,
    loginUser,
    otpVerification,
    isEmailExist,
    profileUpdate,
    registerUser,
    resendOtp,
    logoutUser,
    changePassword,
} from "../controller/auth.controller.js";
import { upload } from "../middlewares/upload.middleware.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.post("/otp", authenticateUser, otpVerification);

router.post("/re-sendOtp", authenticateUser, resendOtp);

router.put("/profileUpdate", authenticateUser, upload, profileUpdate);

router.post("/isEmailExist", isEmailExist);

router.post("/forgot_password", forgotPassword);

router.post("/logout", authenticateUser, logoutUser);

router.post("/changePassword", authenticateUser, changePassword);

router.get("/profile", authenticateUser, (req, res) => {
    res.status(200).json({
        message: "This is a protected route",
        user: req.user,
    });
});

export default router;
