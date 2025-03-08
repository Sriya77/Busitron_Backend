import express from "express";
import { 
  getEmployee, 
  allEmployees, 
  startConversation, 
  getConversations, 
  uploadMediaFiles
} from "../controller/message.controller.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/fileupload.middleware.js";

const router = express.Router();

router.use(authenticateUser );

router.get("/current-employee", getEmployee); 
router.get("/all-employees", allEmployees);     
router.post("/conversation-start", startConversation);  
router.get("/conversations", getConversations);  
  
router.post("/files", upload.array("media", 8), uploadMediaFiles);     

export default router;
