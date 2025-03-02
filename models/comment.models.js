import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    email: String,
    role: String,
});

const replySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        userName: { type: String, required: true },
        userEmail: { type: String, required: true },
        commentText: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false } // Prevent automatic generation of _id for replies
);

const commentSchema = new mongoose.Schema(
    {
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            required: true,
        },
        commentedBy: userSchema,
        commentText: { type: String, required: true },
        replies: [replySchema],
    },
    { timestamps: true }
);

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
