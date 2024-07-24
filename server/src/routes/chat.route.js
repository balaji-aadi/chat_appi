import { Router } from "express";
import {
  fileUpload,
  generateSocketId,
  getFilesDataController,
  messageController,
  userStatusController,
} from "../controller/chat.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/generate-socketId").post(generateSocketId);
router.route("/get/messages").get(messageController);
router.route("/get/status").get(userStatusController);
router.route("/get/files").get(getFilesDataController);
router.route("/upload").post(upload.single("file"), fileUpload);

export default router;
