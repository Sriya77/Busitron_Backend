import express from "express";
import {
    addReply,
    createComment,
    deleteComment,
    editComment,
    getCommentsByTask,
} from "../controller/comment.controller.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/createComment/:taskId", authenticateUser, createComment);

router.get("/:taskId", authenticateUser, getCommentsByTask);

router.put("/:commentId", authenticateUser, editComment);

router.delete("/:commentId", authenticateUser, deleteComment);

router.post("/:commentId/reply", authenticateUser, addReply);

export default router;
