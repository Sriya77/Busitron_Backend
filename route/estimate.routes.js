import express from "express";
const router = express.Router();
import { upload } from "../middlewares/fileupload.middleware.js";
import {
    createEstimate,
    getAllEstimates,
    getEstimateById,
    updateEstimate,
    deleteEstimate,
} from "../controller/estimate.controller.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

router.post("/create", authenticateUser, upload.array("uploadedFile", 5), createEstimate);
router.get("/getAll", authenticateUser, getAllEstimates);
router.get("/get/:id", authenticateUser, getEstimateById);
router.put("/update/:id", authenticateUser, updateEstimate);
router.delete("/delete/:id", authenticateUser, deleteEstimate);

export default router;
