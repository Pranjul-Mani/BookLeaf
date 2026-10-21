import express from "express";
import { login, getMe, listDemoUsers } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", login);
router.get("/me", authenticateToken, getMe);
router.get("/demo-users", listDemoUsers);

export default router;
