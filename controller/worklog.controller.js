import { errorHandler } from "../utils/errorHandle.js";
import { asyncHandler } from "../utils/asyncHandle.js";
import { apiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.models.js";
import { Worklog } from "../models/worklog.models.js";
import Task from "../models/task.models.js";

export const fetchAllWorkLog = asyncHandler(async (req, res, next) => {
    const { taskId } = req.params;

    try {
        const allWorklogRecords = await Worklog.find({ taskId });

        if (!allWorklogRecords || allWorklogRecords.length === 0) {
            return next(new ErrorHandler(404, "No record present related to this task."));
        }

        return res
            .status(200)
            .json(new apiResponse(200, allWorklogRecords, "Worklog records fetched successfully."));
    } catch (error) {
        next(new ErrorHandler(500, error.message || "Something went wrong."));
    }
});

export const assignWorkLog = asyncHandler(async (req, res) => {
    const { log, timeSpent } = req.body;
    const { taskId } = req.params;
    const user = req.user;

    try {
        const isUserExist = await User.findById(user._id).select(
            "-password -refreshToken -accessToken"
        );
        const isTaskExist = await Task.findById(taskId);

        if (!isUserExist || !isTaskExist) throw new errorHandler(404, "Invalid references.");

        if (!log) throw new errorHandler(401, "Task information required.");

        const workLog = await Worklog.create({
            taskId,
            loggedBy: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            log,
            timeSpent,
        });

        res.status(201).json(new apiResponse(201, workLog, "Work log created successfully."));
    } catch (error) {
        throw new errorHandler(500, "Something went wrong.");
    }
});

export const updateWorklog = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { log, timeSpent } = req.body;

    if (!id) throw new errorHandler(404, "Task ID is required.");

    try {
        const updatedWorklog = await Worklog.findByIdAndUpdate(
            id,
            { $set: { log, timeSpent } },
            { new: true, runValidators: true }
        );

        if (!updatedWorklog) throw new errorHandler(404, "Work log entry not found.");

        return res
            .status(200)
            .json(new apiResponse(200, updatedWorklog, "Work log updated successfully."));
    } catch (error) {
        next(new ErrorHandler(500, error.message || "Something went wrong."));
    }
});

export const deleteWorklog = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) throw new errorHandler(404, "Task not found.");

    try {
        await Worklog.findByIdAndDelete(id);
        res.status(200).json(new apiResponse(200, null, "Task deleted successfully."));
    } catch (error) {
        throw new errorHandler(500, "Something went wrong.");
    }
});
