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

router.post("/projects", upload.array("attachments", 5), createProject);
router.get("/projects", getAllProjects);
router.get("/projects/:id", getProjectById);
router.put("/projects/:id", updateProject);
router.delete("/projects/:id", deleteProject);
router.delete("/projects/:projectId/members/:memberId", deleteProjectMember);
router.post(
  "/projects/:projectId/files",
  upload.array("attachments", 5),
  projectfiles
);
router.put(
  "/projects/:projectId/files",
  upload.array("attachments", 5),
  updateProjectFiles
);
router.delete("/projects/:projectId/files/:fileName", deleteProjectFileURL);
router.get('/projects/:projectId/members/' , getAllmembers)




router.post("/projects/:projectId/milestones", addMilestone);
router.get("/projects/:projectId/milestones", getMilestones);
router.put("/projects/:projectId/milestones/:milestoneId", updateMilestone);
router.delete("/projects/:projectId/milestones/:milestoneId", deleteMilestone);

router.put("/projects/:projectId/members", addProjectMembers);
router.delete("/projects/:projectId/members/:memberId", deleteProjectMember);

export default router;
