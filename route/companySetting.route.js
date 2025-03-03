import express from "express";
import {
    updateCompanySettings,
    createBusinessAddress,
    deleteBusinessAddress,
    getCompanySettings,
    updateBusinessAddress,
} from "../controller/companySetting.controller.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/company_setting", authenticateUser, getCompanySettings);

router.put("/update_company_setting", authenticateUser, updateCompanySettings);

router.put("/create_business_address/:companyId", authenticateUser, createBusinessAddress);

router.put("/update_business_address/:companyId/:id", authenticateUser, updateBusinessAddress);

router.delete("/delete_business_address/:companyId/:id", authenticateUser, deleteBusinessAddress);

export default router;
