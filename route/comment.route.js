import express from "express";
import {
    addComment,
    addReply,
    deleteComment,
    editComment,
    getCommentsByTask,
} from "../controller/comment.controller.js";
import { upload } from "../middlewares/fileupload.middleware.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/:taskId", authenticateUser, getCommentsByTask);

router.post("/:taskId", authenticateUser, upload.array("media", 5), addComment);

router.post("/:commentId/reply", authenticateUser, addReply);

router.put("/:commentId", authenticateUser, upload.array("media", 5), editComment);

router.delete("/:commentId", authenticateUser, deleteComment);

export default router;
