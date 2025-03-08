import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    email: String,
    role: String,
});

const worklogSchema = new mongoose.Schema(
    {
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            required: true,
        },
        loggedBy: userSchema,
        log: {
            type: String,
            required: true,
        },
        timeSpent: {
            type: String,
            enum: ["1hr", "2hr", "4hr", "8hr"],
            default: "8hr",
        },
    },
    { timestamps: true }
);
export const Worklog = mongoose.model("Worklog", worklogSchema);
