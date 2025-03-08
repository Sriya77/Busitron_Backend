import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandle.js";
import { errorHandler } from "../utils/errorHandle.js";
import Conversation from "../models/conversation.models.js";
import User from "../models/user.models.js";
import {uploadToS3} from "../services/aws.service.js"

// GET ME
export const getEmployee = asyncHandler(async (req, res, next) => {
   try{
    res.status(200).json({
        status: "success",
        message: "User Info found successfully!",
        data: {
          user: req.user,
        },
      });
   }catch(err){
    throw new errorHandler(500, err.message);
   }
  });


// GET USERS
export const allEmployees = asyncHandler(async (req, res, next) => {
    try {

        const { _id } = req.user;
        const other_users = await User.find({ _id: { $ne: _id } }).select(
            "name _id avatar"
        );

        res.json( new apiResponse(
            200,
            { other_users },
            "Users found successfully!"
        ))
       
    } catch (err) {
        throw new errorHandler(500, err.message);
    }
});

// START CONVERSATION
export const startConversation = asyncHandler(async (req, res, next) => {
    try {
        const { userId } = req.body;
        const { _id } = req.user;

        // Check if a conversation between these two users already exists
        let conversation = await Conversation.findOne({
            participants: { $all: [userId, _id] },
        })
            .populate("messages")
            .populate("participants");

        if (conversation) {

            return res.json(new apiResponse(200, { conversation }, "success"));
        } else {
            // Create a new conversation
            let newConversation = await Conversation.create({
                participants: [userId, _id],
            });

            newConversation = await Conversation.findById(newConversation._id)
                .populate("messages")
                .populate("participants");

            return new apiResponse(
                201,
                { conversation: newConversation },
                "success"
            );
        }
    } catch (err) {
        throw new errorHandler(500, err.message);
    }
});



// GET CONVERSATIONS
export const getConversations = asyncHandler(async (req, res, next) => {
    try {
        const { _id } = req.user;
        // Find all conversations where the current user is a participant
        const conversations = await Conversation.find({
            participants: { $in: [_id] },
        })
            .populate("messages")
            .populate("participants");

        return res.json(new apiResponse(200, { conversations }, "success"));
    } catch (err) {
        throw new errorHandler(500, err.message);
    }
});


//Upload Media files-->pending
export const uploadMediaFiles = async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: "No files uploaded." });
      }

      if(req.files.length){
        const uploadedFiles = await Promise.all(
            req.files.map((file)=>
            uploadToS3(file,`projects/${file.originalname}`))
        )

        res.status(201).json({
            success: true,
            message: "Files uploaded successfully.",
            files: uploadedFiles,
          });
      }
  
      
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ success: false, message: "File upload failed." });
    }
  };
  