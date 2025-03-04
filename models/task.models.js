import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    email: String,
    role: String,
});

const taskSchema = new mongoose.Schema(
    {
        taskID: { type: String, required: true, unique: true },
        title: { type: String, required: true },
        taskCategory: {
            type: String,
            required: true,
            enum: ["Project Management", "Development", "UI", "Bug", "Testing", "Other"],
        },
        projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: false },
        startDate: { type: Date, required: true },
        dueDate: { type: Date, required: true },
        assignedTo: userSchema,
        assignedBy: userSchema,
        description: { type: String, required: false },
        label: {
            type: String,
            required: true,
            default: "Enhancement",
            enum: ["Enhancement", "Bug", "Duplicate", "Documentation", "Helpmate"],
        },
        priority: { type: String, default: "Medium", enum: ["Low", "Medium", "High"] },
        status: {
            type: String,
            default: "To Do",
            enum: ["To Do", "In Progress", "Review", "Pending", "Completed", "Close", "Deleted"],
        },
        attachments: [{ type: String }],
    },
    { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);
export default Task;
