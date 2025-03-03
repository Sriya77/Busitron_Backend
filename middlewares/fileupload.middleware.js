import multer from "multer";

 export const upload = multer({
  storage: multer.memoryStorage(), // Temporarily store files in memory
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB file size limit
});