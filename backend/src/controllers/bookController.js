import { Book } from "../models/Book.js";

export async function getMyBooks(req, res) {
  try {
    const authorId = req.user.author_id;
    if (!authorId) {
      return res.status(400).json({
        success: false,
        message: "No author ID associated with this account"
      });
    }

    const books = await Book.find({ author_id: authorId }).sort({ publication_date: -1, createdAt: -1 });

    // Aggregate summary stats for the author dashboard
    const summary = books.reduce(
      (acc, b) => {
        acc.totalBooks += 1;
        if (b.status === "Published & Live") acc.publishedBooks += 1;
        else acc.inProductionBooks += 1;
        acc.totalCopiesSold += b.total_copies_sold || 0;
        acc.totalRoyaltyEarned += b.total_royalty_earned || 0;
        acc.royaltyPaid += b.royalty_paid || 0;
        acc.royaltyPending += b.royalty_pending || 0;
        return acc;
      },
      {
        totalBooks: 0,
        publishedBooks: 0,
        inProductionBooks: 0,
        totalCopiesSold: 0,
        totalRoyaltyEarned: 0,
        royaltyPaid: 0,
        royaltyPending: 0
      }
    );

    return res.status(200).json({
      success: true,
      books,
      summary
    });
  } catch (err) {
    console.error("getMyBooks error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error fetching author books"
    });
  }
}

export async function getAllBooks(req, res) {
  try {
    const { search, status, author_id } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (author_id) filter.author_id = author_id;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { isbn: { $regex: search, $options: "i" } },
        { genre: { $regex: search, $options: "i" } }
      ];
    }

    const books = await Book.find(filter).populate("author", "name email phone city").sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: books.length,
      books
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error fetching books catalog"
    });
  }
}

export async function getBookById(req, res) {
  try {
    const book = await Book.findById(req.params.id).populate("author", "name email");
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    // Role check: authors can only view their own books
    if (req.user.role === "author" && book.author_id !== req.user.author_id) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: you do not own this book record"
      });
    }

    return res.status(200).json({
      success: true,
      book
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error retrieving book"
    });
  }
}
