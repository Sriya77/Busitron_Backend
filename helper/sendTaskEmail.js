import { User } from "../models/user.models.js";
import transporter from "../services/nodemailer.service.js";


export  const sendTaskEmail = async (to, subject, message, taskId) => {
	const mailOptions = {
		from: process.env.SUPER_ADMIN_EMAIL,
		to,
		subject,
		html: `
        <p>${message}</p>
        <a href="${process.env.FRONTEND_URL}/tasks/${taskId}" style="display:inline-block;padding:10px 20px;background-color:#007bff;color:white;text-decoration:none;border-radius:5px;">View Task</a>
        <p>Regards,<br>Team Busitron</p>
      `,
	};
	await transporter.sendMail(mailOptions);
};


 export const extractMentions = async (text) => {
    const mentionedUsernames = (text.match(/@(\w+)/g) || []).map((u) => u.substring(1));
    return await User.find({ name: { $in: mentionedUsernames } }).select("email");
  };
