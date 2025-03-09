import { Estimate } from "../models/estimate.model.js";
import { uploadToS3 } from "../services/aws.service.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandle.js";
import { errorHandler } from "../utils/errorHandle.js";
import User from "../models/user.models.js";
import { sendEstimateEmail } from "../helper/sendEstimateEmail.helper.js";
export const createEstimate = asyncHandler(async (req, res) => {
    try {
        let storeUploadResult = [];
        const {
            validTill,
            currency,
            clientId,
            userId,
            description,
            projectName,
            amount,
            taxPercentage,
            taxAmount,
            finalAmount,
        } = req.body;
        if (!clientId) {
            throw new errorHandler(400, "Invalid Client ID");
        }
        let findUser = await User.findById({ _id: clientId }).select(
            "-password -refreshToken -accessToken"
        );
        if (!findUser) {
            throw new errorHandler(404, "User Not Found");
        }
        const estimate = new Estimate({
            validTill: validTill,
            currency: currency,
            clientId: clientId,
            userId,
            amount,
            projectName,
            description,
            taxPercentage,
            taxAmount,
            finalAmount,
        });
        const savedEstimate = await estimate.save();
        if (req.files?.length) {
            for (let file of req.files) {
                let uploadResult = await uploadToS3(file, `Estimates/${estimate._id}/attachments`);
                storeUploadResult.push(uploadResult);
            }
        }
        savedEstimate.uploadedFile = storeUploadResult;
        await savedEstimate.save();
        const emailSubject = `New Estimate Created: ${savedEstimate?.estimateNumber}`;
        const emailMessage = `
            <p>Dear ${findUser.name},</p>
            <p>Your estimate number, <strong>${savedEstimate?.estimateNumber}</strong> has been created.</p>
            <p>Details:</p>
            <ul>
                <li><strong>Valid Till:</strong> ${validTill}</li>
                <li><strong>Currency:</strong> ${currency}</li>
                <li><strong>Final Amount:</strong> ${finalAmount}</li>
                <li><strong>Description:</strong> ${description}</li>
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
            .json(new apiResponse(200, estimates, "All estimates retrieved successfully."));
    } catch (error) {
        new errorHandler(error.message || "Internal Server Error", 500);
    }
});

// export const getAllEstimates = asyncHandler(async (req, res, next) => {
//     try {
//         const userId = req.user.id; // Assuming you have user info in req.user
//         const userRole = req.user.role; // Assuming you have user role in req.user

//         let estimates;
//         if (userRole === 'superAdmin') {
//             estimates = await Estimate.find()
//                 .populate({ path: "clientId", select: "name" })
//                 .populate({ path: "userId", select: "name" })
//                 .sort({ createdAt: -1 });
//         } else if (userRole === 'admin') {
//             estimates = await Estimate.find({ userId: userId }) // Filter by userId
//                 .populate({ path: "clientId", select: "name" })
//                 .populate({ path: "userId", select: "name" })
//                 .sort({ createdAt: -1 });
//         } else {
//             return res.status(403).json(new apiResponse(403, null, "Access denied."));
//         }

//         return res.status(200).json(new apiResponse(200, estimates, "All estimates retrieved successfully."));
//     } catch (error) {
//         new errorHandler(error.message || "Internal Server Error", 500);
//     }
// });

export const getEstimateById = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            new errorHandler("Invalid estimate ID.", 400);
        }
        const estimate = await Estimate.findById(id)
            .populate({
                path: "clientId",
                select: "name",
            })
            .populate({ path: "userId", select: "name" });
        if (!estimate) {
            new errorHandler("Estimate not found.", 404);
        }
        return res
            .status(200)
            .json(new apiResponse(200, estimate, "Estimate retrieved successfully."));
    } catch (error) {
        new errorHandler(error.message || "Internal Server Error", 500);
    }
});
export const updateEstimate = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            new errorHandler("Invalid estimate ID.", 400);
        }
        const updatedEstimate = await Estimate.findByIdAndUpdate(id, req.body, {
            new: true,
        });
        if (!updatedEstimate) {
            new errorHandler(404, "Estimate not found.");
        }
        return res
            .status(200)
            .json(new apiResponse(200, updatedEstimate, "Estimate Updated successfully."));
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
        return res.status(200).json(new apiResponse(200, "", "Record Deleted Successfully."));
    } catch (error) {
        new errorHandler(error.message || "Internal Server Error", 500);
    }
});
