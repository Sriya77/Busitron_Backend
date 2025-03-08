import User from "../models/user.models.js";
import jwt from "jsonwebtoken";
import { errorHandler } from "../utils/errorHandle.js";

export const refreshTokenGenerator = async (req, res, next) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return next(new errorHandler(401, "No refresh token provided."));
        }

        const user = await User.findOne({ refreshToken }).select("-password -accessToken");
        if (!user || refreshToken !== user.refreshToken) {
            return next(new errorHandler(403, "Invalid refresh token."));
        }

        const decodedInfo = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        const newAccessToken = user.generateAccessToken();

        await User.findByIdAndUpdate(decodedInfo._id, { accessToken: newAccessToken });

        res.cookie("accessToken", newAccessToken, {
            maxAge: 5 * 60 * 1000,
            httpOnly: true,
            secure: true,
        });
        return newAccessToken;
    } catch (err) {
        return next(new errorHandler(500, err.message || "Internal server error."));
    }
};
