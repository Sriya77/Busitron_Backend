import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

import { registerSocketServer } from "./socketServer.js";
import http from "http";

const server = http.createServer(app);
registerSocketServer(server);

// console.log("REG_SOCKET:",registerSocketServer(server))

dotenv.config({ path: "./.env" });

connectDB()
    .then(() => {
        server.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.log(`Unable to connect mongoDB server.... ${err}`);
    });

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
    });
});
