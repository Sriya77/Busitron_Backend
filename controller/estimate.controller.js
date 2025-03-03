import { Estimate } from "../models/estimate.model.js";
import { uploadToS3 } from "../services/aws.service.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandle.js";
import { errorHandler } from "../utils/errorHandle.js";

export const createEstimate = asyncHandler(async (req, res, next) => {
	try {
		const {
			estimateNumber,
			validTill,
			currency,
			client,
			taxCalculation,
			description,
			status,
			products,
			summary,
			responseMessage,
		} = req.body;

		if (!estimateNumber || !client) {
			new errorHandler("Estimate Number and Client are required.", 400);
		}
		console.log("started");

		const existingEstimate = await Estimate.findOne({ estimateNumber });
		console.log(existingEstimate);

		if (existingEstimate) {
			new errorHandler(
				"An estimate with this number already exists.",
				400
			);
		}

		const estimate = new Estimate({
			estimateNumber,
			validTill,
			currency,
			client,
			taxCalculation,
			description,
			status,
			products,
			summary,
			responseMessage,
		});
		const savedEstimate = await estimate.save();
		if (req.files?.length) {
			estimate.uploadedFile = await Promise.all(
				req.files.map((file) =>
					uploadToS3(file, `Estimates/${estimate._id}/attachments`)
				)
			);
		}

		return res
			.status(201)
			.json(
				new apiResponse(
					201,
					savedEstimate,
					"Estimate created successfully."
				)
			);
	} catch (error) {
		new errorHandler(error.message || "Internal Server Error", 500);
	}
});

export const getAllEstimates = asyncHandler(async (req, res, next) => {
	try {
		const estimates = await Estimate.find().populate("client");
		return res
			.status(200)
			.json(
				new apiResponse(
					true,
					200,
					estimates,
					"All estimates retrieved successfully."
				)
			);
	} catch (error) {
		new errorHandler(error.message || "Internal Server Error", 500);
	}
});

export const getEstimateById = asyncHandler(async (req, res, next) => {
	try {
		const { id } = req.params;

		if (!id) {
			new errorHandler("Invalid estimate ID.", 400);
		}

		const estimate = await Estimate.findById(id).populate("client");
		if (!estimate) {
			new errorHandler("Estimate not found.", 404);
		}

		return res
			.status(200)
			.json(
				new apiResponse(
					true,
					200,
					estimate,
					"Estimate retrieved successfully."
				)
			);
	} catch (error) {
		new errorHandler(error.message || "Internal Server Error", 500);
	}
});

export const updateEstimate = asyncHandler(async (req, res, next) => {
	try {
		const { id } = req.params;

		if (!id) {
			new errorHandler("Invalid estimate ID.", 400);
		}

		const updatedEstimate = await Estimate.findByIdAndUpdate(id, req.body, {
			new: true,
		});
		if (!updatedEstimate) {
			new errorHandler("Estimate not found.", 404);
		}

		return res
			.status(200)
			.json(
				new apiResponse(
					true,
					200,
					updatedEstimate,
					"Estimate updated successfully."
				)
			);
	} catch (error) {
		new errorHandler(error.message || "Internal Server Error", 500);
	}
});

export const deleteEstimate = asyncHandler(async (req, res, next) => {
	try {
		const { id } = req.params;

		if (!id) {
			new errorHandler("Invalid estimate ID.", 400);
		}

		const deletedEstimate = await Estimate.findByIdAndDelete(id);
		if (!deletedEstimate) {
			new errorHandler("Estimate not found.", 404);
		}

		return res
			.status(200)
			.json(new apiResponse(true, 200, "Estimate deleted successfully."));
	} catch (error) {
		new errorHandler(error.message || "Internal Server Error", 500);
	}
});
