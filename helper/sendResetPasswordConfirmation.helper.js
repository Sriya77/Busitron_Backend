import transporter from "../services/nodemailer.service.js";

async function sendResetPasswordConfirmation(email) {
	try {
		const resetURL = `http://yourfrontend.com/reset-password`;
		const mailOptions = {
			from: "pavanponnana1@gmail.com",
			to: email,
			subject: "Password Changed Successfully",
			html: `
              <p>Your password has been changed successfully.</p>
              <p>If you did not make this change, please contact our support team immediately.</p>
              <br>
              <p>Regards,<br>Busitron</p>
            `,
		};
		await transporter.sendMail(mailOptions);
		return { success: true, message: "Email sent successfully" };
	} catch (err) {
		return { success: false, message: "Email not sent" };
	}
}
export default sendResetPasswordConfirmation;
