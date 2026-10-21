import express from "express";
import { getMyBooks, getAllBooks, getBookById } from "../controllers/bookController.js";
import { authenticateToken, requireAuthor, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Author route to view their published books with royalty metrics
router.get("/my-books", authenticateToken, requireAuthor, getMyBooks);

// Admin route to list/search all books across all authors
router.get("/all", authenticateToken, requireAdmin, getAllBooks);

// Detail lookup for a single book (role-checked inside controller)
router.get("/:id", authenticateToken, getBookById);

export default router;
