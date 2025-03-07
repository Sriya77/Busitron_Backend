import Comment from "../models/comment.models.js";
import History from "../models/history.models.js";
import { User } from "../models/user.models.js";
import { sendTaskEmail } from "../helper/sendTaskEmail.js";
import { errorHandler } from "../utils/errorHandle.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandle.js";
import { uploadToS3 } from "../services/aws.service.js";
import Task from "../models/task.models.js";
import mongoose from "mongoose";

export const createTask = asyncHandler(async (req, res) => {
    try {
        const {
            title,
            taskCategory,
            projectId,
            startDate,
            dueDate,
            assignedTo,
            assignedBy,
            description,
            label,
        } = req.body;

        const [creator, assignedUser, latestTask] = await Promise.all([
            User.findById(assignedBy).select("-password"),
            assignedTo ? User.findById(assignedTo).select("-password") : null,
            Task.findOne().sort({ createdAt: -1 }).select("taskID"),
        ]);

        if (!creator) throw new errorHandler(404, "Creator not found");

        let newTaskID = "TI-0001";
        if (latestTask && latestTask.taskID) {
            const lastNumber = parseInt(latestTask.taskID.split("-")[1], 10);
            newTaskID = `TI-${String(lastNumber + 1).padStart(4, "0")}`;
        }

        const task = await Task.create({
            taskID: newTaskID, // Assigning the generated Task ID
            title,
            description,
            assignedTo: assignedUser
                ? {
                      _id: assignedUser._id,
                      name: assignedUser.name,
                      email: assignedUser.email,
                      role: assignedUser.role,
                  }
                : null,
            assignedBy: {
                _id: creator._id,
                name: creator.name,
                email: creator.email,
                role: creator.role,
            },
            projectId,
            taskCategory,
            startDate,
            dueDate,
            label,
        });

		if (req.files?.length) {
			task.attachments = await Promise.all(
				req.files.map((file) =>
					uploadToS3(file, `tasks/${task._id}/attachments`)
				)
			);
			await task.save();
		}

		const historyMessage = assignedUser
			? `${creator.name} assigned task to ${assignedUser.name}`
			: `${creator.name} created the task`;

		if (assignedUser) {
			await sendTaskEmail(
				assignedUser.email,
				"You have been assigned a task",
				`${creator.name} has assigned you a new task: ${title}`,
				task._id
			);
		}

		await History.create({
			taskId: task._id,
			assignedBy: creator._id,
			action: "Created",
			message: historyMessage,
			changes: [],
		});

		res.status(201).json(
			new apiResponse(201, task, "Task created successfully")
		);
	} catch (error) {
		throw new errorHandler(500, error.message);
	}
});

export const getAllTasks = asyncHandler(async (req, res) => {
	try {
		const tasks = await Task.find({
			status: { $nin: ["Close", "Deleted"] },
		})
			.populate("assignedTo", "name email role")
			.populate("assignedBy", "name email role")
			.exec();

		res.status(200).json(
			new apiResponse(200, tasks, "Tasks fetched successfully.")
		);
	} catch (error) {
		throw new errorHandler(500, "Something went wrong.");
	}
});

export const getTaskById = asyncHandler(async (req, res) => {
	try {
		const { taskId } = req.params;

		const task = await Task.findById(taskId)
			.populate("assignedTo", "name email role")
			.populate("assignedBy", "name email role")
			.exec();

		if (!task) {
			throw new errorHandler(404, "Task not found");
		}

		const [comments, history] = await Promise.all([
			Comment.find({ taskId }).populate("assignedBy", "name email"),
			History.find({ taskId }).populate("assignedBy", "name email"),
		]);

		res.status(200).json(
			new apiResponse(
				200,
				{ task, comments, history },
				"Task details retrieved successfully"
			)
		);
	} catch (error) {
		throw new errorHandler(500, error.message);
	}
});

export const getAllTaskByUser = asyncHandler(async (req, res) => {
	try {
		const userId = req.user._id;

		if (userId) throw new errorHandler(400, "Unauthenticated user");

		const tasks = await Task.find({ "assignedTo._id": userId });

		if (!tasks.length)
			throw new errorHandler(400, "No tasks found for this user");

		res.status(200).json(
			new apiResponse(200, tasks, "Task details retrieved successfully")
		);
	} catch (error) {
		throw new errorHandler(500, error.message);
	}
});

export const updateTask = asyncHandler(async (req, res) => {
	const { taskId } = req.params;
	const {
		title,
		dueDate,
		taskCategory,
		label,
		assignedTo,
		description,
		priority,
		status,
	} = req.body;
	const userId = req.user._id;

	let task = await Task.findById(taskId);
	if (!task) throw new errorHandler(404, "Task not found");

	const [userChanger, previousAssignee, newAssignee] = await Promise.all([
		User.findById(userId).select("name"),
		task.assignedTo?._id
			? User.findById(task.assignedTo._id).select("name email")
			: null,
		assignedTo
			? User.findById(assignedTo).select("_id name email role")
			: null,
	]);

	const userName = userChanger?.name || "Unknown User";
	let changes = [],
		historyMessages = [];
	let emailsToNotify = new Set(
		previousAssignee?.email ? [previousAssignee.email] : []
	);

	const updateFields = {
		title,
		description,
		priority,
		status,
		dueDate,
		taskCategory,
		label,
	};
	Object.entries(updateFields).forEach(([field, newValue]) => {
		if (newValue && newValue !== task[field]) {
			changes.push({ field, oldValue: task[field], newValue });
			historyMessages.push(
				`${userName} updated ${field} from "${task[field]}" to "${newValue}"`
			);
			task[field] = newValue;
		}
	});

	if (assignedTo && assignedTo !== task.assignedTo?._id?.toString()) {
		if (!newAssignee)
			throw new errorHandler(404, "Assigned user not found");

		changes.push({
			field: "assignedTo",
			oldValue: previousAssignee?.name || "Unassigned",
			newValue: newAssignee.name,
		});

		historyMessages.push(
			`${userName} reassigned the task from ${
				previousAssignee?.name || "Unassigned"
			} to ${newAssignee.name}`
		);

		task.assignedTo = {
			_id: newAssignee._id,
			name: newAssignee.name,
			email: newAssignee.email,
			role: newAssignee.role,
		};

		if (newAssignee.email) emailsToNotify.add(newAssignee.email);
	}

	if (req.files?.length) {
		const newAttachments = await Promise.all(
			req.files.map((file) =>
				uploadToS3(file, `tasks/${task._id}/attachments`)
			)
		);
		task.attachments.push(...newAttachments);
		task.markModified("attachments");
		historyMessages.push(`${userName} added new attachments.`);
		changes.push({ field: "attachments", newValue: "Added new files" });
	} else if (req.body?.attachments) {
		task.attachments = req.body.attachments;
		task.markModified("attachments");
		historyMessages.push(`${userName} updated attachments.`);
		changes.push({
			field: "attachments",
			newValue: "Updated existing files",
		});
	}

	if (changes.length) {
		await task.save();

		await new History({
			taskId: task._id,
			assignedBy: userId,
			action: "Updated",
			message: historyMessages.join(", "),
			changes,
		}).save();

		await Promise.all(
			[...emailsToNotify].map((email) =>
				sendTaskEmail(
					email,
					"Task Updated",
					historyMessages.join(", "),
					task._id
				)
			)
		);
	}

	res.status(200).json(
		new apiResponse(200, task, "Task updated successfully")
	);
});

export const deleteTask = asyncHandler(async (req, res) => {
	const { taskId } = req.params;
	const userId = req.user._id;

	const task = await Task.findById(taskId);
	if (!task) throw new errorHandler(404, "Task not found");

	if (task.userId && task.userId.toString() !== userId) {
		throw new errorHandler(403, "Not authorized to delete this task");
	}

	const user = await User.findById(userId).select("name");
	const userName = user?.name || "Unknown User";

	const assignedUser = task.assignedTo
		? await User.findById(task.assignedTo).select("email")
		: null;

	const previousStatus = task.status;
	task.status = "Deleted";
	await task.save();

	const historyMessage = `${userName} marked the task titled "${task.title}" as Deleted.`;
	await History.create({
		taskId,
		assignedBy: userId,
		action: "Deleted",
		message: historyMessage,
		changes: [
			{ field: "status", oldValue: previousStatus, newValue: "Deleted" },
		],
	});

	if (assignedUser?.email) {
		await sendTaskEmail(
			assignedUser.email,
			"Task Status Changed",
			`The task "${task.title}" assigned to you has been marked as Deleted by ${userName}.`,
			null
		);
	}

	res.status(200).json(
		new apiResponse(
			200,
			null,
			"Task status updated to Deleted successfully"
		)
	);
});

export const gettaskbyPID = asyncHandler(async (req, res) => {
	try {
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res
				.status(400)
				.json(new apiResponse(400, null, "Invalid Project ID"));
		}

		const projectId = new mongoose.Types.ObjectId(id);
		const tasks = await Task.find({ projectId });
		const completedCount = tasks.filter(
			(task) => task.status === "Completed"
		).length;
		return res
			.status(200)
			.json(new apiResponse(200, { tasks, completedCount }, null));
	} catch (error) {
		return res
			.status(500)
			.json(new errorHandler(500, "Internal server error"));
	}
});
