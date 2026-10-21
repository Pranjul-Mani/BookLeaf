import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";

import { User } from "../src/models/User.js";
import { Book } from "../src/models/Book.js";
import { Ticket } from "../src/models/Ticket.js";
import { aiService } from "../src/services/aiService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookleaf";

async function seedDatabase() {
  try {
    console.log(`[Seed] Connecting to MongoDB: ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log("[Seed] Connected successfully.");

    // Clear existing collections
    await User.deleteMany({});
    await Book.deleteMany({});
    await Ticket.deleteMany({});
    console.log("[Seed] Cleared existing Users, Books, and Tickets collections.");

    // Load sample dataset
    const rawData = fs.readFileSync(path.join(__dirname, "bookleaf_sample_data.json"), "utf8");
    const { authors } = JSON.parse(rawData);

    // 1. Create Single Test Admin Account (Full Access)
    console.log("[Seed] Creating Test Admin Account...");
    const testAdmin = await User.create({
      name: "Test User",
      email: "test@bookleaf.com",
      password: "password123",
      role: "admin",
      phone: "+91-99999-00000",
      city: "Headquarters"
    });

    // 2. Create Authors & Books
    console.log(`[Seed] Seeding ${authors.length} authors and their respective books...`);
    const authorUserMap = new Map();
    const createdBooks = [];

    for (const authorData of authors) {
      const user = await User.create({
        author_id: authorData.author_id,
        name: authorData.name,
        email: authorData.email,
        password: "password123",
        role: "author",
        phone: authorData.phone,
        city: authorData.city,
        joined_date: authorData.joined_date
      });

      authorUserMap.set(authorData.author_id, user);

      // Insert books for this author
      for (const b of authorData.books) {
        const book = await Book.create({
          book_id: b.book_id,
          author: user._id,
          author_id: authorData.author_id,
          title: b.title,
          isbn: b.isbn,
          genre: b.genre,
          publication_date: b.publication_date,
          status: b.status,
          mrp: b.mrp,
          author_royalty_per_copy: b.author_royalty_per_copy,
          total_copies_sold: b.total_copies_sold,
          total_royalty_earned: b.total_royalty_earned,
          royalty_paid: b.royalty_paid,
          royalty_pending: b.royalty_pending,
          last_royalty_payout_date: b.last_royalty_payout_date,
          print_partner: b.print_partner,
          available_on: b.available_on
        });
        createdBooks.push(book);
      }
    }
    console.log(`[Seed] Successfully seeded ${authors.length} authors and ${createdBooks.length} books.`);

    // 3. Pre-seed Realistic Sample Tickets Demonstrating All Edge Cases & Categories
    console.log("[Seed] Creating sample pre-seeded support tickets...");

    // Ticket 1: Critical Royalty Delay (Rohit Kapoor - AUTH002)
    const rohitUser = authorUserMap.get("AUTH002");
    const rohitBook = createdBooks.find((b) => b.book_id === "BK004");
    const t1Class = await aiService.classifyTicket(
      "Haven't received royalty for 6 months for Startup Sutra",
      "I published my book Startup Sutra over 6 months ago, sold over 1,200 copies, but have not received any royalty payout for the last two quarters. My pending balance shows ₹7,744. This is causing significant distress."
    );
    const t1Priority = await aiService.scorePriority(
      "Haven't received royalty for 6 months for Startup Sutra",
      "I published my book Startup Sutra over 6 months ago, sold over 1,200 copies, but have not received any royalty payout for the last two quarters. My pending balance shows ₹7,744. This is causing significant distress.",
      t1Class.category,
      rohitBook
    );
    const t1Draft = await aiService.draftResponse({
      authorName: rohitUser.name,
      book: rohitBook,
      subject: "Haven't received royalty for 6 months for Startup Sutra",
      description: "I published my book Startup Sutra over 6 months ago, sold over 1,200 copies, but have not received any royalty payout for the last two quarters. My pending balance shows ₹7,744. This is causing significant distress.",
      category: t1Class.category,
      priority: t1Priority.priority
    });

    await Ticket.create({
      ticket_number: "TCK-1001",
      author: rohitUser._id,
      author_id: rohitUser.author_id,
      author_name: rohitUser.name,
      author_email: rohitUser.email,
      book: rohitBook._id,
      book_id: rohitBook.book_id,
      book_title: rohitBook.title,
      subject: "Haven't received royalty for 6 months for Startup Sutra",
      description: "I published my book Startup Sutra over 6 months ago, sold over 1,200 copies, but have not received any royalty payout for the last two quarters. My pending balance shows ₹7,744. This is causing significant distress.",
      category: t1Class.category,
      priority: t1Priority.priority,
      status: "Open",
      ai_classification: {
        category: t1Class.category,
        confidence: t1Class.confidence,
        reasoning: t1Class.reasoning,
        classified_at: new Date()
      },
      ai_priority_score: {
        priority: t1Priority.priority,
        urgency_score: t1Priority.urgencyScore,
        reasoning: t1Priority.reasoning,
        scored_at: new Date()
      },
      ai_draft_response: {
        content: t1Draft.content,
        suggested_actions: t1Draft.suggestedActions,
        model_used: t1Draft.modelUsed,
        token_usage: t1Draft.tokenUsage,
        generated_at: new Date()
      },
      messages: [
        {
          sender_role: "author",
          sender_name: rohitUser.name,
          sender_email: rohitUser.email,
          content: "I published my book Startup Sutra over 6 months ago, sold over 1,200 copies, but have not received any royalty payout for the last two quarters. My pending balance shows ₹7,744. This is causing significant distress.",
          created_at: new Date(Date.now() - 36 * 3600 * 1000)
        }
      ],
      internal_notes: [
        {
          author_name: "Test User",
          author_email: "test@bookleaf.com",
          note: "Checked accounts database. Author's IFSC code had a typo in previous batch. Finance team needs to re-trigger NEFT transfer manually.",
          created_at: new Date(Date.now() - 12 * 3600 * 1000)
        }
      ],
      createdAt: new Date(Date.now() - 36 * 3600 * 1000)
    });

    // Ticket 2: ISBN Mismatch (Sneha Kulkarni - AUTH007)
    const snehaUser = authorUserMap.get("AUTH007");
    const snehaBook = createdBooks.find((b) => b.book_id === "BK011");
    const t2Class = await aiService.classifyTicket(
      "My book is showing a different ISBN on Amazon than what's on physical copy",
      "I noticed that on Amazon India, my book The Algorithm of Love shows ISBN 978-93-5XXXX-99-9, but the physical copy delivered to my readers has 978-93-5XXXX-11-0. Readers are confused and reviews are getting split."
    );
    const t2Priority = await aiService.scorePriority(
      "My book is showing a different ISBN on Amazon than what's on physical copy",
      "I noticed that on Amazon India, my book The Algorithm of Love shows ISBN 978-93-5XXXX-99-9, but the physical copy delivered to my readers has 978-93-5XXXX-11-0. Readers are confused and reviews are getting split.",
      t2Class.category,
      snehaBook
    );
    const t2Draft = await aiService.draftResponse({
      authorName: snehaUser.name,
      book: snehaBook,
      subject: "My book is showing a different ISBN on Amazon than what's on physical copy",
      description: "I noticed that on Amazon India, my book The Algorithm of Love shows ISBN 978-93-5XXXX-99-9, but the physical copy delivered to my readers has 978-93-5XXXX-11-0. Readers are confused and reviews are getting split.",
      category: t2Class.category,
      priority: t2Priority.priority
    });

    await Ticket.create({
      ticket_number: "TCK-1002",
      author: snehaUser._id,
      author_id: snehaUser.author_id,
      author_name: snehaUser.name,
      author_email: snehaUser.email,
      book: snehaBook._id,
      book_id: snehaBook.book_id,
      book_title: snehaBook.title,
      subject: "My book is showing a different ISBN on Amazon than what's on physical copy",
      description: "I noticed that on Amazon India, my book The Algorithm of Love shows ISBN 978-93-5XXXX-99-9, but the physical copy delivered to my readers has 978-93-5XXXX-11-0. Readers are confused and reviews are getting split.",
      category: t2Class.category,
      priority: t2Priority.priority,
      status: "In Progress",
      assigned_to: {
        admin_id: testAdmin._id,
        name: testAdmin.name,
        email: testAdmin.email
      },
      ai_classification: {
        category: t2Class.category,
        confidence: t2Class.confidence,
        reasoning: t2Class.reasoning,
        classified_at: new Date()
      },
      ai_priority_score: {
        priority: t2Priority.priority,
        urgency_score: t2Priority.urgencyScore,
        reasoning: t2Priority.reasoning,
        scored_at: new Date()
      },
      ai_draft_response: {
        content: t2Draft.content,
        suggested_actions: t2Draft.suggestedActions,
        model_used: t2Draft.modelUsed,
        token_usage: t2Draft.tokenUsage,
        generated_at: new Date()
      },
      messages: [
        {
          sender_role: "author",
          sender_name: snehaUser.name,
          sender_email: snehaUser.email,
          content: "I noticed that on Amazon India, my book The Algorithm of Love shows ISBN 978-93-5XXXX-99-9, but the physical copy delivered to my readers has 978-93-5XXXX-11-0. Readers are confused and reviews are getting split.",
          created_at: new Date(Date.now() - 18 * 3600 * 1000)
        },
        {
          sender_role: "admin",
          sender_name: testAdmin.name,
          sender_email: testAdmin.email,
          content: "Dear Sneha,\n\nThank you for bringing this to our attention. We treat any discrepancy with ISBN data with the utmost urgency, as accurate cataloging is vital for your book's sales.\n\nI have flagged this record for 'The Algorithm of Love' directly to our Production and Cataloging leads. We have initiated an urgent catalog ticket with Amazon's vendor team and will update you with a resolution within 48 hours.\n\nWarm regards,\nTest User\nBookLeaf Support Team",
          is_ai_assisted: true,
          created_at: new Date(Date.now() - 10 * 3600 * 1000)
        }
      ],
      internal_notes: [
        {
          author_name: "Test User",
          author_email: "test@bookleaf.com",
          note: "Repro India catalog team contacted. Feed re-push in progress.",
          created_at: new Date(Date.now() - 9 * 3600 * 1000)
        }
      ],
      createdAt: new Date(Date.now() - 18 * 3600 * 1000)
    });

    // Ticket 3: Printing Quality Misprints (Meera Nair - AUTH005)
    const meeraUser = authorUserMap.get("AUTH005");
    const meeraBook = createdBooks.find((b) => b.book_id === "BK008");
    const t3Class = await aiService.classifyTicket(
      "Author copies received with misaligned pages and binding defect",
      "I received my 10 author copies of Cardamom & Chaos today. The spine binding is peeling off and chapters 4 and 5 are completely misprinted with blurry text."
    );
    const t3Priority = await aiService.scorePriority(
      "Author copies received with misaligned pages and binding defect",
      "I received my 10 author copies of Cardamom & Chaos today. The spine binding is peeling off and chapters 4 and 5 are completely misprinted with blurry text.",
      t3Class.category,
      meeraBook
    );
    const t3Draft = await aiService.draftResponse({
      authorName: meeraUser.name,
      book: meeraBook,
      subject: "Author copies received with misaligned pages and binding defect",
      description: "I received my 10 author copies of Cardamom & Chaos today. The spine binding is peeling off and chapters 4 and 5 are completely misprinted with blurry text.",
      category: t3Class.category,
      priority: t3Priority.priority
    });

    await Ticket.create({
      ticket_number: "TCK-1003",
      author: meeraUser._id,
      author_id: meeraUser.author_id,
      author_name: meeraUser.name,
      author_email: meeraUser.email,
      book: meeraBook._id,
      book_id: meeraBook.book_id,
      book_title: meeraBook.title,
      subject: "Author copies received with misaligned pages and binding defect",
      description: "I received my 10 author copies of Cardamom & Chaos today. The spine binding is peeling off and chapters 4 and 5 are completely misprinted with blurry text.",
      category: t3Class.category,
      priority: t3Priority.priority,
      status: "Open",
      ai_classification: {
        category: t3Class.category,
        confidence: t3Class.confidence,
        reasoning: t3Class.reasoning,
        classified_at: new Date()
      },
      ai_priority_score: {
        priority: t3Priority.priority,
        urgency_score: t3Priority.urgencyScore,
        reasoning: t3Priority.reasoning,
        scored_at: new Date()
      },
      ai_draft_response: {
        content: t3Draft.content,
        suggested_actions: t3Draft.suggestedActions,
        model_used: t3Draft.modelUsed,
        token_usage: t3Draft.tokenUsage,
        generated_at: new Date()
      },
      messages: [
        {
          sender_role: "author",
          sender_name: meeraUser.name,
          sender_email: meeraUser.email,
          content: "I received my 10 author copies of Cardamom & Chaos today. The spine binding is peeling off and chapters 4 and 5 are completely misprinted with blurry text.",
          created_at: new Date(Date.now() - 4 * 3600 * 1000)
        }
      ],
      createdAt: new Date(Date.now() - 4 * 3600 * 1000)
    });

    console.log("[Seed] Sample tickets created successfully.");

    console.log("\n========================================================");
    console.log("             BOOKLEAF SEEDING COMPLETE                  ");
    console.log("========================================================");
    console.log("Admin Login (Full Access):");
    console.log("  - test@bookleaf.com   | password123 (Test User - Admin)");
    console.log("\nSample Author Logins (All passwords: password123):");
    authors.slice(0, 5).forEach((a) => {
      console.log(`  - [${a.author_id}] ${a.email} (${a.name})`);
    });
    console.log("========================================================\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("[Seed] Error during seeding:", err);
    process.exit(1);
  }
}

seedDatabase();
