import mongoose, { Schema } from "mongoose";

const moduleSettingsSchema = new Schema(
    {
        
        App_Administrator: {
            type: [String],
            default: [],
        },
        third_Party_Admin: {
            type: [String],
            default: [],
        },
         Employee: {
            type: [String],
            default: [],
        },
    },
    { timestamps: true }
);

export default mongoose.model("ModuleSettings", moduleSettingsSchema);