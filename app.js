import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());

app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));

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
import companyRouter from "./route/companySetting.route.js";
import taskRouter from "./route/task.route.js";
import commentRouter from "./route/comment.route.js";
import workLogRoute from "./route/worklog.route.js"
import appSettingRouter from "./route/appsetting.route.js";
import historyRouter from "./route/history.route.js";
import userManagement from "./route/userManagement.route.js";
import estimateRouter from "./route/estimate.routes.js";

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/contact", contactRouter);
app.use("/api/v1/setting", companyRouter);
app.use("/api/v1/task", taskRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/workLog", workLogRoute);
app.use("/api/v1/appSetting", appSettingRouter);
app.use("/api/v1/history", historyRouter);
app.use("/api/v1/users", userManagement);
app.use("/api/v1/estimates", estimateRouter);

export default app;
