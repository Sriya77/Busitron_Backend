import express from "express";

import { upload } from "../middlewares/fileupload.middleware.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import {
    createTicket,
    deleteTicketById,
    getAllTickets,
    getTicketsByUser,
    updateTicketById,
} from "../controller/ticket.controller.js";

const router = express.Router();

router.post("/createTicket", authenticateUser, upload.array("attachments", 5), createTicket);

router.get("/getAllTickets", authenticateUser, getAllTickets);

router.get("/getTicketByUser", authenticateUser, getTicketsByUser);

router.delete("/deleteTicketByID/:ticketID", authenticateUser, deleteTicketById);

router.put("/:ticketID", authenticateUser, upload.array("attachments", 5), updateTicketById);

export default router;
