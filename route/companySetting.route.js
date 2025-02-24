import express from "express";
import {
	companySettings,
	createBusinessAddress,
	getCompanySettings,
	updateBusinessAddress,
} from "../controller/companySetting.controller.js";

const router = express.Router();

router.post("/company_setting", companySettings);
router.get("/company_setting", getCompanySettings);

router.post("/business_address/:companyId", createBusinessAddress);

router.put("/business_address/:companyId/:id", updateBusinessAddress);

export { router as companyRouter };
