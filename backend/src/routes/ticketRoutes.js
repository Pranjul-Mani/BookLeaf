import express from "express";
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  addMessage,
  addInternalNote,
  regenerateAiDraft,
  getTicketStats
} from "../controllers/ticketController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Author creates a new support ticket
router.post("/", authenticateToken, createTicket);

// List tickets (Role-based: authors see only their own; admins see all with filters)
router.get("/", authenticateToken, getTickets);

// Admin dashboard statistics
router.get("/stats/summary", authenticateToken, requireAdmin, getTicketStats);

// Get single ticket details
router.get("/:id", authenticateToken, getTicketById);

// Admin update ticket status, priority, category, or assignment
router.patch("/:id", authenticateToken, requireAdmin, updateTicket);

// Author or Admin adds a message / reply to a ticket
router.post("/:id/messages", authenticateToken, addMessage);

// Admin adds an internal note (never visible to authors)
router.post("/:id/internal-notes", authenticateToken, requireAdmin, addInternalNote);

// Admin requests AI draft response regeneration
router.post("/:id/ai-draft", authenticateToken, requireAdmin, regenerateAiDraft);

export default router;
