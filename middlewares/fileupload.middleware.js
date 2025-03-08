import multer from "multer";



const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4", "application/pdf"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images, videos, and PDFs are allowed."));
  }
};

 export const upload = multer({
  storage: multer.memoryStorage(), // Temporarily store files in memory
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB file size limit
  fileFilter
});