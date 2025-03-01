import mongoose from "mongoose";

const appSettingSchema = new mongoose.Schema(
    {
        dateFormat: {
            type: String,
            required: true,
            default: "DD-MM-YYYY",
            enum: ["DD-MM-YYYY", "MM-DD-YYYY", "YYYY-MM-DD"],
        },
        timeFormat: {
            type: String,
            required: true,
            default: "HH:mm:ss",
            enum: ["HH:mm:ss", "HH:mm", "hh:mm:ss", "hh:mm"],
        },
        timeZone: {
            type: String,
            required: true,
            default: "Asia/Kolkata",
            enum: ["Asia/Kolkata", "America/New_York", "Europe/Paris", "Europe/London"],
        },
        currency: {
            type: String,
            required: true,
            default: "INR",
            enum: ["INR", "USD", "EUR"],
        },
        language: {
            type: String,
            required: true,
            default: "English",
            enum: ["English", "Spanish", "French", "Europe"],
        },
    },
    {
        timestamps: true,
    }
);

export const AppSetting = mongoose.model("AppSetting", appSettingSchema);
