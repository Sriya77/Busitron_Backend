import { User } from "../models/user.models.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandle.js";
import { errorHandler } from "../utils/errorHandle.js";

import sendUserCredential from "../helper/sendUserCredential.helper.js";
import sendOtpForValidation from "../helper/sendOtpForValidation.helper.js";

import generateRandomPassword from "../helper/generateRandomPassword.helper.js";
import generateOtp from "../helper/generateOtp.helper.js";

import sendResetPasswordRequest from "../helper/sendResetPasswordRequest.helper.js";
import sendResetPasswordConfirmation from "../helper/sendResetPasswordConfirmation.helper.js";

export const registerUser = asyncHandler(async (req, res) => {
    try {
        const { email } = req.body;
        const password = generateRandomPassword();

        if (!email || !password) throw new errorHandler(400, "email or password missing");

        const existedUser = await User.findOne({ email }).select("-password");

        if (existedUser) throw new errorHandler(409, "User already exists");

        const user = await User.create({
            email,
            password,
        });

        const result = await sendUserCredential(email, password);

        if (!result.success) {
            throw new errorHandler(400, "some thing went wrong");
        }

        res.status(201).json(
            new apiResponse(201, { id: user._id, email: email }, "register successfully")
        );
    } catch (err) {
        throw new errorHandler(500, err.message);
    }
});

export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) throw new errorHandler(400, "Credential required!");

        const user = await User.findOne({ email });

        if (!user) throw new errorHandler(401, "Invalid Credential");
        const isPasswordValid = await user.isPasswordCorrect(password);
        if (!isPasswordValid) throw new errorHandler(401, "Invalid Credential");

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        await User.findOneAndUpdate(
            {
                email: user.email,
            },
            {
                accessToken,
                refreshToken,
            }
        );

        if (!user.isValid) {
            const otp = generateOtp();
            const response = await sendOtpForValidation(email, otp);

            if (!response.success) {
                throw new errorHandler(401, "Nodemailer error.");
            }
            await User.findOneAndUpdate({ email }, { otp }, { new: true, upsert: false });
        }

        res.cookie("accessToken", accessToken)
            .cookie("refreshToken", refreshToken)
            .status(200)
            .json(new apiResponse(200, { id: user._id, email: email }, "Login successful"));
    } catch (error) {
        throw new errorHandler(500, error.message);
    }
});

export const otpVerification = asyncHandler(async (req, res) => {
    try {
        const { otp } = req.body;
        const user = await User.findById(req.user._id).select("-password");
        if (!user) throw new errorHandler(404, "User not found");

        const getOtp = user.otp;
        if (otp !== getOtp) {
            throw new errorHandler(400, "otp is invalid");
        }
        await User.findByIdAndUpdate(req.user._id, {
            isValid: true,
        });
        res.status(201).json(new apiResponse(201, null, "otp verified successfully"));
    } catch (err) {
        throw new errorHandler(500, err.message);
    }
});

export const profileUpdate = asyncHandler(async (req, res) => {
    const { phoneNumber, fullName, avatar, dateOfBirth } = req.body;

    if (!phoneNumber || !fullName || !avatar || !dateOfBirth) {
        throw new errorHandler(400, "all fields are required");
    }

    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                phoneNumber,
                name: fullName,
                avatar,
                dateOfBirth,
            },
            { new: true }
        );

        res.status(201).json(new apiResponse(201, user, "profile updated successfully"));
    } catch (err) {
        throw new errorHandler(400, err.message);
    }
});

export const isEmailExist = asyncHandler(async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) throw new errorHandler(400, "Email must be required");

        const checkMail = await User.findOne({ email }).select("-password");
        if (!checkMail) throw new errorHandler(400, "Invalid email.");

        const response = await sendResetPasswordRequest(email);

        if (!response.success) {
            throw new errorHandler(500, "Forgot password mail not send ");
        }

        res.status(200).json(new apiResponse(200, null, "Forgot password link send Successfully"));
    } catch (err) {
        throw new errorHandler(500, err.message);
    }
});

export const resendOtp = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (!user) throw new errorHandler(404, "user not found");
        const otp = generateOtp();

        await User.findByIdAndUpdate(req.user._id, { otp });
        const response = await sendOtpForValidation(user.email, { otp });
        if (!response.success) throw new errorHandler(400, "otp not send successfully");

        res.status(201).json(new apiResponse(201, null, "otp send successfully"));
    } catch (err) {
        throw new errorHandler(500, err.message);
    }
});

export const forgotPassword = asyncHandler(async (req, res) => {
    try {
        const { newPassword, conformPassword } = req.body;
        if (!newPassword || !conformPassword) throw new errorHandler(400, "All fields required");

        if (newPassword !== conformPassword) {
            throw new errorHandler(400, "newPassword and conformPassword must be same");
        }

        const user = await User.findById(req.user._id).select("-password");
        if (!user) throw new errorHandler(404, "user not found");

        await User.findByIdAndUpdate(req.user._id, { password: newPassword });

        const response = await sendResetPasswordConfirmation(user.email);

        if (!response.success) {
            throw new errorHandler(400, "Nodemailer error.");
        }

        res.status(200).json(new apiResponse(200, null, "your password changed  Successfully"));
    } catch (err) {
        throw new errorHandler(500, err.message);
    }
});
