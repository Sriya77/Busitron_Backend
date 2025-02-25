import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());

app.use(cookieParser());

app.use(
	cors({
		origin: [
			"http://localhost:5173",
			"http://localhost:5174",
			"http://localhost:5175",
		],
		credentials: true,
	})
);

import authRouter from "./route/auth.route.js";
import contactRouter from "./route/contact.route.js";
import taskRouter from "./route/task.route.js";
import commentRouter from "./route/comment.route.js"



app.use("/api/v1/auth", authRouter);
app.use("/api/v1/contact", contactRouter);
app.use("/api/v1/task", taskRouter);
app.use("/api/v1/comment", commentRouter);


import { companyRouter } from "./route/companySetting.route.js";

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/contact", contactRouter);
app.use("/api/v1/setting", companyRouter);

export default app;
 