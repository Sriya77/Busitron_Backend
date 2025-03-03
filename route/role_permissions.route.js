import express from "express";
import { createRolePermissions, getAllItems, updateRolePermissions, addRole, addPermissionToRole,deleteRole } from "../controller/role_permissions.controller.js";

const router = express.Router();

router.post("/", createRolePermissions);
router.get("/", getAllItems);
router.post("/:id", addRole);
router.put("/:id/:roleId", addPermissionToRole);
router.put("/:id", updateRolePermissions);
router.delete("/:id/:roleId",deleteRole)

export default router;

