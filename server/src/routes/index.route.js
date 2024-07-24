import { Router } from "express";
import chatRouter from "./chat.route.js";

const router = Router();

router.use("/api/v1", chatRouter);

export default router;
