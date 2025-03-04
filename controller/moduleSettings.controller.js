import moduleSettings from "../models/moduleSettings.models.js";
import { errorHandler } from "../utils/errorHandle.js";
import { asyncHandler } from "../utils/asyncHandle.js";
import { apiResponse } from "../utils/apiResponse.js";

export const createModuleSettings = asyncHandler(async (req, res) => {
	try {
		const { Super_Admin, Admin, Employee } = req.body;

		const newModuleSettings = new moduleSettings({
			Super_Admin,
			Admin,
			Employee,
		});

		const savedModuleSettings = await newModuleSettings.save();
		res.status(201).json(
			new apiResponse(201, savedModuleSettings, "Created successfully")
		);
	} catch (error) {
		errorHandler(res, 500, error.message);
	}
});

export const getAllModuleSettings = asyncHandler(async (req, res) => {
	try {
		const settings = await moduleSettings.find();
		res.status(200).json(
			new apiResponse(200, settings, "Get data successfully", true)
		);
	} catch (error) {
		errorHandler(res, 500, error.message);
	}
});

export const updateModuleSettings = asyncHandler(async (req, res) => {
	try {
		const { id } = req.params;
		if (!id)
			throw new errorHandler(res, 400, "Module setting ID is required");

		const { Super_Admin, Admin, Employee } = req.body;
		const updatedSettings = await moduleSettings.findByIdAndUpdate(
			id,
			{ Super_Admin, Admin, Employee },
			{ new: true, runValidators: true }
		);

		if (!updatedSettings)
			throw new errorHandler(res, 404, "Module settings not found");

		res.status(200).json(
			new apiResponse(
				200,
				updatedSettings,
				"Saved updates successfully",
				true
			)
		);
	} catch (error) {
		errorHandler(res, 500, error.message);
	}
});

export const deletemodulesettings = asyncHandler(async (req, res) => {
	try {
		const { id } = req.params;
		if (!id) throw new errorHandler(res, 400, "ID is required");

		const deletedSettings = await moduleSettings.findByIdAndDelete(id);
		if (!deletedSettings)
			throw new errorHandler(res, 404, "Module settings not found");

		res.status(200).json(
			new apiResponse(
				200,
				deletedSettings,
				"Module settings deleted successfully",
				true
			)
		);
	} catch (error) {
		errorHandler(res, 500, error.message);
	}
});
