import { companySettingModel } from "../models/companySetting.model.js";
import { asyncHandler } from "../utils/asyncHandle.js";
import { errorHandler } from "../utils/errorHandle.js";
import { apiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";

export const companySettings = asyncHandler(async (req, res) => {
    try {
        const { companyName, companyEmail, phoneNumber, website } = req.body;

        if (!companyName || !companyEmail || !phoneNumber || !website) {
            throw new errorHandler(400, "All fields are required");
        }

        const companySetting = await companySettingModel.create({
            companyName,
            companyEmail,
            phoneNumber,
            website,
        });
        res.status(201).json(
            new apiResponse(201, companySetting, "company setting created successfully")
        );
    } catch (err) {
        throw new errorHandler(500, err.message);
    }
});

export const getCompanySettings = asyncHandler(async (req, res) => {
    try {
        const companySetting = await companySettingModel.find({});

        if (companySetting.length == 0 || !companySetting) {
            return new errorHandler(404, "company is not found");
        }
        res.status(200).json(
            new apiResponse(200, companySetting, "company setting fetched successfully")
        );
    } catch (err) {
        throw new errorHandler(500, err.message);
    }
});

export const createBusinessAddress = asyncHandler(async (req, res) => {
    try {
        const { country, pinCode, address, city } = req.body;
        const { companyId } = req.params;

        if (!companyId) {
            throw new errorHandler(400, "Invalid company ID");
        }

        if (!country || !pinCode || !address || !city) {
            throw new errorHandler(400, "All fields are required");
        }

        const newLocation = {
            id: Date.now(),
            country,
            pinCode,
            address,
            city,
        };

        const updatedBusinessAddress = await companySettingModel.findByIdAndUpdate(
            companyId,
            { $push: { location: newLocation } },
            { new: true }
        );

        res.status(200).json(
            new apiResponse(200, updatedBusinessAddress, "Business address created successfully")
        );
    } catch (err) {
        throw new errorHandler(500, err.message);
    }
});

export const updateBusinessAddress = asyncHandler(async (req, res) => {
    try {
        const { companyId, id } = req.params;
        const data = req.body;

        if (!companyId) {
            throw new errorHandler(400, "Invalid company ID");
        }

        if (!data.pinCode || !data.address || !data.country || !data.city) {
            throw new errorHandler(400, "All fields are required");
        }
        const businessAddress = await companySettingModel.findById(companyId);

        if (!businessAddress) {
            throw new errorHandler(404, "Business address not found");
        }

        const locationIndex = businessAddress.location.findIndex((loc) => loc.id === Number(id));

        if (locationIndex === -1) {
            throw new errorHandler(404, "Location not found");
        }

        const updatedBusinessAddress = await companySettingModel.findByIdAndUpdate(
            companyId,
            {
                $set: {
                    [`location.${locationIndex}.pinCode`]: data?.pinCode,
                    [`location.${locationIndex}.address`]: data?.address,
                    [`location.${locationIndex}.country`]: data?.country,
                    [`location.${locationIndex}.city`]: data?.city,
                },
            },
            { new: true }
        );

        res.status(200).json(
            new apiResponse(200, updatedBusinessAddress, "Business address updated successfully")
        );
    } catch (err) {
        throw new errorHandler(500, err.message);
    }
});

export const getAllBusinessAddresses = asyncHandler(async (req, res) => {
    try {
        const { companyId } = req.params;

        if (!companyId) {
            return res.status(400).json({ success: false, message: "Invalid company ID format" });
        }

        const company = await companySettingModel.findById(companyId);
        if (!company) {
            return res.status(404).json({ success: false, message: "Company not found" });
        }
        res.status(200).json(
            new apiResponse(200, company.location, "All business addresses fetched successfully")
        );
    } catch (err) {
        console.error("Error:", err.message);
        return res.status(500).json({ success: false, message: err.message });
    }
});

export const getBusinessAddress = asyncHandler(async (req, res) => {
    try {
        const { companyId, id } = req.params;

        if (!companyId) {
            return res.status(400).json({ success: false, message: "Invalid company ID format" });
        }

        const company = await companySettingModel.findById(companyId);
        if (!company) {
            return res.status(404).json({ success: false, message: "Company not found" });
        }

        const businessAddress = company.location.find((loc) => String(loc.id) === String(id));

        if (!businessAddress) {
            return res.status(404).json({
                success: false,
                message: "Business address not found",
            });
        }
        res.status(200).json(
            new apiResponse(200, businessAddress, "Business address fetched successfully")
        );
    } catch (err) {
        console.error("Error:", err.message);
        return res.status(500).json({ success: false, message: err.message });
    }
});

export const deleteBusinessAddress = asyncHandler(async (req, res) => {
    try {
        const { companyId, id } = req.params;

        if (!companyId) {
            throw new errorHandler(400, "Invalid company ID");
        }

        const company = await companySettingModel.findById(companyId);
        if (!company) {
            throw new errorHandler(404, "Company not found");
        }

        const locationIndex = company.location.findIndex((loc) => loc.id === Number(id));

        if (locationIndex === -1) {
            throw new errorHandler(404, "Business address not found");
        }

        company.location.splice(locationIndex, 1);
        await company.save();

        res.status(200).json(new apiResponse(200, null, "Business address deleted successfully"));
    } catch (err) {
        throw new errorHandler(500, err.message);
    }
});
