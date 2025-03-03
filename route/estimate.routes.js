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

router.post("/create", upload.array("uploadedFile", 5), createEstimate);
router.get("/getAll", getAllEstimates);
router.get("/get/:id", getEstimateById);
router.put("/update/:id", updateEstimate);
router.delete("/delete/:id", deleteEstimate);

export { router as estimateRouter };
