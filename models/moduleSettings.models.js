import mongoose, { Schema } from "mongoose";

const moduleSettingsSchema = new Schema(
	{
		Super_Admin: {
			type: [String],
			default: [],
		},
		Admin: {
			type: [String],
			default: [],
		},
		Employee: {
			type: [String],
			default: [],
		},
	},
	{ timestamps: true }
);

export default mongoose.model("ModuleSettings", moduleSettingsSchema);
