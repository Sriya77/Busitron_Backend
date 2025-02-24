import express from "express";
import {
  forgotPassword,
  loginUser,
  otpVerification,
  isEmailExist,
  profileUpdate,
  registerUser,
  resendOtp,
} from "../controller/auth.controller.js";
import authenticateUser from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.post("/otp", authenticateUser, otpVerification);

router.post("/isEmailExist", authenticateUser, isEmailExist);

router.post("/re-sendOtp", authenticateUser, resendOtp);

router.put("/profileUpdate", authenticateUser, upload, profileUpdate);

router.post("/forgot_password", authenticateUser, forgotPassword);

router.get("/profile", authenticateUser, (req, res) => {
  res.status(200).json({
    message: "This is a protected route",
    user: req.user,
  });
});

export default router;
