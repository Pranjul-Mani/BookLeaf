import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender_role: {
    type: String,
    enum: ["author", "admin", "system"],
    required: true
  },
  sender_name: {
    type: String,
    required: true
  },
  sender_email: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  attachments: [
    {
      name: String,
      size: Number,
      file_type: String,
      url: String
    }
  ],
  is_ai_assisted: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

const internalNoteSchema = new mongoose.Schema({
  author_name: {
    type: String,
    required: true
  },
  author_email: {
    type: String,
    required: true
  },
  note: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

const ticketSchema = new mongoose.Schema(
  {
    ticket_number: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    author_id: {
      type: String,
      required: true,
      index: true
    },
    author_name: {
      type: String,
      required: true
    },
    author_email: {
      type: String,
      required: true
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      default: null
    },
    book_id: {
      type: String,
      default: "General / Account Level"
    },
    book_title: {
      type: String,
      default: "General Inquiry"
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: [
        "Royalty & Payments",
        "ISBN & Metadata Issues",
        "Printing & Quality",
        "Distribution & Availability",
        "Book Status & Production Updates",
        "General Inquiry"
      ],
      required: true,
      index: true
    },
    priority: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low"],
      default: "Medium",
      index: true
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed"],
      default: "Open",
      index: true
    },
    assigned_to: {
      admin_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
      },
      name: {
        type: String,
        default: null
      },
      email: {
        type: String,
        default: null
      }
    },
    ai_classification: {
      category: String,
      confidence: Number,
      reasoning: String,
      classified_at: Date
    },
    ai_priority_score: {
      priority: String,
      urgency_score: Number,
      reasoning: String,
      scored_at: Date
    },
    ai_draft_response: {
      content: String,
      suggested_actions: [String],
      model_used: String,
      token_usage: Object,
      generated_at: Date
    },
    is_category_overridden: {
      type: Boolean,
      default: false
    },
    is_priority_overridden: {
      type: Boolean,
      default: false
    },
    attachments: [
      {
        name: String,
        size: Number,
        file_type: String,
        url: String
      }
    ],
    messages: [messageSchema],
    internal_notes: [internalNoteSchema]
  },
  {
    timestamps: true
  }
);

// Indexes for searching and sorting
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ priority: 1, createdAt: 1 }); // for urgent & oldest unresolved sorting

export const Ticket = mongoose.model("Ticket", ticketSchema);
