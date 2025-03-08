import Comment from "../models/comment.models.js";
import History from "../models/history.models.js";
import User from "../models/user.models.js";
import Task from "../models/task.models.js";
import { extractMentions, sendTaskEmail } from "../helper/sendTaskEmail.js";
import { errorHandler } from "../utils/errorHandle.js";
import { asyncHandler } from "../utils/asyncHandle.js";
import { apiResponse } from "../utils/apiResponse.js";

export const createComment = asyncHandler(async (req, res) => {
    try {
        const { taskId } = req.params;
        const { commentText } = req.body;
        const user = req.user;

        const task = await Task.findById(taskId);
        if (!task) throw new errorHandler(404, "Task not found");

        const newComment = await Comment.create({
            taskId: task._id,
            commentedBy: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            commentText,
        });

        const historyMessage = `${user.name} added a comment: "${commentText}"`;

        await History.create({
            taskId: task._id,
            assignedBy: user._id,
            action: "Comment Added",
            message: historyMessage,
        });

        return res.status(201).json(new apiResponse(201, newComment, "Comment added successfully"));
    } catch (error) {
        throw new errorHandler(500, error.message);
    }
});

export const getCommentsByTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    const taskExists = await Task.exists({ _id: taskId });
    if (!taskExists) throw new errorHandler(404, "Task not found");

    const comments = await Comment.find({ taskId }).populate("commentedBy", "name email");

    return res.status(200).json(new apiResponse(200, comments, "Comments fetched successfully"));
});

export const editComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { commentText } = req.body;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId).select(
        "commentedBy createdAt taskId commentText"
    );
    if (!comment) throw new errorHandler(404, "Comment not found");

    const oldComment = comment?.commentText;

    if (comment.commentedBy._id.toString() !== userId.toString())
        throw new errorHandler(403, "Not authorized to edit this comment");

    if ((Date.now() - comment.createdAt.getTime()) / 60000 > 10) {
        throw new errorHandler(403, "Comment can only be edited within 10 minutes");
    }

    await Comment.updateOne(
        { _id: commentId },
        { commentText: commentText || comment.commentText }
    );

    const latestHistory = await History.findOne({ taskId: comment.taskId })
        .sort({ createdAt: -1 })
        .lean();

    const newChange = {
        field: "commentText",
        oldValue: oldComment,
        newValue: commentText,
    };

    if (latestHistory) {
        await History.updateOne({ _id: latestHistory._id }, { $push: { changes: newChange } });
    } else {
        await History.create({
            taskId: comment.taskId,
            assignedBy: userId,
            action: "Comment Edited",
            message: `Comment updated: "${commentText}"`,
            changes: [newChange],
        });
    }

    return res
        .status(200)
        .json(new apiResponse(200, { commentText }, "Comment updated successfully"));
});

export const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId).select(
        "commentedBy createdAt taskId commentText"
    );
    if (!comment) throw new errorHandler(404, "Comment not found");

    if (comment.commentedBy._id.toString() !== userId.toString())
        throw new errorHandler(403, "Not authorized to edit this comment");

    if ((Date.now() - comment.createdAt.getTime()) / 60000 > 10) {
        throw new errorHandler(403, "Comment can only be deleted within 10 minutes");
    }

    await Comment.deleteOne({ _id: commentId });

    await History.create({
        taskId: comment.taskId,
        assignedBy: userId,
        action: "Comment Deleted",
        message: `${req.user.name} deleted a comment: "${comment.commentText}"`,
    });

    return res.status(200).json(new apiResponse(200, null, "Comment deleted successfully"));
});

export const addReply = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { commentText } = req.body;
    const { _id: userId, name: userName, email: userEmail } = req.user;

    if (!commentText || typeof commentText !== "string")
        throw new errorHandler(400, "Reply commentText is required and must be a string");

    const comment = await Comment.findById(commentId).populate("taskId", "assignedTo").lean();

    if (!comment) throw new errorHandler(404, "Comment not found");

    const mentionedUsers = await extractMentions(commentText).catch(() => []);
    const recipients = new Set(
        [
            ...mentionedUsers.map((u) => u.email).filter(Boolean),
            comment.commentedBy?.email,
            comment.taskId?.assignedTo?.email,
            userEmail,
        ].filter(Boolean)
    );

    let emailStatus = "Success";
    if (recipients.size > 0) {
        try {
            await Promise.all(
                [...recipients].map((email) =>
                    sendTaskEmail(
                        email,
                        "New Reply",
                        `${userName} replied: "${commentText}"`,
                        comment.taskId?._id
                    )
                )
            );
        } catch (emailError) {
            emailStatus = `Failed: ${emailError.message}`;
        }
    }

    const reply = { userId, userName, userEmail, commentText, createdAt: new Date() };

    await Comment.findByIdAndUpdate(commentId, {
        $push: { replies: reply },
    });

    return res
        .status(201)
        .json(new apiResponse(201, { reply, emailStatus }, "Reply added successfully"));
});
