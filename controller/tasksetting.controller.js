import Tasksetting from "../models/tasksetting.models.js";
import transporter from "../services/nodemailer.service.js";
import { User } from "../models/user.models.js";
export const createTasksetting = async (req, res) => {
	try {
		const { selection_visible } = req.body;

		const newTasksetting = new Tasksetting({
			selection_visible,
		});

		const savedTasksetting = await newTasksetting.save();

		res.status(201).json(savedTasksetting);
	} catch (error) {
		res.status(500).json({ message: "Error creating task setting", error });
	}
};

export const updateTasksetting = async (req, res) => {
	try {
		const { id } = req.params;
		const { selection_visible } = req.body;

		const updatedTasksetting = await Tasksetting.findByIdAndUpdate(
			id,
			{ selection_visible },
			{ new: true, runValidators: true }
		);

		if (!updatedTasksetting) {
			return res.status(404).json({ message: "Task setting not found" });
		}

		res.status(200).json(updatedTasksetting);
	} catch (error) {
		res.status(500).json({ message: "Error updating task setting", error });
	}
};

export const getTasksetting = async (req, res) => {
	try {
		const { id } = req.params;

		if (id) {
			const tasksetting = await Tasksetting.findById(id);
			if (!tasksetting) {
				return res
					.status(404)
					.json({ message: "Task setting not found" });
			}
			return res.status(200).json(tasksetting);
		} else {
			const tasksettings = await Tasksetting.find();
			return res.status(200).json(tasksettings);
		}
	} catch (error) {
		res.status(500).json({
			message: "Error fetching task settings",
			error,
		});
	}
};

let beforeDueDateInterval = null;
let afterDueDateInterval = null;

const sendReminderEmails = async (isBeforeDueDate) => {
	try {
		const users = await User.find();

		if (!users.length) {
			console.log("No users found.");
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
				.then(() => console.log())
				.catch((error) => console.error(error));
		});
	} catch (error) {
		console.error(error);
	}
};

export const scheduleRecurringEmails = async (req, res) => {
	try {
		const { beforeDueDate, afterDueDate, sendTaskReminder } = req.body;

		if (
			!beforeDueDate ||
			beforeDueDate <= 0 ||
			!afterDueDate ||
			afterDueDate <= 0
		) {
			return res.status(400).json({
				success: false,
				message: "Invalid time interval. Both must be at least 1 day.",
			});
		}

		if (sendTaskReminder !== "YES") {
			console.log("");
			return res.status(200).json({
				success: true,
				message: "",
			});
		}

		await sendReminderEmails(true);
		await sendReminderEmails(false);

		if (beforeDueDateInterval) clearInterval(beforeDueDateInterval);
		if (afterDueDateInterval) clearInterval(afterDueDateInterval);

		console.log(``);

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
		res.status(500).json({
			success: false,
			message: "Failed to schedule reminder emails.",
			error,
		});
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

		console.log("");
		res.status(200).json({
			success: true,
			message: "Scheduled reminder emails stopped.",
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			success: false,
			message: "Failed to stop reminder emails.",
			error,
		});
	}
};
