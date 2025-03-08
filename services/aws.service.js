import AWS from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

//s3 client
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const CLOUDFRONT_URL = process.env.AWS_CLOUDFRONT_URL;

const uploadToS3 = async (file, folder = "") => {
    if (!file) return;

    const key = folder
        ? `avatars/${folder}/${Date.now()}-${file.originalname}`
        : `avatars/${Date.now()}-${file.originalname}`;

    const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
    };
     await s3.upload(uploadParams).promise();
    return `${CLOUDFRONT_URL}/${key}`;
};

export { uploadToS3 };
