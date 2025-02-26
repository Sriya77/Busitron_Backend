import express from "express";
import {
	updateCompanySettings,
	createBusinessAddress,
	deleteBusinessAddress,
	getAllBusinessAddresses,
	getBusinessAddress,
	getCompanySettings,
	updateBusinessAddress,
} from "../controller/companySetting.controller.js";

const router = express.Router();

router.get("/company_setting", getCompanySettings);

router.post("/update_company_setting", updateCompanySettings);

router.post("/business_address/:companyId", createBusinessAddress);

router.put("/business_address/:companyId/:id", updateBusinessAddress);

router.get("/business_address/:companyId/:id", getBusinessAddress);

router.get("/business_address/:companyId/", getAllBusinessAddresses);

router.delete("/business_address/:companyId/:id", deleteBusinessAddress);


export { router as companyRouter };
