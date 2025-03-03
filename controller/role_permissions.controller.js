import RolePermission from "../models/role_permissions.models.js";
import { errorHandler } from "../utils/errorHandle.js";
import { asyncHandler } from "../utils/asyncHandle.js";
import { apiResponse } from "../utils/apiResponse.js";

export const createRolePermissions = asyncHandler(async (req, res, next) => {
    try {
        const { role_permissions } = req.body;

        if (!Array.isArray(role_permissions) || role_permissions.length === 0) {
            return next(new errorHandler(400, "role_permissions array is required"));
        }

        const newRolePermission = new RolePermission({ role_permissions });
        const savedRolePermission = await newRolePermission.save();

        res.status(201).json(new apiResponse(201, savedRolePermission, "Successfully created"));
    } catch (error) {
        next(new errorHandler(500, error.message));
    }
});

export const getAllItems = asyncHandler(async (req, res, next) => {
    try {
        const items = await RolePermission.find();
        res.status(200).json(items);
    } catch (error) {
        next(new errorHandler(500, error.message));
    }
});

export const updateRolePermissions = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role_permissions } = req.body;

        if (!id) return next(new errorHandler(400, "RolePermission ID is required"));
        if (!Array.isArray(role_permissions) || role_permissions.length === 0) {
            return next(new errorHandler(400, "role_permissions array is required"));
        }

        const updatedRolePermission = await RolePermission.findByIdAndUpdate(
            id,
            { role_permissions },
            { new: true, runValidators: true }
        );

        if (!updatedRolePermission) return next(new errorHandler(404, "Role permission not found"));

        res.status(200).json(new apiResponse(200, updatedRolePermission, "Successfully updated"));
    } catch (error) {
        next(new errorHandler(500, error.message));
    }
});

export const addRole = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!id) return next(new errorHandler(400, "RolePermission ID is required"));
        if (!role) return next(new errorHandler(400, "Role is required"));

        const rolePermission = await RolePermission.findById(id);
        if (!rolePermission) return next(new errorHandler(404, "RolePermission object not found"));

        rolePermission.role_permissions.push({ role, permissions: {} });
        const updatedRolePermission = await rolePermission.save();

        res.status(200).json(new apiResponse(200, updatedRolePermission, "Role successfully added"));
    } catch (error) {
        next(new errorHandler(500, error.message));
    }
});

export const addPermissionToRole = asyncHandler(async (req, res, next) => {
    try {
        const { id, roleId } = req.params;
        const { permissions } = req.body;

        if (!id || !roleId) return next(new errorHandler(400, "ID and role ID are required"));
        if (!permissions || typeof permissions !== "object") return next(new errorHandler(400, "Permissions object is required"));

        const rolePermission = await RolePermission.findById(id);
        if (!rolePermission) return next(new errorHandler(404, "RolePermission object not found"));

        const role = rolePermission.role_permissions.find(r => r._id.toString() === roleId);
        if (!role) return next(new errorHandler(404, "Role not found"));

        role.permissions = { ...role.permissions, ...permissions };
        const updatedRolePermission = await rolePermission.save();

        res.status(200).json(new apiResponse(200, updatedRolePermission, "Permissions added successfully"));
    } catch (error) {
        next(new errorHandler(500, error.message));
    }
});

export const deleteRole = asyncHandler(async (req, res, next) => {
    try {
        const { id, roleId } = req.params;

        if (!id || !roleId) return next(new errorHandler(400, "ID and role ID are required"));

        const rolePermission = await RolePermission.findById(id);
        if (!rolePermission) return next(new errorHandler(404, "RolePermission object not found"));

        const roleIndex = rolePermission.role_permissions.findIndex(r => r._id.toString() === roleId);
        if (roleIndex === -1) return next(new errorHandler(404, "Role not found"));

        rolePermission.role_permissions.splice(roleIndex, 1);
        const updatedRolePermission = await rolePermission.save();

        res.status(200).json(new apiResponse(200, updatedRolePermission, "Role deleted successfully"));
    } catch (error) {
        next(new errorHandler(500, error.message));
    }
});
