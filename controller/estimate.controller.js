import { Estimate } from "../models/estimate.model.js";
import { uploadToS3 } from "../services/aws.service.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandle.js";
import { errorHandler } from "../utils/errorHandle.js";
import { User } from "../models/user.models.js";
import { sendEstimateEmail } from "../helper/sendEstimateEmail.helper.js";
export const createEstimate = asyncHandler(async (req, res, next) => {
	try {
		const {
			estimateNumber,
			validTill,
			currency,
			clientId,
			userId,
			status,
			productName,
			responseMessage,
		} = req.body;
		const products = JSON.parse(req.body.products);
		const summary = JSON.parse(req.body.summary);
		if (!estimateNumber || !clientId) {
			throw new errorHandler(
				400,
				"Estimate Number, Client, and Client Email are required."
			);
		}
		const existingEstimate = await Estimate.findOne({ estimateNumber });
		if (existingEstimate) {
			throw new errorHandler(
				400,
				"An estimate with this number already exists."
			);
		}
		let findUser = await User.findById({ _id: clientId });
		if (!findUser) {
			throw new errorHandler(400, "User Not Found");
		}
		let storeUploadResult = [];
		const estimate = new Estimate({
			estimateNumber,
			validTill,
			currency,
			clientId,
			userId,
			status,
			productName,
			products,
			summary,
			responseMessage,
		});
		const savedEstimate = await estimate.save();
		if (req.files?.length) {
			for (let file of req.files) {
				let uploadResult = await uploadToS3(
					file,
					`Estimates/${estimate._id}/attachments`
				);
				storeUploadResult.push(uploadResult);
			}
		}
		savedEstimate.uploadedFile = storeUploadResult;
		await savedEstimate.save();
		const emailSubject = `New Estimate Created: ${estimateNumber}`;
		const emailMessage = `
            <p>Dear ${findUser.name},</p>
            <p>Your estimate number, <strong>${estimateNumber}</strong> has been created.</p>
            <p>Details:</p>
            <ul>
                <li><strong>Valid Till:</strong> ${validTill}</li>
                <li><strong>Currency:</strong> ${currency}</li>
                <li><strong>Final Amount:</strong> ${summary.finalAmount}</li>
                <li><strong>Description:</strong> ${
					products.itemDescription || "No Description Given"
				}</li>
            </ul>
        `;
		await sendEstimateEmail(
			findUser.email,
			emailSubject,
			emailMessage,
			savedEstimate._id,
			true
		);
		return res
			.status(201)
			.json(
				new apiResponse(
					201,
					savedEstimate,
					"Estimate Created successfully. Please Check Email"
				)
			);
		// return res.status(201).json({message : "Hello world", success : true})
	} catch (error) {
		throw new errorHandler(error.message || 500, "Internal Server Error");
	}
});
export const getAllEstimates = asyncHandler(async (req, res, next) => {
	try {
		const estimates = await Estimate.find()
			.populate({
				path: "clientId",
				select: "name",
			})
			.populate({ path: "userId", select: "name" })
			.sort({ createdAt: -1 });
		return res
			.status(200)
			.json(
				new apiResponse(
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
		const estimate = await Estimate.findById(id);
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
			new errorHandler(400, "Invalid estimate ID");
		}
		let deletedEstimate = await Estimate.findByIdAndDelete(id).populate({
			path: "clientId",
			select: "name email",
		});

		if (!deletedEstimate) {
			new errorHandler(400, "Estimate not found.");
		}
		const emailSubject = `Estimate Deleted: ${deletedEstimate.estimateNumber}`;
		const emailMessage = `
            <p>Dear ${deletedEstimate.clientId.name},</p>
            <p>Your estimate number, <strong>${deletedEstimate.estimateNumber}</strong> has been deleted.</p>
        `;
		await sendEstimateEmail(
			deletedEstimate.clientId.email,
			emailSubject,
			emailMessage,
			"",
			false
		);
		return res
			.status(200)
			.json(new apiResponse(200, "", "Record Deleted Successfully."));
	} catch (error) {
		new errorHandler(error.message || "Internal Server Error", 500);
	}
});
