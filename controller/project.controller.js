import projectModel from "../models/project.models.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandle.js";
import { errorHandler } from "../utils/errorHandle.js";
import { uploadToS3 } from "../services/aws.service.js";

export const createProject = asyncHandler(async (req, res) => {
	try {
		const {
			shortCode,
			projectName,
			startDate,
			endDate,
			projectCategory,
			department,
			projectSummary,
		} = req.body;

		if (!projectName || !startDate || !endDate)
			throw new errorHandler(400, "All required fields must be filled.");

		const newProject = new projectModel({
			shortCode,
			projectName,
			startDate,
			endDate,
			projectCategory,
			department,
			projectSummary,
		});
		if (!newProject)
			throw new errorHandler(400, "project not saved successfully");
		await newProject.save();

		if (req.files?.length) {
			newProject.attachments = await Promise.all(
				req.files.map((file) =>
					uploadToS3(file, `projects/${newProject._id}/attachments`)
				)
			);

			await newProject.save();
		}

		if (!newProject)
			throw new errorHandler(400, "project not saved successfully");

		res.status(201).json(
			new apiResponse(201, newProject, "Project created successfully")
		);
	} catch (error) {
		throw errorHandler(500, error.message);
	}
});

export const getAllProjects = asyncHandler(async (req, res) => {
	try {
		const projects = await projectModel.find();
		if (projects.length === 0)
			throw new errorHandler(404, "project not found");
		res.status(200).json(
			new apiResponse(200, projects, "Projects fetched successfully")
		);
	} catch (error) {
		throw errorHandler(500, error.message);
	}
});

export const getProjectById = asyncHandler(async (req, res) => {
	try {
		const { id } = req.params;
		if (!id) throw new errorHandler(400, "projectId must be required");
		const project = await projectModel.findById(id).populate({
			path: "projectMembers",
			select: "name email phoneNumber avatar role",
		});

		if (!project) throw new errorHandler(404, "Project not found.");

		const attachmentsWithFilenames =
			project.attachments?.map((link) => {
				const parts = link.split("/");
				const filename = parts[parts.length - 1];
				return { link, filename };
			}) || [];

		res.status(200).json(
			new apiResponse(
				200,
				{
					...project.toObject(),
					attachments: attachmentsWithFilenames,
				},
				"Project fetched successfully"
			)
		);
	} catch (error) {
		throw errorHandler(500, error.message);
	}
});

export const updateProject = asyncHandler(async (req, res) => {
	try {
		const { id } = req.params;
		if (!id) throw new errorHandler(400, "projectId must be required");
		const updatedProject = await projectModel.findByIdAndUpdate(
			id,
			{ $set: req.body },
			{ new: true }
		);

		if (!updatedProject) throw new errorHandler(404, "Project not found.");
		res.status(200).json(
			new apiResponse(200, updatedProject, "Project updated successfully")
		);
	} catch (error) {
		throw errorHandler(500, error.message);
	}
});

export const deleteProjectMember = asyncHandler(async (req, res) => {
	try {
		const { projectId, memberId } = req.params;

		if (!projectId) throw new errorHandler(400, "projectId is required");

		if (memberId.length === 0) {
			throw new errorHandler(400, "select atleast one number");
		}

		const project = await projectModel.findById(projectId);

		if (!project) {
			throw new errorHandler(404, "Project not found.");
		}

		const memberIndex = project.projectMembers.findIndex(
			(member) => member._id.toString() === memberId
		);

		if (memberIndex === -1) {
			throw new errorHandler(404, "Project member not found.");
		}

		project.projectMembers.splice(memberIndex, 1);

		await project.save();

		res.status(200).json(
			new apiResponse(200, project, "Project member deleted successfully")
		);
	} catch (error) {
		throw errorHandler(500, error.message);
	}
});

export const addProjectMembers = asyncHandler(async (req, res) => {
	try {
		const { projectId } = req.params;
		const members = req.body;

		if (!Array.isArray(members) || members.length === 0) {
			throw new errorHandler(400, "Please Select Atleast One User");
		}

		const project = await projectModel.findById(projectId);
		if (!project) throw new errorHandler(404, "Project not found.");

		const newMemberIds = members.map((member) => member.id);
		const existingMembers = new Set(
			project.projectMembers.map((id) => id.toString())
		);

		const membersToAdd = newMemberIds.filter(
			(id) => !existingMembers.has(id)
		);

		if (membersToAdd.length === 0) {
			throw new errorHandler(
				400,
				"All selected members are already in the project."
			);
		}
		project.projectMembers.push(...membersToAdd);
		await project.save();
		const updatedProject = await projectModel
			.findById(projectId)
			.populate("projectMembers", "name email phoneNumber avatar role");
		res.status(200).json(
			new apiResponse(
				200,
				updatedProject,
				"Project members added successfully."
			)
		);
	} catch (error) {
		throw errorHandler(500, error.message);
	}
});

export const addMilestone = asyncHandler(async (req, res) => {
	try {
		const { projectId } = req.params;
		const { title, startDate, endDate, status } = req.body;

		const project = await projectModel.findById(projectId);
		if (!project) throw new errorHandler(404, "Project not found.");

		const newMilestone = { title, startDate, endDate, status };
		project.mileStone.push(newMilestone);

		await project.save();

		res.status(201).json(
			new apiResponse(201, project, "Milestone added successfully.")
		);
	} catch (error) {
		throw errorHandler(500, error.message);
	}
});

export const updateMilestone = asyncHandler(async (req, res) => {
	try {
		const { projectId, milestoneId } = req.params;
		const updatedData = req.body;

		const project = await projectModel.findById(projectId);
		if (!project) throw new errorHandler(404, "Project not found.");

		const milestone = project.mileStone.id(milestoneId);
		if (!milestone) throw new errorHandler(404, "Milestone not found.");

		Object.assign(milestone, updatedData);
		await project.save();

		res.status(200).json(
			new apiResponse(200, milestone, "Milestone updated successfully.")
		);
	} catch (error) {
		throw errorHandler(500, error.message);
	}
});

export const deleteMilestone = asyncHandler(async (req, res) => {
	try {
		const { projectId, milestoneId } = req.params;

		const project = await projectModel.findById(projectId);
		if (!project) throw new errorHandler(404, "Project not found.");

		if (!project.mileStone || project.mileStone.length === 0) {
			throw new errorHandler(404, "No milestones found in this project.");
		}

		const updatedMilestones = project.mileStone.filter(
			(milestone) => milestone._id.toString() !== milestoneId
		);

		project.mileStone = updatedMilestones;
		await project.save();

		res.status(200).json(
			new apiResponse(200, project, "Milestone deleted successfully.")
		);
	} catch (error) {
		throw errorHandler(500, error.message);
	}
});

export const getMilestones = asyncHandler(async (req, res) => {
	try {
		const { projectId } = req.params;

		if (!projectId)
			throw new errorHandler(400, "projectId must be required");

		const project = await projectModel.findById(projectId);
		if (!project) throw new errorHandler(404, "Project not found.");

		res.status(200).json(
			new apiResponse(
				200,
				project.mileStone,
				"Milestones fetched successfully."
			)
		);
	} catch (error) {
		throw errorHandler(500, error.message);
	}
});

export const deleteProject = asyncHandler(async (req, res) => {
	try {
		const { id } = req.params;
		if (!id) throw new errorHandler(400, "projectId must be required");
		const deletedProject = await projectModel.findByIdAndDelete(id, {
			new: true,
		});

		if (!deletedProject) throw new errorHandler(404, "Project not found.");
		res.status(200).json(
			new apiResponse(200, deletedProject, "Project deleted successfully")
		);
	} catch (error) {
		throw errorHandler(500, error.message);
	}
});

export const projectfiles = asyncHandler(async (req, res) => {
	try {
		const { projectId } = req.params;
		if (!projectId)
			throw new errorHandler(400, "projectId must be required");

		const Is_Project = await projectModel.findById(projectId);
		if (!Is_Project) {
			throw new errorHandler(400, "Project not found");
		}

		if (req.files?.length) {
			const uploadedFiles = await Promise.all(
				req.files.map((file) =>
					uploadToS3(file, `projects/${Is_Project._id}/attachments`)
				)
			);

			Is_Project.attachments = [
				...Is_Project.attachments,
				...uploadedFiles,
			];

			await Is_Project.save();
		}

		return res
			.status(200)
			.json(new apiResponse(200, Is_Project.attachments, ""));
	} catch (error) {
		throw errorHandler(500, error.message);
	}
});

export const updateProjectFiles = asyncHandler(async (req, res) => {
	try {
		const { projectId } = req.params;
		if (!projectId)
			throw new errorHandler(400, "projectId must be required");

		const project = await projectModel.findById(projectId);
		if (!project) {
			throw new errorHandler(400, "Project not found");
		}

		if (req.files?.length) {
			const uploadedFiles = await Promise.all(
				req.files.map((file) =>
					uploadToS3(file, `projects/${project._id}/attachments`)
				)
			);

			await projectModel.findByIdAndUpdate(projectId, {
				$set: { attachments: uploadedFiles },
			});
		}

		return res
			.status(200)
			.json(new apiResponse(200, project.attachments, ""));
	} catch (error) {
		throw errorHandler(500, error.message);
	}
});

export const deleteProjectFileURL = asyncHandler(async (req, res) => {
	try {
		const { projectId, fileName } = req.params;
		if (!projectId)
			throw new errorHandler(400, "projectId must be required");

		const project = await projectModel.findById(projectId);
		if (!project) {
			throw new errorHandler(400, "Project not found");
		}

		project.attachments = project.attachments.filter(
			(file) => !file.includes(fileName)
		);

		await project.save();

		// add custom response
		return res
			.status(200)
			.json(new apiResponse(200, project.attachments, ""));
	} catch (error) {
		throw errorHandler(500, error.message);
	}
});

export const getAllmembers = asyncHandler(async (req, res) => {
	try {
		const { projectId } = req.params;
		if (!projectId)
			throw new errorHandler(400, "projectId must be required");
		const Memberdata = await projectModel
			.findById(projectId)
			.populate("projectMembers");
		if (!Memberdata) {
			throw new errorHandler(400, "project not found");
		}
		const ProjectMemberdata = Memberdata.projectMembers;
		return res
			.status(200)
			.json(
				new apiResponse(
					200,
					ProjectMemberdata,
					"All members fetched successfully"
				)
			);
	} catch (error) {
		throw errorHandler(500, error.message);
	}
});
