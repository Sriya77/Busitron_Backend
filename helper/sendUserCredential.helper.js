import transporter from "../services/nodemailer.service.js";

async function sendUserCredential(email, password) {
    try {
        const mailOptions = {
            from: process.env.SUPER_ADMIN_EMAIL,
            to: email,
            subject: "Your Account Login Credentials",
            html: `

        <p>Here are your login credentials :-</p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Password:</strong> ${password}</li>
        </ul>
        <p>Please keep these details secure and do not share them with anyone.</p>
        <br>
        <p>Regards,<br>Team Busitron</p>
      `,
        };

        await transporter.sendMail(mailOptions);
        return { success: true, message: "Email sent successfully" };
    } catch (err) {
        return { success: false, message: "Failed to send email" };
    }
}

export default sendUserCredential;
