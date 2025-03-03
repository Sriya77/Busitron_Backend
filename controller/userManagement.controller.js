import { User } from "../models/user.models.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandle.js";
import { errorHandler } from "../utils/errorHandle.js";

export const getAllUser = asyncHandler(async (req, res) => {
    try {
        const allUsers = await User.find({isActive: "active"}).select("-password -accessToken -refreshToken");

        if (!allUsers || allUsers.length === 0) {
            throw new errorHandler(404, "No user record present");
        }
        res.status(200).json(new apiResponse(200, allUsers, "User record fetched successfully."));
    } catch (error) {
        throw new errorHandler(500, "Something went wrong.");
    }
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
    const { id, isActiveUser } = req.body;
    if (!id) {
        throw new errorHandler(400, "User id is required.");
    }
    try {
        let updatedResponse;
        if (isActiveUser === "active") {
            updatedResponse = await User.findByIdAndUpdate(id, {
                isActive: "inActive",
            }).select("-password -accessToken -refreshToken");
        } else {
            updatedResponse = await User.findByIdAndUpdate(id, {
                isActive: "active",
            }).select("-password -accessToken -refreshToken");
        }

        res.status(200).json(new apiResponse(200, updatedResponse, "User deleted successfully."));
    } catch (error) {
        throw new errorHandler(500, "Something went wrong.");
    }
});
