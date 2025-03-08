import mongoose from "mongoose";
import Task from "../models/task.models.js";
import { Ticket } from "../models/ticket.models.js";
import { asyncHandler } from "../utils/asyncHandle.js";
import projects from "../models/project.models.js";
import { errorHandler } from "../utils/errorHandle.js";
import { apiResponse } from "../utils/apiResponse.js";

export const getUserData = asyncHandler(async (req, res) => {
	try {
		const { userId } = req.params;

		if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
			throw new errorHandler(400, "Invalid or missing User ID");
		}

		const currentDate = new Date();
		let pendingTasks = 0,
			overdueTasks = 0;

		const allProjects = await projects
			.find({
				projectMembers: new mongoose.Types.ObjectId(userId),
			})
			.lean();

		const projectCount = allProjects.length;

		const userTasks = await Task.find({
			"assignedTo._id": new mongoose.Types.ObjectId(userId),
		}).lean();

		const taskCount = userTasks.length;

		userTasks.forEach((task) => {
			if (task.status !== "Completed" && task.status !== "Deleted") {
				if (new Date(task.dueDate) < currentDate) {
					overdueTasks += 1;
				} else if (task.status === "Pending") {
					pendingTasks += 1;
				}
			}
		});

		const userTickets = await Ticket.find({
			"assignedBy._id": new mongoose.Types.ObjectId(userId),
		}).lean();

		const ticketCount = userTickets.length;

		return res.status(200).json(
			new apiResponse(
				200,
				{
					taskCount,
					ticketCount,
					projectCount,
				},
				"User tasks, tickets, and projects fetched successfully"
			)
		);
	} catch (err) {
		throw new errorHandler(
			err.statusCode || 500,
			err.message || "Something went wrong"
		);
	}
});
