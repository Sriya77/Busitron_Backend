import { errorHandler } from "../utils/errorHandle.js";
import { asyncHandler } from "../utils/asyncHandle.js";
import { apiResponse } from "../utils/apiResponse.js";
import transporter from "../services/nodemailer.service.js";

export const sendContactEmail = asyncHandler(async (req, res, next) => {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
        return next(new errorHandler(400, "All fields are required!"));
    }

    const companyName = "BUSITRON";
    const companyLogo =
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU9x30TYV6de90iBrSbkyJipMx79PDf-KxwQ&s";
    const companyWebsite = "https://www.busitron.com";
    const supportEmail = "support@busitron.com";
    const supportPhone = "+1 800-123-4567";
    const address = "123 Corporate Avenue, Suite 456, London, UK";

    const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: auto; padding: 0; background-color: #f4f4f4;">
            
            <!-- Header -->
            <table style="width: 100%; background-color:rgb(121, 178, 236); padding: 20px; text-align: center; color: white;">
                <tr>
                    <td>
                        <img src="${companyLogo}" alt="Company Logo" width="120" style="margin-bottom: 10px;">
                        <h2 style="margin: 5px 0;">${companyName}</h2>
                        <p style="margin: 5px 0; font-size: 14px;">A Trusted Name in Business Solutions</p>
                    </td>
                </tr>
            </table>

            <!-- Email Body -->
            <table style="width: 100%; background-color: #ffffff; padding: 30px; border-radius: 5px;">
                <tr>
                    <td>
                        <h3 style="color: #333;">New Business Inquiry Received</h3>
                        <p style="font-size: 14px; color: #555;">Dear Team,</p>
                        <p style="font-size: 14px; color: #555;">You have received a new business inquiry from a client. Below are the details:</p>

                        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">Name:</td>
                                <td style="padding: 10px; color: #333;">${name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">Email:</td>
                                <td style="padding: 10px;"><a href="mailto:${email}" style="color: #0073e6; text-decoration: none;">${email}</a></td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">Phone:</td>
                                <td style="padding: 10px; color: #333;">${phone}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold;">Message:</td>
                                <td style="padding: 10px; font-style: italic;">"${message}"</td>
                            </tr>
                        </table>

                        <p style="font-size: 14px; color: #555; margin-top: 20px;">Please follow up with the client at your earliest convenience.</p>

                        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">

                        <!-- Company Information -->
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <!-- Left Side: Company Details -->
                                <td style="width: 50%; padding: 15px; text-align: left; vertical-align: top;">
                                    <h4 style="color: #0073e6; margin: 5px 0;">${companyName}</h4>
                                </td>

                                <!-- Right Side: Support Info -->
                                <td style="width: 50%; padding: 15px; text-align: left; vertical-align: top;">
                                    <h4 style="color: #0073e6; margin: 5px 0;">Support Contact</h4>
                                    <p style="font-size: 14px; color: #555;"><strong>Email:</strong> <a href="mailto:${supportEmail}" style="color: #0073e6;">${supportEmail}</a></p>
                                    <p style="font-size: 14px; color: #555;"><strong>Phone:</strong> ${supportPhone}</p>
                                    <p style="font-size: 14px; color: #555;"><strong>Address:</strong> ${address}</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <!-- Footer -->
            <table style="width: 100%; background-color: #f8f8f8; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                <tr>
                    <td>
                        <p>&copy; 2025 ${companyName}. All Rights Reserved.</p>
                    </td>
                </tr>
            </table>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: process.env.SUPER_ADMIN_EMAIL,
            to: email,
            subject: "New Business Inquiry - Contact Form Submission",
            html: emailContent,
        });

        return res.status(200).json(new apiResponse(200, null, "Email sent successfully!"));
    } catch (error) {
        return next(new errorHandler(500, "Email sending failed!", error));
    }
});
