import mongoose from "mongoose";

const EstimateSchema = new mongoose.Schema(
	{
		estimateNumber: {
			type: String,
			required: false,
			unique: false,
		},
		validTill: {
			type: String,
			required: false,
		},
		currency: {
			type: String,
			required: false,
			enum: ["INR", "USD"],
		},
		clientId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		projectName: {
			type: String,
		},
		description: {
			type: String,
			required: false,
		},
		amount: {
			type: String,
		},
		taxPercentage: {
			type: String,
		},
		taxAmount: {
			type: String,
		},
		finalAmount: {
			type: String,
		},
		projectStatus: {
			type: String,
			enum: ["Pending", "In Progress", "Completed"],
			default: "Pending",
		},
		paymentStatus: {
			type: String,
			enum: ["Approved", "Paid"],
			default: "Approved",
		},
		uploadedFile: [
			{
				type: String,
				required: false,
			},
		],
	},
	{ timestamps: true }
);
EstimateSchema.pre("save", async function (next) {
	if (!this.estimateNumber) {
		const lastEstimate = await this.constructor
			.findOne()
			.sort({ createdAt: -1 });
		let newEstimateNumber = 1;
		if (lastEstimate && lastEstimate.estimateNumber) {
			const lastNumber = parseInt(
				lastEstimate.estimateNumber.replace("EST", ""),
				10
			);
			newEstimateNumber = lastNumber + 1;
		}
		this.estimateNumber = `EST${newEstimateNumber
			.toString()
			.padStart(5, "0")}`;
	}
	next();
});
export const Estimate = mongoose.model("Estimate", EstimateSchema);
