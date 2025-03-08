import { errorHandler } from "../utils/errorHandle.js";
import { asyncHandler } from "../utils/asyncHandle.js";
import User  from "../models/user.models.js";
import jwt from "jsonwebtoken";
import { refreshTokenGenerator } from "../helper/refreshTokenGenerator.helper.js";

export const authenticateUser = asyncHandler(async (req, res, next) => {
    try {
        let token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            const newAccessToken = await refreshTokenGenerator(req, res, next);
            if (!newAccessToken) {
                return next(new errorHandler(401, "Unauthenticated request"));
            }
            token = newAccessToken;
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
        if (!user) throw new errorHandler(401, "Invalid access token");

        req.user = decodedToken;

        next();
    } catch (error) {
        throw new errorHandler(403, error?.message || "Invalid access token");
    }
});