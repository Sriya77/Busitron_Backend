import jwt from "jsonwebtoken";
import { errorHandler } from "../utils/errorHandle.js";
import { asyncHandler } from "../utils/asyncHandle.js";
import User from "../models/user.models.js";

export const authenticateUser = asyncHandler(async (req, res, next) => {
    try {
        const token =
            req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) throw new errorHandler(401, "Unauthenticated request");

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
        if (!user) throw new errorHandler(401, "Invalid access token");

        req.user = user;
        next();
    } catch (error) {
        throw new errorHandler(401, error?.message, "Invalid access token");
    }
});