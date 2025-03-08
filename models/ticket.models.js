import mongoose, { model } from "mongoose";

const userSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    email: String,
    role: String,
});

const ticketSchema = new mongoose.Schema(
    {
        ticketID: { type: String, required: true },
        assignedBy: userSchema,
        assignTeam: {
            type: String,
            required: true,
            enum: ["Support Team", "IT helpdesk"],
        },
        userId: userSchema,
        ticketType: {
            type: String,
            required: false,
            enum: ["Bug", "Feature Request"],
        },
        status: {
            type: String,
            default: "Open",
            enum: ["Open", "Pending", "Resolved", "Closed"],
        },
        ticketSubject: {
            type: String,
            required: true,
        },
        priority: {
            type: String,
            enum: ["Low", "Medium", "High"],
            default: "Medium",
        },
        description: {
            type: String,
            required: true,
        },
        attachments: [{ type: String }],
    },
    {
        timestamps: true,
    }
);
export const Ticket = model("Ticket", ticketSchema);
