import { Server } from "socket.io";

import authSocket from "./middlewares/authSocket.middleware.js";

// Socket Handlers
import disconnectHandler from "./socketHandlers/disconnectHandler.js";
import chatHistoryHandler from "./socketHandlers/getMessageHistoryHandler.js";
import newConnectionHandler from "./socketHandlers/newConnectionHandler.js";
import newMessageHandler from "./socketHandlers/newMessageHandler.js";

import { upload } from "./middlewares/fileupload.middleware.js";

export const registerSocketServer = (server) => {
    console.log(server,"SERVER")
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    console.log(io,"IO")

    // Authenticate socket connection
    io.use(authSocket);

    io.on("connection", (socket) => {
        newConnectionHandler(socket, io);
        console.log("connected")
        socket.on("disconnect", () => disconnectHandler(socket));
        socket.on("new-message", (data) => {
            if (data) {
                upload.array("media", 8);
                newMessageHandler(socket, data, io);
            }
        });
        socket.on("direct-chat-history", (data) => chatHistoryHandler(socket, data));
    });

    setInterval(() => {}, 1000 * 8);
};
