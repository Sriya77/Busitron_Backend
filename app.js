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
import tasksettings from "./route/tasksetting.route.js";
import commentRouter from "./route/comment.route.js";
import workLogRoute from "./route/worklog.route.js";
import appSettingRouter from "./route/appsetting.route.js";
import historyRouter from "./route/history.route.js";
import userManagement from "./route/userManagement.route.js";
import role_permissions from "./route/role_permissions.route.js";
import modoulesettingsRoute from "./route/moduleSettings.route.js";
import estimateRouter from "./route/estimate.routes.js";
import performanceRouter from "./route/performance.route.js";
import ticketRouter from "./route/ticket.route.js";
import projectRoutes from "./route/project.route.js";
import messageRouter from "./route/message.route.js";
import userdashboard from "./route/userdashboard.route.js";

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/contact", contactRouter);
app.use("/api/v1/setting", companyRouter);
app.use("/api/v1/modulesettings", modoulesettingsRoute);
app.use("/api/v1/role_permissions", role_permissions);
app.use("/api/v1/tasksettings", tasksettings);
app.use("/api/v1/task", taskRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/workLog", workLogRoute);
app.use("/api/v1/appSetting", appSettingRouter);
app.use("/api/v1/history", historyRouter);
app.use("/api/v1/users", userManagement);
app.use("/api/v1/estimates", estimateRouter);
app.use("/api/v1/performanceTracking", performanceRouter);
app.use("/api/v1/ticket", ticketRouter);
app.use("/api/v1/project", projectRoutes);
app.use("/api/v1/message", messageRouter);
app.use("/api/v1/userdashboard",userdashboard);

export default app;
