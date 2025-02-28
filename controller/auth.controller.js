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
import { uploadToS3 } from "../services/aws.service.js";
import bcrypt from "bcryptjs";

export const registerUser = asyncHandler(async (req, res) => {
    try {
        const { email, designation, employeeId, message } = req.body;
        const password = generateRandomPassword();

        if (!email || !password || !designation || !employeeId) {
            throw new errorHandler(400, "Required fields are missing");
        }

        const existedUser = await User.findOne({ email }).select("-password");
        if (existedUser) throw new errorHandler(409, "User already exists");

        const existedEmployeeId = await User.findOne({ employeeId });
        if (existedEmployeeId) throw new errorHandler(409, "Employee ID already exists");

        const user = await User.create({
            email,
            password,
            designation,
            employeeId,
            message,
        });

        const result = await sendUserCredential(email, password);

        if (!result.success) {
            throw new errorHandler(400, "Something went wrong while sending email");
        }

        res.status(201).json(
            new apiResponse(
                201,
                { id: user._id, email, designation, employeeId, message },
                "Registered successfully"
            )
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

        const { password: pass, ...rest } = user._doc;

        res.cookie("accessToken", accessToken)
            .cookie("refreshToken", refreshToken)
            .status(200)
            .json(new apiResponse(200, rest, "Login successful"));
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
        const otpUser = await User.findByIdAndUpdate(req.user._id, {
            isValid: true,
        });
        res.status(201).json(new apiResponse(201, otpUser, "otp verified successfully"));
    } catch (err) {
        throw new errorHandler(500, err.message);
    }
});

export const profileUpdate = asyncHandler(async (req, res) => {
    if (
        !req.body.phone ||
        !req.body.fullName ||
        !req.body.dob ||
        !req.body.gender ||
        !req.body.maritalStatus
    ) {
        throw new errorHandler(400, "All fields are required");
    }

    let avatarUrl = "";
    if (req.file || req.body.profilePic) {
        avatarUrl = await uploadToS3(req.file);
    }

    try {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                phoneNumber: req.body.phone,
                name: req.body.fullName,
                avatar: avatarUrl,
                dateOfBirth: req.body.dob,
                gender: req.body.gender,
                maritalStatus: req.body.maritalStatus,
                address: req.body.address,
            },
            { new: true }
        );

        const user = await User.findById(req.user._id);
        res.status(201).json(new apiResponse(201, user, "Profile updated successfully"));
    } catch (err) {
        throw new errorHandler(400, err.message);
    }
});

export const resendOtp = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");

        if (!user) throw new errorHandler(404, "user not found");
        const otp = generateOtp();

        await User.findByIdAndUpdate(req.user._id, { otp });
        const response = await sendOtpForValidation(user.email, otp);
        if (!response.success) throw new errorHandler(400, "otp not send successfully");

        res.status(201).json(new apiResponse(201, null, "otp send successfully"));
    } catch (err) {
        throw new errorHandler(500, err.message);
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

export const forgotPassword = asyncHandler(async (req, res) => {
    try {
        const { formData } = req.body;

        const { email, password, confirmPassword } = formData;

        if (!password || !confirmPassword) throw new errorHandler(400, "All fields required");

        if (password !== confirmPassword)
            throw new errorHandler(400, "Password and confirm password not match");

        const user = await User.findOne({ email });

        if (!user) throw new errorHandler(404, "user not found");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await User.findOneAndUpdate({ email: user.email }, { password: hashedPassword });

        const response = await sendResetPasswordConfirmation(user.email);

        if (!response.success) throw new errorHandler(400, "Nodemailer error.");

        res.status(200).json(new apiResponse(200, null, "your password changed Successfully"));
    } catch (err) {
        throw new errorHandler(500, err.message);
    }
});

export const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: null,
            },
        },
        {
            new: true,
        }
    );
    const option = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", option)
        .clearCookie("refreshToken", option)
        .json(new apiResponse(200, {}, "User logout successfully "));
});

export const changePassword = asyncHandler(async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const { _id } = req.params;

        if (!currentPassword || !newPassword || !confirmPassword)
            throw new errorHandler(400, "All fields are required");

        const user = await User.findById(_id);

        if (!user) throw new errorHandler(404, "user not found");

        const checkPassword = user.isPasswordCorrect(currentPassword);

        if (!checkPassword) throw new errorHandler(400, "Invalid password");

        if (newPassword !== confirmPassword)
            throw new errorHandler(400, "new Password and confirm password does not matched");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await User.findByIdAndUpdate(_id, { password: hashedPassword });

        res.status(200).json(new apiResponse(200, null, "Your password has successfully changed."));
    } catch (err) {
        throw new errorHandler(500, err.message);
    }
});
