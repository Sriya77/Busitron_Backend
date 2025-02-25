import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
}).single("profilePic");

export { upload };
