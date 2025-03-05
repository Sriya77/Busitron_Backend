import { sendTaskEmail } from "../helper/sendTaskEmail.js";
import { Ticket } from "../models/ticket.models.js";
import { User } from "../models/user.models.js";
import { uploadToS3 } from "../services/aws.service.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandle.js";
import { errorHandler } from "../utils/errorHandle.js";

export const createTicket = asyncHandler(async (req, res) => {
    try {
        const { userId, assignTeam, status, ticketType, priority, ticketSubject, description } =
            req.body;

        const assignedBy = req.user._id;

        if (!assignedBy || !assignTeam || !userId || !ticketSubject || !description)
            throw new errorHandler(400, "Missing required fields");

        const [creator, assignedUser, latestTicket] = await Promise.all([
            User.findById(assignedBy).select("-password"),
            User.findById(userId).select("-password"),
            Ticket.findOne().sort({ createdAt: -1 }).select("ticketID"),
        ]);

        if (!creator) throw new errorHandler(404, "Creator not found");
        if (!assignedUser) throw new errorHandler(404, "Assigned user not found");

        let newTicketID = "TKT-0001";
        if (latestTicket && latestTicket.ticketID) {
            const lastNumber = parseInt(latestTicket.ticketID.split("-")[1], 10);
            newTicketID = `TKT-${(lastNumber + 1).toString().padStart(3, "0")}`;
        }

        // Create the ticket
        const ticket = await Ticket.create({
            ticketID: newTicketID,
            userId: assignedUser
                ? {
                      _id: assignedUser._id,
                      name: assignedUser.name,
                      email: assignedUser.email,
                      role: assignedUser.role,
                  }
                : null,
            assignedBy: {
                _id: creator._id,
                name: creator.name,
                email: creator.email,
                role: creator.role,
            },
            assignTeam,
            status,
            ticketType,
            ticketSubject,
            priority,
            description,
        });

        if (req.files?.length) {
            ticket.attachments = await Promise.all(
                req.files.map((file) => uploadToS3(file, `tickets/${ticket._id}/attachments`))
            );
            await ticket.save();
        }

        const superAdmins = await User.find({ role: "SuperAdmin" }).select("email");
        const adminEmails = superAdmins.map((admin) => admin.email);
        console.log("SuperAdmin Emails:", adminEmails);

        if (adminEmails.length > 0) {
            await sendTaskEmail(
                adminEmails,
                "New Ticket Created",
                `A new ticket has been created by ${creator.name}: ${ticketSubject}`,
                ticket._id
            );
        }
        res.status(201).json(new apiResponse(201, ticket, "Task created successfully"));
    } catch (error) {
        throw new errorHandler(500, error.message);
    }
});

export const getAllTickets = asyncHandler(async (req, res) => {
    try {
        const ticket = await Ticket.find({ status: { $nin: ["Close"] } })
            .populate("userId", "name email role")
            .populate("assignedBy", "name email role")
            .exec();

        res.status(200).json(new apiResponse(200, ticket, "Ticket fetched successfully."));
    } catch (error) {
        throw new errorHandler(500, "Something went wrong.");
    }
});

export const deleteTicketById = asyncHandler(async (req, res) => {
    try {
        const { ticketID } = req.params;

        const ticket = await Ticket.findById(ticketID);
        if (!ticket) throw new errorHandler(404, "Ticket not found");

        await Ticket.findByIdAndDelete(ticket);

        res.status(200).json(new apiResponse(200, null, "Ticket deleted successfully"));
    } catch (error) {
        throw new errorHandler(500, error.message);
    }
});

export const getTicketsByUser = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;

        if (!userId) throw new errorHandler(400, "Unauthenticated user");

        const ticket = await Ticket.find({ "userId._id": userId });

        if (!ticket.length) throw new errorHandler(400, "No tasks found for this user");

        res.status(200).json(new apiResponse(200, ticket, "Ticket details retrieved successfully"));
    } catch (error) {
        throw new errorHandler(500, error.message);
    }
});

export const updateTicketById = asyncHandler(async (req, res, next) => {
    try {
        const { ticketID } = req.params;
        const { assignTeam, ticketType, status, ticketSubject, priority, description } = req.body;

        const existingTicket = await Ticket.findById(ticketID);
        if (!existingTicket) {
            throw new errorHandler(404, "Ticket not found");
        }

        const updatedData = {};
        if (assignTeam) updatedData.assignTeam = assignTeam;
        if (ticketType) updatedData.ticketType = ticketType;
        if (status) updatedData.status = status;
        if (ticketSubject) updatedData.ticketSubject = ticketSubject;
        if (priority) updatedData.priority = priority;
        if (description) updatedData.description = description;

        if (req.files?.length) {
            const uploadedAttachments = await Promise.all(
                req.files.map((file) =>
                    uploadToS3(file, `tickets/${existingTicket._id}/attachments`)
                )
            );
            existingTicket.attachments = [
                ...(existingTicket.attachments || []),
                ...uploadedAttachments,
            ];
        } else {
            existingTicket.attachments = req.body.attachments || [];
        }

        if (Object.keys(updatedData).length > 0) {
            Object.assign(existingTicket, updatedData);
        }

        await existingTicket.save();

        res.status(200).json(new apiResponse(200, existingTicket, "Ticket updated successfully."));
    } catch (error) {
        next(new errorHandler(500, error.message));
    }
});
