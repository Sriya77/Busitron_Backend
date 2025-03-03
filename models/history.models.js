import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
    {
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            required: true,
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        action: {
            type: String,
            enum: [
                "Comment Added",
                "Comment Edited",
                "Comment Deleted",
                "Reply Added",
                "Task Updated",
                "Created",
                "Updated",
                "Deleted",
            ],
            required: true,
        },
        message: { type: String, required: true },
        changes: [
            {
                field: String,
                oldValue: mongoose.Schema.Types.Mixed,
                newValue: mongoose.Schema.Types.Mixed,
            },
        ],
    },
    { timestamps: true }
);

historySchema.index({ taskId: 1 });
historySchema.index({ userId: 1 });

const History = mongoose.model("History", historySchema);
export default History;
