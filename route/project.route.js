import express from "express";
import {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    deleteProject,
    deleteProjectMember,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    getMilestones,
    addProjectMembers,
    projectfiles,
    updateProjectFiles,
    deleteProjectFileURL,
    getAllmembers,
} from "../controller/project.controller.js";

const router = express.Router();
import { upload } from "../middlewares/fileupload.middleware.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

router.post("/projects", authenticateUser, upload.array("attachments", 5), createProject);
router.get("/projects", authenticateUser, getAllProjects);
router.get("/projects/:id", authenticateUser, getProjectById);
router.put("/projects/:id", authenticateUser, upload.array("attachments", 5), updateProject);
router.delete("/projects/:id", authenticateUser, deleteProject);
router.delete("/projects/:projectId/members/:memberId", authenticateUser, deleteProjectMember);
router.post(
    "/projects/:projectId/files",
    authenticateUser,
    upload.array("attachments", 5),
    projectfiles
);
router.put(
    "/projects/:projectId/files",
    authenticateUser,
    upload.array("attachments", 5),
    updateProjectFiles
);
router.delete("/projects/:projectId/files/:fileName", authenticateUser, deleteProjectFileURL);
router.get("/projects/:projectId/members/", authenticateUser, getAllmembers);
router.post("/projects/:projectId/milestones", authenticateUser, addMilestone);
router.get("/projects/:projectId/milestones", authenticateUser, getMilestones);
router.put("/projects/:projectId/milestones/:milestoneId", authenticateUser, updateMilestone);
router.delete("/projects/:projectId/milestones/:milestoneId", authenticateUser, deleteMilestone);
router.put("/projects/:projectId/members", authenticateUser, addProjectMembers);
router.delete("/projects/:projectId/members/:memberId", authenticateUser, deleteProjectMember);

export default router;
