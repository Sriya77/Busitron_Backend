import mongoose from "mongoose";
import Task from "../models/task.models.js";
import { User } from "../models/user.models.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandle.js";
import { errorHandler } from "../utils/errorHandle.js";

export const getAllUser = asyncHandler(async (req, res, next) => {
    const { _id } = req.user;
    const checkRole = await User.findById(_id).select("-password -accessToken -refreshToken");

    if (!checkRole) {
        return next(new errorHandler(404, "User not found"));
    }

    let allUsers = [];

    if (checkRole.role === "SuperAdmin") {
        allUsers = await User.find({
            isActive: "active",
            role: "Admin",
        }).select("-password -accessToken -refreshToken");
    } else if (checkRole.role === "Admin" || checkRole.role === "Employee") {
        allUsers = await User.find({
            isActive: "active",
            role: "Employee",
            companyName: checkRole.companyName,
        }).select("-password -accessToken -refreshToken");
    }

    res.status(200).json(new apiResponse(200, allUsers, "User record fetched successfully."));
});

export const getSpecificUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
        throw new errorHandler(400, "Need information");
    }
    try {
        const specificUserResponse = await User.findById(id).select(
            "-password -accessToken -refreshToken"
        );
        if (!specificUserResponse) {
            throw new errorHandler(404, "User not found.");
        }
        res.status(200).json(
            new apiResponse(200, specificUserResponse, "User data fetched successfully.")
        );
    } catch (error) {
        throw new errorHandler(500, "Something went wrong.");
    }
});

export const inactivateUser = asyncHandler(async (req, res) => {
    const { id, isActiveUser, role, designation } = req.body;

    if (!id) {
        throw new errorHandler(400, "User id is required.");
    }
    try {
        let updatedResponse;
        if (isActiveUser === "active" && !role && !designation) {
            updatedResponse = await User.findByIdAndUpdate(id, {
                isActive: "inActive",
            }).select("-password -accessToken -refreshToken");
        }

        if (isActiveUser === "inActive" && !role && !designation) {
            updatedResponse = await User.findByIdAndUpdate(id, {
                isActive: "active",
            }).select("-password -accessToken -refreshToken");
        }

        if (!isActiveUser && role && designation) {
            updatedResponse = await User.findByIdAndUpdate(id, {
                isActive: "active",
                role,
                designation,
            }).select("-password -accessToken -refreshToken");
        }

        res.status(200).json(new apiResponse(200, updatedResponse, "User deleted successfully."));
    } catch (error) {
        throw new errorHandler(500, "Something went wrong.");
    }
});

export const getUserTasks = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;

        const currentDate = new Date();
        let Pending = 0,
            overDue = 0;

        const getTasks = await Task.find({
            "assignedTo._id": new mongoose.Types.ObjectId(userId),
        });
        if (!getTasks && getTasks.length === 0)
            throw new errorHandler(404, "No user record present");

        for (let i = 0; i < getTasks.length; i++) {
            if (getTasks[i].status !== "Completed" && getTasks[i].dueDate < currentDate) {
                getTasks[i].status = "overDue";
                overDue += 1;
            } else if (getTasks[i].status === "Pending") Pending += 1;
        }

        res.status(200).json(
            new apiResponse(200, { getTasks, Pending, overDue }, "user tasks fetched successfully")
        );
    } catch (err) {
        throw new errorHandler(500, err.message);
    }
});
