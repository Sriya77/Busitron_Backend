import transporter from "../services/nodemailer.service.js";

async function sendOtpForValidation(email, otp) {
	try {
		const mailOptions = {
			from: process.env.SUPER_ADMIN_EMAIL,
			to: email,
			subject: "Your OTP for Account Verification",
			html: `
        <p>Thank you for signing up. Here is your One-Time Password (OTP) for account verification:</p>
        <h3 style="color: #333;">${otp}</h3>
        <p>Please enter this OTP to verify your account. It is valid for 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
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
export default sendOtpForValidation;
