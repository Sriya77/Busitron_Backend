import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: process.env.NODEMAILER_HOST,
    port: 465,
    secure: true,
    auth: {
        user: process.env.SUPER_ADMIN_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false,
    },
});

export default transporter;
