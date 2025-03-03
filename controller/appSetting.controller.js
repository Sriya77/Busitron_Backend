import { AppSetting } from "../models/appsetting.models.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandle.js";
import { errorHandler } from "../utils/errorHandle.js";

export const getAppSetting = asyncHandler(async (req, res) => {
    const appSetting = await AppSetting.find({});
    res.status(200).json(new apiResponse(200, appSetting, "App Settings fetched successfully"));
});

export const updateAppSetting = asyncHandler(async (req, res) => {
    const { _id } = req.params;
    const { dateFormat, timeFormat, timeZone, currency, language } = req.body;

    const appSetting = await AppSetting.findById(_id);

    if (!appSetting) throw new errorHandler(404, "App Settings not found");

    const updatedAppSetting = await AppSetting.findByIdAndUpdate(
        _id,
        {
            $set: { dateFormat, timeFormat, timeZone, currency, language },
        },
        { new: true }
    );
    if (!updatedAppSetting) {
        throw new errorHandler(404, "App Settings not found");
    }
    res.status(200).json(
        new apiResponse(200, updatedAppSetting, "App Settings updated successfully")
    );
});
