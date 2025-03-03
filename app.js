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
import tasksettingRoute from "./route/tasksetting.route.js";
import modoulesettingsRoute from "./route/moduleSettings.route.js";
import role_permissionsRoute from "./route/role_permissions.route.js";

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/contact", contactRouter);
app.use("/api/v1/tasksettings", tasksettingRoute);
app.use("/api/v1/modulesettings",modoulesettingsRoute);
app.use("/api/v1/role_permissions",role_permissionsRoute);


export default app;
