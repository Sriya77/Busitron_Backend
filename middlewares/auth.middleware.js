import jwt from "jsonwebtoken";
import { errorHandler } from "../utils/errorHandle.js";

const authenticateUser = (req, res, next) => {
    const token = req.cookies["accessToken"] || req.headers["authorization"]?.split(" ")[1];

    if (!token) {
        throw new errorHandler(401, "token is not generated");
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        throw new errorHandler(403, "Invalid or expired token");
        next();
    }
};

export default authenticateUser;
