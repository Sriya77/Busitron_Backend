import Comment from "../models/comment.models.js";
import History from "../models/history.models.js";
import { User } from "../models/user.models.js";
import Task from "../models/task.models.js";
import { extractMentions, sendTaskEmail } from "../helper/sendTaskEmail.js";
import { errorHandler } from "../utils/errorHandle.js";
import { asyncHandler } from "../utils/asyncHandle.js";
import { apiResponse } from "../utils/apiResponse.js";
import { uploadToS3 } from "../services/aws.service.js";



export const addComment = asyncHandler(async (req, res) => {
	const { taskId } = req.params;
	const { description } = req.body;
	const userId = req.user._id;

	const [task, user] = await Promise.all([
		Task.findById(taskId),
		User.findById(userId).select("name email"),
	]);

	if (!task) throw new errorHandler(404, "Task not found");
	if (!user) throw new errorHandler(404, "User not found");

	const mediaFiles = req.files || [];
	const uploadedMedia = await Promise.all(
		mediaFiles.map((file) =>
			uploadToS3(file, `tasks/${taskId}/comments/attachments`)
		)
	);

	const [taskAssignee, taskCreator] = await Promise.all([
		User.findById(task.assignedTo).select("email"),
		User.findById(task.createdBy).select("email"),
	]);

	const mentionedUsers = await extractMentions(description);
	const mentionedEmails = mentionedUsers.map((u) => u.email).filter(Boolean);

	const recipients = new Set(
		[taskAssignee?.email, taskCreator?.email, ...mentionedEmails].filter(
			Boolean
		)
	);

	if (recipients.size > 0) {
		try {
			await Promise.all(
				[...recipients].map((email) =>
					sendTaskEmail(
						email,
						"New Comment Added",
						`${user.name} added a comment`,
						taskId
					)
				)
			);
		} catch (emailError) {
			throw new errorHandler(
				500,
				`Email notification failed. Comment not saved: ${emailError}`
			);
		}
	}

	const newComment = await Comment.create({
		taskId,
		userId,
		description,
		media: uploadedMedia,
	});

	await History.create({
		taskId,
		userId,
		action: "Comment Added",
		message: `${user.name} commented: "${description}"`,
	});

	return res
		.status(201)
		.json(new apiResponse(201, newComment, "Comment added successfully"));
});

export const getCommentsByTask = asyncHandler(async (req, res) => {
	const { taskId } = req.params;

	const taskExists = await Task.countDocuments({ _id: taskId });
	if (!taskExists) throw new errorHandler(404, "Task not found");

	const comments = await Comment.find({ taskId }).populate(
		"userId",
		"name email"
	);

	return res
		.status(200)
		.json(new apiResponse(200, comments, "Comments fetched successfully"));
});

export const editComment = asyncHandler(async (req, res) => {
	const { commentId } = req.params;
	const { description } = req.body;
	const userId = req.user._id;

	const comment = await Comment.findById(commentId).select(
		"userId createdAt taskId media description"
	);
	if (!comment) throw new errorHandler(404, "Comment not found");

	if (comment.userId.toString() !== userId)
		throw new errorHandler(403, "Not authorized to edit this comment");

	if ((Date.now() - comment.createdAt.getTime()) / 60000 > 10) {
		throw new errorHandler(
			403,
			"Comment can only be edited within 10 minutes"
		);
	}

	let uploadedMedia = comment.media;
	if (req.files?.length > 0) {
		uploadedMedia = await Promise.all(
			req.files.map((file) =>
				uploadToS3(file, `tasks/${commentId}/comments/attachments`)
			)
		);
	}
	const mentionedUsers = await extractMentions(description);
	const mentionedEmails = mentionedUsers.map((u) => u.email).filter(Boolean);

	if (mentionedEmails.length > 0) {
		Promise.all(
			mentionedEmails.map((email) =>
				sendTaskEmail(
					email,
					"Mentioned you",
					`A comment was updated: "${description}"`,
					comment.taskId
				)
			)
		).catch((emailError) =>
			console.error("Email notification failed:", emailError)
		);
	}

	await Comment.updateOne(
		{ _id: commentId },
		{
			description: description || comment.description,
			media: uploadedMedia,
		}
	);

	await History.create({
		taskId: comment.taskId,
		userId,
		action: "Comment Edited",
		message: `Comment updated: "${description}"`,
	});

	return res
		.status(200)
		.json(
			new apiResponse(
				200,
				{ description, media: uploadedMedia },
				"Comment updated successfully"
			)
		);
});

export const deleteComment = asyncHandler(async (req, res) => {
	const { commentId } = req.params;
	const userId = req.user._id;

	const comment = await Comment.findById(commentId).select(
		"userId createdAt taskId description"
	);
	if (!comment) throw new errorHandler(404, "Comment not found");

	if (comment.userId.toString() !== userId) {
		throw new errorHandler(403, "Not authorized to delete this comment");
	}

	if ((Date.now() - comment.createdAt.getTime()) / 60000 > 10) {
		throw new errorHandler(
			403,
			"Comment can only be deleted within 10 minutes"
		);
	}

	await Comment.deleteOne({ _id: commentId });

	await History.create({
		taskId: comment.taskId,
		userId,
		action: "Comment Deleted",
		message: `${req.user.name} deleted a comment: "${comment.description}"`,
	});

	return res
		.status(200)
		.json(new apiResponse(200, null, "Comment deleted successfully"));
});

export const addReply = asyncHandler(async (req, res) => {
	try {
		const { commentId } = req.params;
		const { description } = req.body;
		const userId = req.user._id;
		const userName = req.user.name;
		const userEmail = req.user.email;

		const comment = await Comment.findById(commentId)
			.populate("userId", "email")
			.populate({
				path: "taskId",
				populate: { path: "assignedTo", select: "email" },
			})
			.lean();

		if (!comment) {
			throw new errorHandler(404, "Comment not found");
		}

		const mentionedUsers = await extractMentions(description);
		const recipients = new Set(
			[
				...mentionedUsers.map((u) => u.email).filter(Boolean),
				comment.userId?.email,
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
							`${userName} replied: "${description}"`,
							comment.taskId?._id
						)
					)
				);
			} catch (emailError) {
				emailStatus = `Failed: ${emailError.message}`;
			}
		}

		const reply = { userId, description };
		await Comment.findByIdAndUpdate(commentId, {
			$push: { replies: reply },
		});

		return res
			.status(201)
			.json(
				new apiResponse(
					201,
					{ reply, emailStatus },
					"Reply added successfully"
				)
			);
	} catch (error) {
		return res.status(500).json(new errorHandler(500, error.message));
	}
});
