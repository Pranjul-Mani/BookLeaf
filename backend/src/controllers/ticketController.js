import { Ticket } from "../models/Ticket.js";
import { Book } from "../models/Book.js";
import { aiService } from "../services/aiService.js";
import { getIO } from "../socket/index.js";

// Helper to generate sequential ticket numbers
async function getNextTicketNumber() {
  const count = await Ticket.countDocuments();
  return `TCK-${(1000 + count + 1)}`;
}

export async function createTicket(req, res) {
  try {
    const { subject, description, book_id, attachments } = req.body;

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: "Subject and detailed description are required"
      });
    }

    const author = req.user;
    let linkedBook = null;
    let bookTitle = "General Inquiry";

    if (book_id && book_id !== "General / Account Level") {
      linkedBook = await Book.findOne({ book_id, author_id: author.author_id });
      if (linkedBook) {
        bookTitle = linkedBook.title;
      }
    }

    // Step 1: AI Auto-Classification
    const classification = await aiService.classifyTicket(subject, description);
    const category = classification.category;

    // Step 2: AI Priority Scoring
    const priorityResult = await aiService.scorePriority(subject, description, category, linkedBook);
    const priority = priorityResult.priority;

    // Step 3: AI Draft Response Pre-generation
    const draftResponse = await aiService.draftResponse({
      authorName: author.name,
      book: linkedBook,
      subject,
      description,
      category,
      priority
    });

    const ticketNumber = await getNextTicketNumber();

    const ticket = new Ticket({
      ticket_number: ticketNumber,
      author: author._id,
      author_id: author.author_id,
      author_name: author.name,
      author_email: author.email,
      book: linkedBook ? linkedBook._id : null,
      book_id: book_id || "General / Account Level",
      book_title: bookTitle,
      subject: subject.trim(),
      description: description.trim(),
      category,
      priority,
      status: "Open",
      ai_classification: {
        category: classification.category,
        confidence: classification.confidence,
        reasoning: classification.reasoning,
        classified_at: new Date()
      },
      ai_priority_score: {
        priority: priorityResult.priority,
        urgency_score: priorityResult.urgencyScore,
        reasoning: priorityResult.reasoning,
        scored_at: new Date()
      },
      ai_draft_response: {
        content: draftResponse.content,
        suggested_actions: draftResponse.suggestedActions,
        model_used: draftResponse.modelUsed,
        token_usage: draftResponse.tokenUsage,
        generated_at: new Date()
      },
      attachments: attachments || [],
      messages: [
        {
          sender_role: "author",
          sender_name: author.name,
          sender_email: author.email,
          content: description.trim(),
          attachments: attachments || [],
          created_at: new Date()
        }
      ]
    });

    await ticket.save();

    // Broadcast real-time ticket creation event
    try {
      const io = getIO();
      if (io) {
        io.emit("ticket:created", { ticket });
      }
    } catch (sockErr) {
      console.warn("Socket broadcast error:", sockErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      ticket
    });
  } catch (err) {
    console.error("createTicket error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error creating support ticket: " + err.message
    });
  }
}

export async function getTickets(req, res) {
  try {
    const { status, category, priority, sortBy, search } = req.query;
    const filter = {};

    // Role-based scoping: Authors see only their own tickets; admins see all
    if (req.user.role === "author") {
      filter.author = req.user._id;
    }

    if (status && status !== "All") filter.status = status;
    if (category && category !== "All") filter.category = category;
    if (priority && priority !== "All") filter.priority = priority;

    if (search) {
      filter.$or = [
        { ticket_number: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { author_name: { $regex: search, $options: "i" } },
        { book_title: { $regex: search, $options: "i" } }
      ];
    }

    let sortCriteria = { createdAt: -1 };
    if (sortBy === "oldest_unresolved") {
      // Prioritize Open / In Progress first, then oldest createdAt
      sortCriteria = { status: -1, createdAt: 1 };
    } else if (sortBy === "urgent") {
      sortCriteria = { "ai_priority_score.urgency_score": -1, createdAt: 1 };
    }

    let query = Ticket.find(filter).sort(sortCriteria);

    // If author, omit internal notes from projection for privacy
    if (req.user.role === "author") {
      query = query.select("-internal_notes");
    }

    const tickets = await query.exec();

    return res.status(200).json({
      success: true,
      count: tickets.length,
      tickets
    });
  } catch (err) {
    console.error("getTickets error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error fetching tickets"
    });
  }
}

export async function getTicketById(req, res) {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }

    // Role-based protection: Author can only access their own ticket
    if (req.user.role === "author" && ticket.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: you cannot access tickets belonging to another author"
      });
    }

    // If author, strip internal notes
    const ticketData = ticket.toObject();
    if (req.user.role === "author") {
      delete ticketData.internal_notes;
    }

    return res.status(200).json({
      success: true,
      ticket: ticketData
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error retrieving ticket"
    });
  }
}

export async function updateTicket(req, res) {
  try {
    const { status, category, priority, assigned_to } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }

    // Admins can update status, category, priority, assigned_to
    if (status && ["Open", "In Progress", "Resolved", "Closed"].includes(status)) {
      ticket.status = status;
    }

    if (category && category !== ticket.category) {
      ticket.category = category;
      ticket.is_category_overridden = true;
    }

    if (priority && priority !== ticket.priority) {
      ticket.priority = priority;
      ticket.is_priority_overridden = true;
    }

    if (assigned_to !== undefined) {
      if (assigned_to === null || assigned_to === false) {
        ticket.assigned_to = {
          admin_id: null,
          name: null,
          email: null
        };
      } else {
        ticket.assigned_to = {
          admin_id: assigned_to.admin_id || req.user._id,
          name: assigned_to.name || req.user.name,
          email: assigned_to.email || req.user.email
        };
      }
    }

    await ticket.save();

    // Broadcast real-time update
    try {
      const io = getIO();
      if (io) {
        io.emit("ticket:updated", { ticket });
      }
    } catch (e) {
      console.warn("Socket broadcast error:", e.message);
    }

    return res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      ticket
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error updating ticket"
    });
  }
}

export async function addMessage(req, res) {
  try {
    const { content, attachments, is_ai_assisted, update_status } = req.body;
    const user = req.user;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content cannot be blank"
      });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }

    // Role check
    if (user.role === "author" && ticket.author.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden"
      });
    }

    const newMessage = {
      sender_role: user.role,
      sender_name: user.name,
      sender_email: user.email,
      content: content.trim(),
      attachments: attachments || [],
      is_ai_assisted: Boolean(is_ai_assisted),
      created_at: new Date()
    };

    ticket.messages.push(newMessage);

    // If admin replies, update status if requested or auto transition from Open -> In Progress
    if (user.role === "admin") {
      if (update_status) {
        ticket.status = update_status;
      } else if (ticket.status === "Open") {
        ticket.status = "In Progress";
      }
    } else if (user.role === "author" && (ticket.status === "Resolved" || ticket.status === "Closed")) {
      // Re-open if author replies to resolved ticket
      ticket.status = "In Progress";
    }

    await ticket.save();

    // Broadcast real-time message event
    try {
      const io = getIO();
      if (io) {
        io.emit("ticket:messageAdded", {
          ticketId: ticket._id,
          ticketNumber: ticket.ticket_number,
          message: newMessage,
          newStatus: ticket.status
        });
        io.emit("ticket:updated", { ticket });
      }
    } catch (e) {
      console.warn("Socket broadcast error:", e.message);
    }

    return res.status(200).json({
      success: true,
      message: "Response sent successfully",
      ticket
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error posting message"
    });
  }
}

export async function addInternalNote(req, res) {
  try {
    const { note } = req.body;
    const user = req.user;

    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        message: "Note content is required"
      });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }

    const newNote = {
      author_name: user.name,
      author_email: user.email,
      note: note.trim(),
      created_at: new Date()
    };

    ticket.internal_notes.push(newNote);
    await ticket.save();

    // Broadcast note addition to admins
    try {
      const io = getIO();
      if (io) {
        io.emit("ticket:noteAdded", {
          ticketId: ticket._id,
          note: newNote
        });
      }
    } catch (e) {
      console.warn("Socket broadcast error:", e.message);
    }

    return res.status(200).json({
      success: true,
      message: "Internal note saved",
      note: newNote,
      ticket
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error saving internal note"
    });
  }
}

export async function regenerateAiDraft(req, res) {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }

    let linkedBook = null;
    if (ticket.book) {
      linkedBook = await Book.findById(ticket.book);
    }

    const newDraft = await aiService.draftResponse({
      authorName: ticket.author_name,
      book: linkedBook,
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority
    });

    ticket.ai_draft_response = {
      content: newDraft.content,
      suggested_actions: newDraft.suggestedActions,
      model_used: newDraft.modelUsed,
      token_usage: newDraft.tokenUsage,
      generated_at: new Date()
    };

    await ticket.save();

    return res.status(200).json({
      success: true,
      message: "AI draft response regenerated",
      ai_draft_response: ticket.ai_draft_response
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to regenerate AI response"
    });
  }
}

export async function getTicketStats(req, res) {
  try {
    const total = await Ticket.countDocuments();
    const open = await Ticket.countDocuments({ status: "Open" });
    const inProgress = await Ticket.countDocuments({ status: "In Progress" });
    const resolved = await Ticket.countDocuments({ status: "Resolved" });
    const closed = await Ticket.countDocuments({ status: "Closed" });
    const critical = await Ticket.countDocuments({ priority: "Critical", status: { $in: ["Open", "In Progress"] } });
    const high = await Ticket.countDocuments({ priority: "High", status: { $in: ["Open", "In Progress"] } });

    // Category distribution
    const categoryCounts = await Ticket.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        total,
        open,
        inProgress,
        resolved,
        closed,
        critical,
        high,
        categoryCounts
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch ticket statistics"
    });
  }
}
