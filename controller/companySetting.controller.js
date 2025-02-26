import { companySettingModel } from "../models/companySetting.model.js";
import { asyncHandler } from "../utils/asyncHandle.js";
import { errorHandler } from "../utils/errorHandle.js";
import { apiResponse } from "../utils/apiResponse.js";

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

export const updateCompanySettings = asyncHandler(async (req, res) => {
    try {
        const { id, companyName, companyEmail, phoneNumber, website } = req.body;

        if (!companyName || !companyEmail || !phoneNumber || !website) {
            throw new errorHandler(400, "All fields are required");
        }

        const updatedCompany = await companySettingModel.findOneAndUpdate(
            { _id: id },
            { companyName, companyEmail, phoneNumber, website },
            { new: true, runValidators: true }
        );

        if (!updatedCompany) {
            throw new errorHandler(404, "Company settings not found");
        }

        res.status(200).json(
            new apiResponse(200, updatedCompany, "Company settings updated successfully")
        );
    } catch (err) {
        throw new errorHandler(500, err.message);
    }
});

export const createBusinessAddress = asyncHandler(async (req, res) => {
    try {
        const { companyId } = req.params;
        if (!companyId) throw new errorHandler(400, "Invalid company ID");

        const { country, pinCode, address, city } = JSON.parse(req.body.newAddr);
        if (!country || !pinCode || !address || !city)
            throw new errorHandler(400, "All fields are required");

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
        const { address, city, country, pinCode } = JSON.parse(
            JSON.stringify(req.body.editAddress)
        );

        const { companyId, id } = req.params;
        if (!companyId || !id) throw new errorHandler(400, "Invalid company ID or location ID");

        const updateFields = {};
        if (address) updateFields["location.$.address"] = address;
        if (city) updateFields["location.$.city"] = city;
        if (country) updateFields["location.$.country"] = country;
        if (pinCode) updateFields["location.$.pinCode"] = pinCode;

        const updatedCompany = await companySettingModel.findOneAndUpdate(
            { _id: companyId, "location.id": Number(id) },
            { $set: updateFields },
            { new: true }
        );

        res.status(200).json(
            new apiResponse(200, updatedCompany, "Business address updated successfully")
        );
    } catch (err) {
        throw new errorHandler(500, err.message);
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
