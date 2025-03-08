import jwt from "jsonwebtoken";

const { ACCESS_TOKEN_SECRET } = process.env;
const verifyTokenSocket = (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        if (!token) {
            throw new Error("Token not provided");
        }

        const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);

        // Attach user data to the socket
        socket.user = decoded._id;
        next();
    } catch (error) {
        next(new Error("NOT_AUTHORIZED"));
    }
};

export default verifyTokenSocket;
