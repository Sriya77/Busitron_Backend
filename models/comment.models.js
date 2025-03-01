import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
    {
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        description: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

const commentSchema = new mongoose.Schema(
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
        description: { type: String, default: "" },
        media: [{ type: String }],

        replies: [replySchema],

        createdAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
