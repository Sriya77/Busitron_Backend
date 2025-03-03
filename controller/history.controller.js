import { errorHandler } from "../utils/errorHandle.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandle.js";
import History from "../models/history.models.js";

export const getHistoryById = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    if (!taskId) throw new errorHandler(400, "Task ID is required");

    const historyRecords = await History.find({ taskId }).populate("assignedBy", "name email");

    if (!historyRecords.length) {
        throw new errorHandler(404, "No history found for this task");
    }

    res.status(200).json(new apiResponse(200, historyRecords, "History retrieved successfully"));
});
