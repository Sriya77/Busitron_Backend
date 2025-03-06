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
        userId : {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        status: {
            type: String,
            enum: ["Completed", "In progress", "Pending", "To do"],
            required: false,
            default : "Pending"
        },
        productName : {
            type : String,
        },
        products: {
            itemName: {
                type: String,
                required: false,
            },
            itemDescription : {
                type: String,
                required: false,
            },
            quantity: {
                type: String,
                required: false,
            },
            unitPrice: {
                type: String,
                required: false,
            },
            taxPercentage: {
                type: String,
                required: false,
            },
            amount: {
                type: String,
                required: false,
            },
        },
        summary: {
            subTotal: {
                type: String,
            },
            discount: {
                type: String,
            },
            taxAmount: {
                type: String,
            },
            finalAmount: {
                type: String,
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