import Task from "../models/task.models.js";
import Comment from "../models/comment.models.js";
import History from "../models/history.models.js";
import { User } from "../models/user.models.js";
import { sendTaskEmail } from "../helper/sendTaskEmail.js";
import { errorHandler } from "../utils/errorHandle.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandle.js";
import { uploadToS3 } from "../services/aws.service.js";

export const createTask = asyncHandler(async (req, res) => {
    const { title, description, assignedTo, status, priority, projectId } = req.body;
    const userId = req.user._id;

    const existingTask = await Task.findOne({ title, projectId });
    if (existingTask)
        throw new errorHandler(400, "A task with this title already exists in the project");

    const task = await new Task({
        title,
        description,
        userId,
        assignedTo,
        status,
        priority,
        projectId,
    }).save();

    if (req.files?.length) {
        task.attachments = await Promise.all(
            req.files.map((file) => uploadToS3(file, `tasks/${task._id}/attachments`))
        );
        await task.save();
    }

    const creator = await User.findById(userId).select("name email");
    if (!creator) throw new errorHandler(404, "Creator not found");

    let historyMessage = `${creator.name} created the task`;

    if (assignedTo) {
        const assignedUser = await User.findById(assignedTo).select("name email");
        if (!assignedUser) throw new errorHandler(404, "Assigned user not found");

        historyMessage = `${creator.name} assigned task to ${assignedUser.name}`;

        await sendTaskEmail(
            assignedUser.email,
            "You have been assigned a task",
            `${creator.name} has assigned you a new task: ${title}`,
            task._id
        );
    }

    await History.create({
        taskId: task._id,
        userId,
        action: "Created",
        message: historyMessage,
        changes: [],
    });

    res.status(201).json(new apiResponse(201, task, "Task created successfully"));
});

export const getTasks = asyncHandler(async (req, res) => {
    const tasks = await Task.find()
        .populate("userId", "name email")
        .populate("assignedTo", "name email");

    if (!tasks.length) throw new errorHandler(404, "No tasks found");

    res.status(200).json(new apiResponse(200, tasks, "Tasks retrieved successfully"));
});

export const getTaskById = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
        .populate("userId", "name email")
        .populate("assignedTo", "name email");

    if (!task) throw new errorHandler(404, "Task not found");

    const [comments, history] = await Promise.all([
        Comment.find({ taskId }).populate("userId", "name email"),
        History.find({ taskId }).populate("userId", "name email").sort({ createdAt: -1 }),
    ]);

    res.status(200).json(
        new apiResponse(200, { task, comments, history }, "Task details retrieved successfully")
    );
});

export const updateTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { title, description, assignedTo, status, priority, removedAttachments } = req.body;
    const userId = req.user._id;

    const task = await Task.findById(taskId);
    if (!task) throw new errorHandler(404, "Task not found");

    const userChanger = await User.findById(userId).select("name");
    const userName = userChanger?.name || "Unknown User";

    let changes = [];
    let historyMessages = [];
    let emailsToNotify = new Set();

    if (task.assignedTo) {
        const assignedUser = await User.findById(task.assignedTo).select("email");
        if (assignedUser) emailsToNotify.add(assignedUser.email);
    }

    const updateField = (field, newValue, label) => {
        if (newValue && newValue !== task[field]) {
            changes.push({ field, oldValue: task[field], newValue });
            historyMessages.push(
                `${userName} updated ${label} from "${task[field]}" to "${newValue}"`
            );
            task[field] = newValue;
        }
    };

    updateField("title", title, "title");
    updateField("description", description, "description");
    updateField("priority", priority, "priority");
    updateField("status", status, "status");

    if (assignedTo && assignedTo !== task.assignedTo?.toString()) {
        const previousAssignee = task.assignedTo
            ? await User.findById(task.assignedTo).select("name email")
            : null;
        const newAssignee = await User.findById(assignedTo).select("name email");

        changes.push({
            field: "assignedTo",
            oldValue: previousAssignee?.name || "Unassigned",
            newValue: newAssignee.name,
        });
        historyMessages.push(
            `${userName} reassigned the task from ${previousAssignee?.name || "Unassigned"} to ${
                newAssignee.name
            }`
        );

        task.assignedTo = assignedTo;

        if (previousAssignee?.email) emailsToNotify.add(previousAssignee.email);
        if (newAssignee?.email) emailsToNotify.add(newAssignee.email);
    }

    // Handle new file uploads
    if (req.files?.length) {
        const newAttachments = await Promise.all(
            req.files.map((file) => uploadToS3(file, `tasks/${task._id}/attachments`))
        );
        task.attachments.push(...newAttachments);
        historyMessages.push(`${userName} added new attachments.`);
        changes.push({ field: "attachments", newValue: "Added new files" });
    }

    if (changes.length > 0) {
        await task.save();
        await History.create({
            taskId: task._id,
            userId,
            action: "Updated",
            message: historyMessages.join(", "),
            changes,
        });

        await Promise.all(
            [...emailsToNotify].map((email) =>
                sendTaskEmail(email, "Task Updated", historyMessages.join(", "), task._id)
            )
        );
    }

    res.status(200).json(new apiResponse(200, task, "Task updated successfully"));
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

    await Comment.deleteMany({ taskId });

    await Task.findByIdAndDelete(taskId);

    const historyMessage = `${userName} deleted the task titled "${task.title}"`;
    await History.create({
        taskId,
        userId,
        action: "Deleted",
        message: historyMessage,
        changes: [],
    });

    if (assignedUser?.email) {
        await sendTaskEmail(
            assignedUser.email,
            "Task Deleted",
            `The task "${task.title}" assigned to you has been deleted by ${userName}.`,
            null
        );
    }

    res.status(200).json(
        new apiResponse(200, null, "Task and associated comments deleted successfully")
    );
});
