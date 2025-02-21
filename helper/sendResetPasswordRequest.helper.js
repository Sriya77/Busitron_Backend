import transporter from "../services/nodemailer.service.js";

async function sendResetPasswordRequest(email) {
	try {
		const resetURL = `http://localhost:5173/enter-new-password`;
		const mailOptions = {
			from: "pavanponnana1@gmail.com",
			to: email,
			subject: "Password Reset Request",
			html: `
              <p>You have requested to reset your password. Click the link below to reset your password:</p>
              <a href="${resetURL}" style="display: inline-block; padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
              <p>This link is valid for 30 minutes. If you did not request this, please ignore this email.</p>
              <br>
              <p>Regards,<br>Team Busitron</p>
            `,
		};
		await transporter.sendMail(mailOptions);
		return { success: true, message: "Email sent successfully" };
	} catch (err) {
		console.error("Error sending email:", err);
		return { success: false, message: "Email not sent" };
	}
}
export default sendResetPasswordRequest;
