import express from "express";
import {
    createRolePermissions,
    getAllItems,
    updateRolePermissions,
    addRole,
    addPermissionToRole,
    deleteRole,
} from "../controller/role_permissions.controller.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", authenticateUser, createRolePermissions);
router.get("/", authenticateUser, getAllItems);
router.post("/:id", authenticateUser, addRole);
router.put("/:id/:roleId", authenticateUser, addPermissionToRole);
router.put("/:id", authenticateUser, updateRolePermissions);
router.delete("/:id/:roleId", authenticateUser, deleteRole);

export default router;
