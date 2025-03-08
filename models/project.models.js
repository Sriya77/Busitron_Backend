import mongoose, { Schema } from "mongoose";

const userSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    email: String,
    role: String,
	companyName: String,
});

const milestoneSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    startDate: {
        type: Date,
        required: false,
    },
    endDate: {
        type: Date,
        required: false,
    },
    status: {
        type: String,
        enum: ["Complete", "Incomplete"],
        default: "Pending",
    },
});

const projectSchema = new Schema(
    {
        shortCode: {
            type: String,
            required: false,
            default: () => `SC-${Date.now()}`,
            unique: true,
        },
        projectName: {
            type: String,
            required: true,
        },
        startDate: {
            type: Date,
            default: Date.now(),
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        projectCategory: {
            type: String,
            required: false,
        },
        department: {
            type: String,
            required: false,
        },
        projectSummary: {
            type: String,
            required: false,
        },
        assignedBy: userSchema,
        mileStone: [milestoneSchema],
        projectMembers: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],

        attachments: [{ type: String }],
    },
    { timestamps: true }
);

const projectModel = mongoose.model("projectModel", projectSchema);
export default projectModel;
