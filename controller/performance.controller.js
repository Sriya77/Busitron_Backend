import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandle.js";
import { errorHandler } from "../utils/errorHandle.js";
import { User } from "../models/user.models.js";
import Task from "../models/task.models.js";
import mongoose from "mongoose";

export const getCombinedStatistics = asyncHandler(async (req, res, next) => {
    try {
        const taskStatistics = {
            totalTasks: 0,
            Completed: 0,
            Pending: 0,
            "In Progress": 0,
            "To Do": 0,
            overdue: 0,
        };

        const [taskStats, users] = await Promise.all([
            Task.aggregate([
                {
                    $addFields: {
                        isOverdue: {
                            $cond: {
                                if: {
                                    $and: [
                                        { $ne: ["$status", "Completed"] },
                                        { $lt: ["$dueDate", new Date()] },
                                    ],
                                },
                                then: "overdue",
                                else: "$status",
                            },
                        },
                    },
                },
                {
                    $group: {
                        _id: "$isOverdue",
                        count: { $sum: 1 },
                    },
                },
            ]),

            User.aggregate([
                {
                    $lookup: {
                        from: "tasks",
                        localField: "_id",
                        foreignField: "assignedTo._id",
                        as: "tasks",
                    },
                },
                {
                    $project: {
                        userId: "$_id",
                        name: 1,
                        createdAt: 1,
                        completedTasks: {
                            $size: {
                                $filter: {
                                    input: "$tasks",
                                    as: "task",
                                    cond: { $eq: ["$$task.status", "Completed"] },
                                },
                            },
                        },
                        pendingTasks: {
                            $size: {
                                $filter: {
                                    input: "$tasks",
                                    as: "task",
                                    cond: { $eq: ["$$task.status", "Pending"] },
                                },
                            },
                        },
                        inProgressTasks: {
                            $size: {
                                $filter: {
                                    input: "$tasks",
                                    as: "task",
                                    cond: { $eq: ["$$task.status", "InProgress"] },
                                },
                            },
                        },
                        todo: {
                            $size: {
                                $filter: {
                                    input: "$tasks",
                                    as: "task",
                                    cond: { $eq: ["$$task.status", "ToDo"] },
                                },
                            },
                        },
                        dueTasks: {
                            $size: {
                                $filter: {
                                    input: "$tasks",
                                    as: "task",
                                    cond: {
                                        $and: [
                                            { $ne: ["$$task.status", "Completed"] },
                                            { $lt: ["$$task.dueDate", new Date()] },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
            ]),
        ]);
        taskStats.forEach((task) => {
            taskStatistics[task._id] = task.count;
            taskStatistics["totalTasks"] += task.count;
        });

        const combinedResponse = {
            taskStatistics,
            userStatistics: {
                users,
            },
        };

        res.status(200).json(
            new apiResponse(200, combinedResponse, "Task and user statistics fetched successfully")
        );
    } catch (err) {
        return next(new errorHandler(500, err.message));
    }
});

export const getParticularUserTask = asyncHandler(async (req, res) => {
    try {
        const { userId } = req.params;
        let pendingTasks = 0,
            completedTasks = 0,
            dueTasks = 0,
            totalTasks = 0,
            inprogress = 0;

        const getTasks = await Task.find({
            "assignedTo._id": new mongoose.Types.ObjectId(userId),
        })
            .select("title status assignedTo startDate dueDate taskID")
            .lean();

        totalTasks = getTasks.length;
        const currentDate = new Date();

        for (let i = 0; i < getTasks.length; i++) {
            getTasks[i].startDate = getTasks[i].startDate
                ? new Date(getTasks[i].startDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                  })
                : null;
            getTasks[i].dueDate = getTasks[i].dueDate
                ? new Date(getTasks[i].dueDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                  })
                : null;
            if (getTasks[i].status === "Completed") {
                completedTasks += 1;
            } else if (getTasks[i].status === "Pending") {
                pendingTasks += 1;
            } else if (getTasks[i].status === "In Progress") {
                inprogress += 1;
            } else if (
                getTasks[i].status !== "Completed" &&
                getTasks[i].dueDate < currentDate.toISOString().split("T")[0]
            ) {
                getTasks[i].status = "overdue";
                dueTasks += 1;
            }
        }
        res.status(200).json(
            new apiResponse(
                200,
                { totalTasks, completedTasks, pendingTasks, dueTasks, getTasks },
                "task fetched successfully"
            )
        );
    } catch (err) {
        res.status(500).json(new errorHandler(500, err.message));
    }
});
