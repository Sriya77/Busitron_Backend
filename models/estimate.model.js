import mongoose from "mongoose";
import { v4 } from "uuid";

const EstimateSchema = new mongoose.Schema(
	{
		estimateNumber: {
			type: String,
			required: false,
			unique: false,
			default: () => `EST-${v4().split("-")[0]}`,
		},
		validTill: {
			type: Date,
			required: false,
		},
		currency: {
			type: String,
			required: false,
			enum: ["INR", "USD"],
		},
		client: {
			type: String,
			required: false,
		},
		taxCalculation: {
			type: String,
			enum: ["Before Discount", "After Discount", "None"],
			required: false,
		},
		description: { type: String },
		status: {
			type: String,
			enum: ["Completed", "In progress", "Pending", "To do"],
			required: false,
		},
		products: [
			{
				description: {
					type: String,
					required: false,
				},
				quantity: {
					type: Number,
					required: false,
				},
				unitPrice: {
					type: Number,
					required: false,
				},
				tax: {
					type: String,
					required: false,
				},
				amount: {
					type: Number,
					required: false,
				},
			},
		],
		summary: {
			subTotal: {
				type: Number,
				required: false,
			},
			discount: {
				type: Number,
			},
			tax: {
				type: Number,
			},
			total: {
				type: Number,
				required: false,
			},
		},
		responseMessage: {
			type: String,
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

export const Estimate = mongoose.model("Estimate", EstimateSchema);
