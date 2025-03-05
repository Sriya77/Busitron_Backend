import transporter from "../services/nodemailer.service.js";
import Task from "../models/task.models.js";
import { errorHandler } from "../utils/errorHandle.js";
import { apiResponse } from "../utils/apiResponse.js";

let beforeDueDateInterval = null;
let afterDueDateInterval = null;

const allowedStatuses = ["To Do", "In Progress", "Review", "Pending", "Completed"];

const sendReminderEmails = async (statusFilter) => {
    try {
        if (!allowedStatuses.includes(statusFilter)) {
            console.log(`Skipping email: Status "${statusFilter}" is not allowed.`);
            return;
        }

        const tasks = await Task.find({ status: statusFilter });

        if (!tasks.length) {
            console.log(`No tasks found for status: ${statusFilter}`);
            return;
        }

        tasks.forEach((task) => {
            const { assignedTo, status, title, dueDate } = task;
            const { email } = assignedTo;

            let subject = `Task Reminder: ${status}`;
            let emailContent = `Hello,\n\nThis is a reminder that your task \"${title}\" is in the \"${status}\" status. Please take necessary actions.\n\nDue Date: ${dueDate}\n\nThank you.`;

            const mailOptions = {
                from: process.env.SUPER_ADMIN_EMAIL,
                to: email,
                subject,
                text: emailContent,
            };

            transporter
                .sendMail(mailOptions)
                .catch((error) => console.error(`Email sending failed: ${error.message}`));
        });
    } catch (error) {
		throw new errorHandler(500, error.message);
    }
};

export const scheduleRecurringEmails = async (req, res) => {
    try {
        const { beforeDueDate, afterDueDate, sendTaskReminder, status } = req.body;

        if (!beforeDueDate || beforeDueDate <= 0 || !afterDueDate || afterDueDate <= 0)
            throw new errorHandler(400, "Invalid time interval. Both must be at least 1 day.");

        if (sendTaskReminder !== "YES" || !status || !allowedStatuses.includes(status)) {
            res.status(200).json(
                new apiResponse(200, null, "Task reminder not enabled or invalid status provided.")
            );
        }

        await sendReminderEmails(status);

        if (beforeDueDateInterval) clearInterval(beforeDueDateInterval);
        if (afterDueDateInterval) clearInterval(afterDueDateInterval);

        beforeDueDateInterval = setInterval(
            () => sendReminderEmails(status),
            beforeDueDate * 24 * 60 * 60 * 1000
        );
        afterDueDateInterval = setInterval(
            () => sendReminderEmails(status),
            afterDueDate * 24 * 60 * 60 * 1000
        );

        res.status(200).json(
            new apiResponse(
                200,
                null,
                `Reminder emails scheduled every ${beforeDueDate} days (before due) and ${afterDueDate} days (after due) for status: ${status}.`
            )
        );
    } catch (error) {
        throw new errorHandler(500, error.message);
    }
};

export const stopRecurringEmails = async (req, res) => {
    try {
        if (beforeDueDateInterval) {
            clearInterval(beforeDueDateInterval);
            beforeDueDateInterval = null;
        }
        if (afterDueDateInterval) {
            clearInterval(afterDueDateInterval);
            afterDueDateInterval = null;
        }

        res.status(200).json(new apiResponse(200, null, "Scheduled reminder emails stopped."));
    } catch (error) {
        throw new errorHandler(500, error.message);
    }
};
