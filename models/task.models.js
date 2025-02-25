import mongoose, { Schema, model } from "mongoose";

const taskSchema = new Schema(
	{
		title: { type: String, required: true },
		description: { type: String, required: true },

		priority: {
			type: String,
			enum: ["Low", "Medium", "High"],
			default: "Medium",
		},
		status: {
			type: String,
			enum: ["To Do", "In Progress", "Review", "Complete", "Close"],
			default: "To Do",
		},
		// add the project id and user id
		// projectId: {
		// 	type: mongoose.Schema.Types.ObjectId,
		// 	ref: "Project",
		// 	required: true,
		// },
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		assignedTo: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},

		updatedAt: { type: Date, default: Date.now },
		dueDate: { type: Date },
		startDate: { type: Date },
		endDate: { type: Date },

		attachments: [{ type: String }],

		history: [{ type: mongoose.Schema.Types.ObjectId, ref: "History" }],
		comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
	},
	{ timestamps: true }
);

const Task = model("Task", taskSchema);
export default Task;
