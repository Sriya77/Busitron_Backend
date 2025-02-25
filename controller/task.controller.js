import AWS from "aws-sdk";
import Task from "../models/task.models.js";
import Comment from "../models/comment.models.js";
import History from "../models/history.models.js";
import { User } from "../models/user.models.js";
import { sendTaskEmail } from "../helper/sendTaskEmail.js";

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const uploadToS3 = async (file, taskId) => {
  const key = `tasks/${taskId}/attachments/${Date.now()}-${file.originalname}`;
  const result = await s3.upload({
    Bucket: process.env.AWS_S3_BUCKET_TASK,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }).promise();
  return result.Location;
};

export const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, status, priority, projectId } = req.body;
    const userId = req.user._id;

    const task = new Task({ title, description, userId, assignedTo, status, priority, projectId });
    await task.save();

    if (req.files?.length > 0) {
      task.attachments = await Promise.all(req.files.map((file) => uploadToS3(file, task._id)));
      await task.save();
    }

    const creator = await User.findById(userId).select("name email");
    let historyMessage = `${creator.name} created the task`;

    if (assignedTo) {
      
      const assignedUser = await User.findById(assignedTo).select("name email");
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

    res.status(201).json({ success: true, message: "Task created", data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating task", error: error.message });
  }
};



export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find().populate("userId", "name email").populate("assignedTo", "name email");
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching tasks", error: error.message });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId).populate("userId", "name email").populate("assignedTo", "name email");
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    const comments = await Comment.find({ taskId }).populate("userId", "name email");
    const history = await History.find({ taskId }).populate("userId", "name email").sort({ createdAt: -1 });

    res.status(200).json({ success: true, task, comments, history });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching task", error: error.message });
  }
};


export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, assignedTo, status, priority } = req.body;
    const userId = req.user._id;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    const userChanger = await User.findById(userId).select("name");
    const userName = userChanger ? userChanger.name : "Unknown User";

    let changes = [];
    let historyMessages = [];
    let emailsToNotify = new Set();

    // Fetch assigned user's email
    if (task.assignedTo) {
      const assignedUser = await User.findById(task.assignedTo).select("email");
      if (assignedUser) emailsToNotify.add(assignedUser.email);
    }

    if (title && title !== task.title) {
      changes.push({ field: "title", oldValue: task.title, newValue: title });
      historyMessages.push(`${userName} updated the title from "${task.title}" to "${title}"`);
      task.title = title;
    }

    if (description && description !== task.description) {
      changes.push({ field: "description", oldValue: task.description, newValue: description });
      historyMessages.push(`${userName} updated the description`);
      task.description = description;
    }

    if (priority && priority !== task.priority) {
      changes.push({ field: "priority", oldValue: task.priority, newValue: priority });
      historyMessages.push(`${userName} changed the priority from "${task.priority}" to "${priority}"`);
      task.priority = priority;
    }

    if (status && status !== task.status) {
      changes.push({ field: "status", oldValue: task.status, newValue: status });
      historyMessages.push(`${userName} changed the status from "${task.status}" to "${status}"`);
      task.status = status;
    }

    if (assignedTo && assignedTo !== task.assignedTo?.toString()) {
      const previousAssignee = task.assignedTo ? await User.findById(task.assignedTo).select("name email") : null;
      const newAssignee = await User.findById(assignedTo).select("name email");

      changes.push({ field: "assignedTo", oldValue: previousAssignee?.name || "Unassigned", newValue: newAssignee.name });
      historyMessages.push(`${userName} reassigned the task from ${previousAssignee?.name || "Unassigned"} to ${newAssignee.name}`);
      
      task.assignedTo = assignedTo;

      if (previousAssignee?.email) emailsToNotify.add(previousAssignee.email);
      if (newAssignee?.email) emailsToNotify.add(newAssignee.email);
    }

    if (changes.length > 0) {
      await task.save();
      await History.create({ taskId: task._id, userId, action: "Updated", message: historyMessages.join(", "), changes });

      for (let email of emailsToNotify) {
        await sendTaskEmail(email, "Task Updated", historyMessages.join(", "), task._id);
      }
    }

    res.status(200).json({ success: true, message: "Task updated", data: task });
  } catch (error) {
    console.error("Error updating task:", error); 
    res.status(500).json({ success: false, message: "Error updating task", error: error.message });
  }
};



export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    if (task.userId && task.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const user = await User.findById(userId).select("name");
    const userName = user ? user.name : "Unknown User";

    const assignedUser = task.assignedTo ? await User.findById(task.assignedTo).select("email") : null;

    await Comment.deleteMany({ taskId });

    await Task.findByIdAndDelete(taskId);

    const historyMessage = `${userName} deleted the task titled "${task.title}"`;
    await History.create({ taskId, userId, action: "Deleted", message: historyMessage, changes: [] });

    if (assignedUser?.email) {
      await sendTaskEmail(
        assignedUser.email,
        "Task Deleted",
        `The task "${task.title}" assigned to you has been deleted by ${userName}.`,
        null 
      );
    }

    res.status(200).json({ success: true, message: "Task and associated comments deleted" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ success: false, message: "Error deleting task", error: error.message });
  }
};
