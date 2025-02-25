import Comment from "../models/comment.models.js";
import History from "../models/history.models.js";
import { User } from "../models/user.models.js";
import Task from "../models/task.models.js";
import AWS from "aws-sdk";
import { extractMentions, sendTaskEmail } from "../helper/sendTaskEmail.js";

const s3 = new AWS.S3({
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	region: process.env.AWS_REGION,
});

const uploadToS3 = async (file, taskId, type) => {
	const key = `tasks/${taskId}/comments/${type}/${Date.now()}-${
		file.originalname
	}`;
	const uploadParams = {
		Bucket: process.env.AWS_S3_BUCKET_COMMENT,
		Key: key,
		Body: file.buffer,
		ContentType: file.mimetype,
	};
	const result = await s3.upload(uploadParams).promise();
	return result.Location;
};

export const addComment = async (req, res) => {
	try {
		const { taskId } = req.params;
		const { description } = req.body;
		const userId = req.user._id;

		const task = await Task.findById(taskId);
		if (!task)
			return res
				.status(404)
				.json({ success: false, message: "Task not found" });

		const user = await User.findById(userId).select("name email");
		if (!user)
			return res
				.status(404)
				.json({ success: false, message: "User not found" });

		const mediaFiles = req.files || [];
		const uploadedMedia = await Promise.all(
			mediaFiles.map((file) => uploadToS3(file, taskId, "media"))
		);

		const taskAssignee = await User.findById(task.assignedTo).select(
			"email"
		);
		const taskCreator = await User.findById(task.createdBy).select("email");

		const mentionedUsers = await extractMentions(description);
		const mentionedEmails = mentionedUsers
			.map((u) => u.email)
			.filter(Boolean);

		let recipients = [
			taskAssignee?.email,
			taskCreator?.email,
			...mentionedEmails,
		].filter(Boolean);

		if (recipients.length === 0) {
			console.warn("No valid recipients found for email notification.");
			return res
				.status(400)
				.json({
					success: false,
					message: "No valid recipients for email notification.",
				});
		}


		let emailSent = false;
		try {
			for (let email of recipients) {
				await sendTaskEmail(
					email,
					"New Comment Added",
					`${user.name} added a comment`,
					taskId
				);
			}
			emailSent = true;
		} catch (emailError) {
			console.error("Email sending failed:", emailError);
			return res
				.status(500)
				.json({
					success: false,
					message: "Email notification failed. Comment not saved.",
				});
		}

		if (emailSent) {
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
				.json({
					success: true,
					message: "Comment added successfully",
					comment: newComment,
				});
		}
	} catch (error) {
		console.error("Comment error:", error);
		return res
			.status(500)
			.json({
				success: false,
				message: "Server Error",
				error: error.message,
			});
	}
};

export const getCommentsByTask = async (req, res) => {
	try {
		const { taskId } = req.params;
		const task = await Task.findById(taskId);
		if (!task)
			return res
				.status(404)
				.json({ success: false, message: "Task not found" });

		const comments = await Comment.find({ taskId }).populate(
			"userId",
			"name email"
		);
		res.status(200).json(comments);
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Error fetching comments",
			error: error.message,
		});
	}
};

export const editComment = async (req, res) => {
	try {
		const { commentId } = req.params;
		const { description } = req.body;
		const userId = req.user._id;

		const comment = await Comment.findById(commentId);
		if (!comment) {
			return res
				.status(404)
				.json({ success: false, message: "Comment not found" });
		}

		if (comment.userId.toString() !== userId) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to edit this comment",
			});
		}

		const timeDifference = (new Date() - comment.createdAt) / 60000;
		if (timeDifference > 10) {
			return res.status(403).json({
				success: false,
				message: "Comment can only be edited within 10 minutes",
			});
		}

		let uploadedMedia = [];
		if (req.files && req.files.length > 0) {
			uploadedMedia = await Promise.all(
				req.files.map((file) => uploadToS3(file, commentId, "media"))
			);
		}

		const mentionedUsers = await extractMentions(description);
		const mentionedEmails = mentionedUsers
			.map((u) => u.email)
			.filter(Boolean);

		if (mentionedEmails.length > 0) {
			try {
				for (let email of mentionedEmails) {
					await sendTaskEmail(
						email,
						"Mentioned you with",
						`A comment was updated: "${description}"`,
						comment.taskId
					);
				}
			} catch (emailError) {
				console.error("Email sending failed:", emailError);
				return res
					.status(500)
					.json({
						success: false,
						message:
							"Email notification failed. Comment not updated.",
					});
			}
		}

		comment.description = description || comment.description;
		if (uploadedMedia.length > 0) {
			comment.media = uploadedMedia;
		}

		await comment.save();

		await History.create({
			taskId: comment.taskId,
			userId,
			action: "Comment Edited",
			message: `Comment updated: "${description}"`,
		});

		return res.status(200).json({
			success: true,
			message: "Comment updated successfully",
			data: comment,
		});
	} catch (error) {
		console.error("Edit comment error:", error);
		res.status(500).json({
			success: false,
			message: "Error updating comment",
			error: error.message,
		});
	}
};

export const deleteComment = async (req, res) => {
	try {
		const { commentId } = req.params;
		const userId = req.user._id;

		const comment = await Comment.findById(commentId);
		if (!comment)
			return res
				.status(404)
				.json({ success: false, message: "Comment not found" });

		if (comment.userId.toString() !== userId) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to delete this comment",
			});
		}

		const user = await User.findById(userId).select("name email");
		if (!user)
			return res
				.status(404)
				.json({ success: false, message: "User not found" });

		const timeDifference = (new Date() - comment.createdAt) / 60000;
		if (timeDifference > 10) {
			return res.status(403).json({
				success: false,
				message: "Comment can only be deleted within 10 minutes",
			});
		}

		const task = await Task.findById(comment.taskId);
		if (!task)
			return res
				.status(404)
				.json({ success: false, message: "Task not found" });

		await Comment.findByIdAndDelete(commentId);

		await History.create({
			taskId: comment.taskId,
			userId,
			action: "Comment Deleted",
			message: `${user.name} deleted a comment: "${comment.description}"`,
		});

		res.status(200).json({ success: true, message: "Comment deleted" });
	} catch (error) {
		console.error("Delete comment error:", error);
		res.status(500).json({
			success: false,
			message: "Error deleting comment",
			error: error.message,
		});
	}
};

export const addReply = async (req, res) => {
	try {
		const { commentId } = req.params;
		const { description } = req.body;
		const userId = req.user._id;

		const comment = await Comment.findById(commentId)
			.populate("userId", "email")
			.populate({
				path: "taskId",
				populate: { path: "assignedTo", select: "email" },
			});

		if (!comment) {
			return res
				.status(404)
				.json({ success: false, message: "Comment not found" });
		}

		const user = await User.findById(userId).select("name email");
		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		const mediaFiles = req.files || [];
		const uploadedMedia = await Promise.all(
			mediaFiles.map((file) => uploadToS3(file, commentId, "replies"))
		);

		const mentionedUsers = await extractMentions(description);
		const mentionedEmails = mentionedUsers
			.map((u) => u.email)
			.filter(Boolean);

		let recipients = new Set(
			[
				...mentionedEmails,
				comment.userId?.email,
				comment.taskId?.assignedTo?.email,
			].filter(Boolean)
		);


		if (recipients.size > 0) {
			try {
				for (let email of recipients) {
					await sendTaskEmail(
						email,
						"New Reply",
						`${user.name} replied: "${description}"`,
						comment.taskId._id
					);
				}
			} catch (emailError) {
				console.error("Email sending failed:", emailError);
				return res
					.status(500)
					.json({
						success: false,
						message: "Email notification failed. Reply not posted.",
					});
			}
		}

		const reply = { userId, description, media: uploadedMedia };
		comment.replies.push(reply);
		await comment.save();

		return res.status(201).json({
			success: true,
			message: "Reply added successfully",
			data: reply,
		});
	} catch (error) {
		console.error("Reply error:", error);
		res.status(500).json({
			success: false,
			message: "Error adding reply",
			error: error.message,
		});
	}
};
