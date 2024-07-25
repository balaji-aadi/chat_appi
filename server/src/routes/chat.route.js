import { Router } from "express";
import {
  fileUpload,
  generateSocketId,
  // getFilesDataController,
  messageController,
  userStatusController,
} from "../controller/chat.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/generate-socketId").post(generateSocketId);
router.route("/get/messages").get(messageController);
router.route("/get/status").get(userStatusController);
router.route("/upload").post(upload.array("files", 10), fileUpload);

export default router;
