import mongoose from "mongoose";

const { Schema } = mongoose;

const tasksettingSchema = new Schema(
	{
		selection_visible: {
			type: [String],
			default: [],
		},
	},
	{ timestamps: true }
);

export default mongoose.model("Tasksetting", tasksettingSchema);
