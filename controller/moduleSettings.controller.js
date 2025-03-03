import moduleSettings from "../models/moduleSettings.models.js";
import { errorHandler } from "../utils/errorHandle.js";
import { asyncHandler } from "../utils/asyncHandle.js";
import { apiResponse } from "../utils/apiResponse.js";

export const createModuleSettings = asyncHandler(async (req, res) => {
    try {
        const { App_Administrator, third_Party_Admin, Employee } = req.body;
        
        const newModuleSettings = new moduleSettings({
            App_Administrator,
            third_Party_Admin,
            Employee,
        });

        const savedModuleSettings = await newModuleSettings.save();
        res.status(201).json(new apiResponse(201,savedModuleSettings,"create successfully"));
    } catch (error) {
        errorHandler(res, 500, error.message);
    }
});

export const getAllModuleSettings = asyncHandler(async (req, res) => {
    try {
        const settings = await moduleSettings.find();
        res.status(200).json(new apiResponse(200,settings,"get data successfully"));
    } catch (error) {
        errorHandler(res, 500, error.message);
    }
});

export const updateModuleSettings = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) throw new errorHandler(res, 400, "Module setting ID is required");

        const {  App_Administrator,
            third_Party_Admin,
            Employee } = req.body;
        const updatedSettings = await moduleSettings.findByIdAndUpdate(
            id,
            {  App_Administrator,
                third_Party_Admin,
                Employee},
            { new: true, runValidators: true }
        );

        if (!updatedSettings) throw new errorHandler(res, 404, "Module settings not found");
        
        res.status(200).json(new apiResponse(200,updatedSettings,"saved upates successfully"));
    } catch (error) {
        errorHandler(res, 500, error.message);
    }
});
