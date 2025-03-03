import Tasksetting from "../models/tasksetting.models.js";
import transporter from "../services/nodemailer.service.js";
import { User } from "../models/user.models.js";
import { errorHandler } from "../utils/errorHandle.js";
import { apiResponse } from "../utils/apiResponse.js";
export const createTasksetting = async (req, res) => {
	try {
		const { selection_visible } = req.body;

		const newTasksetting = new Tasksetting({
			selection_visible,
		});

		const savedTasksetting = await newTasksetting.save();

		res.status(201).json(new apiResponse(201,savedTasksetting));
	} catch (error) {
		throw new errorHandler(500, error.message);
	}
};

export const updateTasksetting = async (req, res) => {
	try {
		const { id } = req.params;
		if (!id) {
			throw new errorHandler(400, "Task setting ID is required");
		}

		const { selection_visible } = req.body;

		const updatedTasksetting = await Tasksetting.findByIdAndUpdate(
			id,
			{ selection_visible },
			{ new: true, runValidators: true }
		);

		if (!updatedTasksetting) {
			throw new errorHandler(400, "Task setting not found");
		}

		res.status(200).json(new apiResponse(200,updatedTasksetting,"save updates successfully"));
	} catch (error) {
		throw new errorHandler(500, error.message);
	}
};



export const getTasksetting = async (req, res, next) => {
	try {
		const tasksettings = await Tasksetting.find();
		return res.status(200).json(new apiResponse(200,tasksettings));
	} catch (error) {
		return next(new errorHandler(500, "Error fetching task settings"));
	}
};



const sendReminderEmails = async (isBeforeDueDate) => {
	

	
	try {
		const users = await User.find();

		if (!users.length) {
			
			return;
		}

		users.forEach((user) => {
			let subject = "";
			let emailContent = "";

			if (isBeforeDueDate) {
				subject = "Upcoming Task Reminder";
				emailContent = `Hello ${user.name},\n\nThis is a reminder for your task. Please complete it before the deadline and submit it on time.\n\nThank you.`;
			} else {
				subject = "Overdue Task Reminder";
				emailContent = `Hello ${user.name},\n\nThis is a reminder that your task deadline has passed. Please complete it as soon as possible.\n\nThank you.`;
			}

			const mailOptions = {
				from: process.env.SUPER_ADMIN_EMAIL,
				to: user.email,
				subject,
				text: emailContent,
			};

			transporter
				.sendMail(mailOptions)
				
				.catch((error) => console.error(error));
		});
	} catch (error) {
		console.error(error);
	}
};

export const scheduleRecurringEmails = async (req, res) => {

	let beforeDueDateInterval = null;
    let afterDueDateInterval = null;
	try {
		const { beforeDueDate, afterDueDate, sendTaskReminder } = req.body;

		if (!beforeDueDate || beforeDueDate <= 0 || !afterDueDate || afterDueDate <= 0) {
			return res.status(400).json({
				success: false,
				message: "Invalid time interval. Both must be at least 1 day.",
			});
		}

		if (sendTaskReminder !== "YES") {
			

			return res.status(200).json({
				success: true,
				message: "",
			});
		}

		await sendReminderEmails(true);
		await sendReminderEmails(false);

		if (beforeDueDateInterval) clearInterval(beforeDueDateInterval);
		if (afterDueDateInterval) clearInterval(afterDueDateInterval);

		

		beforeDueDateInterval = setInterval(
			() => sendReminderEmails(true),
			beforeDueDate * 24 * 60 * 60 * 1000
		);
		afterDueDateInterval = setInterval(
			() => sendReminderEmails(false),
			afterDueDate * 24 * 60 * 60 * 1000
		);

		res.status(200).json({
			success: true,
			message: `Reminder emails scheduled every ${beforeDueDate} days (before due) and ${afterDueDate} days (after due).`,
		});
	} catch (error) {
		console.error(error);
		throw new errorHandler(500, "Failed to schedule reminder emails.");
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

		
		res.status(200).json({
			success: true,
			message: "Scheduled reminder emails stopped.",
		});
	} catch (error) {
		console.error(error);
		throw new errorHandler(500, "Failed to stop reminder emails.");
	}
};
