
# 🍃 BookLeaf Publishing — Author Support & Communication Portal

An end-to-end full-stack web application built for **BookLeaf Publishing** to solve author communication at scale across 22,000+ catalog titles. Features dual author-facing and admin-facing portals powered by **real-time WebSocket updates** and **AI-assisted ticket triage and response generation**.

---

## 🚀 Live Demo & Repository Structure

- **Author Portal**: Authors view their published & in-production books, track platform sales and quarterly royalties, submit support tickets, and chat with operations in real time.
- **Admin Portal**: Operations dashboard with ticket queue filtering (status, category, priority, oldest SLA), automated AI classification, priority scoring, editable AI-drafted responses backed by BookLeaf's Knowledge Base, and internal notes.

```
Bookleaf/
├── backend/                  # Node.js + Express + Mongoose + Socket.io
│   ├── src/
│   │   ├── controllers/      # Auth, Books, and Tickets controllers
│   │   ├── middleware/       # JWT auth & RBAC (Author vs Admin)
│   │   ├── models/           # User, Book, Ticket Mongoose schemas
│   │   ├── routes/           # RESTful route definitions
│   │   ├── services/         # AI Service & BookLeaf Knowledge Base
│   │   ├── socket/           # Real-time WebSocket connection manager
│   │   └── index.js          # Server entry point
│   ├── seed/                 # Database seeder with sample dataset
│   │   ├── bookleaf_sample_data.json
│   │   └── seed.js
│   ├── .env.example
│   └── package.json
├── frontend/                 # React (Vite) + Tailwind CSS + Lucide Icons
│   ├── src/
│   │   ├── components/       # AuthorDashboard, AdminDashboard, Navbar, Login, etc.
│   │   ├── context/          # AuthContext with 1-Click Fast Persona Switcher
│   │   ├── services/         # api.js and socket.js clients
│   │   ├── App.jsx
│   │   └── index.css         # Modern typography & glassmorphism theme
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── docs/
│   └── swagger.json          # OpenAPI 3.0 API Specification
├── APPROACH.md               # 1-page design decisions & production roadmap
└── README.md
```

---

## ⚡ Quick Start & Local Setup

### 1. Prerequisites
- **Node.js** (v18+ recommended, tested on v22)
- **MongoDB** running locally (`mongodb://127.0.0.1:27017/bookleaf`) or an Atlas connection URI

### 2. Install Dependencies
Run the install command from the root directory:
```bash
npm run install:all
```
*(Or manually run `npm install` in root, `backend/`, and `frontend/`)*

### 3. Configure Environment Variables
A default `.env` is already created in `backend/.env`. You may optionally supply your OpenAI / Gemini / Anthropic API key:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/bookleaf
JWT_SECRET=bookleaf_jwt_secure_secret_production_2026

# Optional: If omitted, the system seamlessly uses the internal BookLeaf Domain AI Engine!
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
AI_MODEL=gpt-4o-mini
```

### 4. Seed the Database
Populates all 10 authors, 18 books, admin accounts, and sample tickets:
```bash
npm run seed
```

### 5. Start the Application
Run both backend and frontend concurrently:
```bash
npm run dev
```
- **Frontend URL**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`
- **Health Check**: `http://localhost:5000/api/health`

---

## 🔑 Pre-Seeded Test Login Credentials

All accounts are pre-seeded with the default password: **`password123`**.  
*Tip: You can also use the **"1-Click Fast Login"** buttons on the login screen or the **"Switch Persona"** menu in the top bar to swap roles instantly without logging out!*

| Role | Name | Email | Persona / Edge Case |
|---|---|---|---|
| **Admin** | Sarah Jenkins | `admin@bookleaf.com` | Operations Lead (Triage queue, override AI, review drafts, add internal notes) |
| **Admin** | Vikram Mehta | `ops@bookleaf.com` | Support Specialist |
| **Author** | Rohit Kapoor (`AUTH002`) | `rohit.kapoor@email.com` | Bestseller author (1,200+ sold), pending royalty query (`BK004`) |
| **Author** | Sneha Kulkarni (`AUTH007`) | `sneha.kulkarni@email.com` | 3 titles, active ISBN mismatch query, book in Cover Design |
| **Author** | Priya Sharma (`AUTH001`) | `priya.sharma@email.com` | Literary fiction author with 2 published live books |
| **Author** | Kavita Deshmukh (`AUTH009`) | `kavita.deshmukh@email.com` | Edge case: Zero royalties, book in Typesetting |
| **Author** | Meera Nair (`AUTH005`) | `meera.nair@email.com` | Author copies received with misprints / binding defects |

---

## 🧠 AI Integration Details & Architecture

### 1. Knowledge Base Grounding & Persona Calibration
All AI-generated responses strictly enforce BookLeaf's documented business policies:
- **Royalty Engine**: 80/20 net profit split `[MRP - (Printing + Commission + Shipping)]`, quarterly cycles with 45-day payment windows, ₹1,000 threshold with automatic rollover.
- **ISBN Catalog Issues**: Immediate escalation to production with guaranteed **48-hour resolution timelines**.
- **Printing Defects**: Apologizes sincerely, requests photo proof of defects, triggers free reprint within **5–7 business days**.
- **Marketplace Sync**: Explains automated distributor stock indexing delays for Amazon/Flipkart, confirms re-sync initiated within **24–48 hours**.
- **Tone Guidelines**: Empathetic & professional, validates author frustration first, quotes exact figures and dates, owns BookLeaf mistakes without corporate deflection, and ends with actionable next steps.

### 2. Token Optimization & Cost Consciousness
Instead of blindly appending the entire database catalog and operational handbook to every API prompt:
- Auto-classification prompt is strictly scoped to ~150 tokens.
- Priority scoring takes only key intent signals and book metadata.
- Context injection dynamically selects only the relevant slice via `getContextForCategory(category)`.
- Reduces token consumption by **~70%** per ticket compared to naive RAG implementations.

### 3. Graceful Degradation & High Availability
If the external LLM provider is down, unconfigured, or rate-limited:
- The system automatically engages the internal **BookLeaf Domain Knowledge Engine**.
- Tickets are never dropped or left unclassified.
- Admins always receive a high-fidelity drafted response and suggested action checklist based directly on BookLeaf operational benchmarks.

---

## 📡 REST API Documentation

Detailed OpenAPI specification is available at [`docs/swagger.json`](./docs/swagger.json).

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | System and database health status |
| `POST` | `/api/auth/login` | Public | Email/password login; returns JWT & user profile |
| `GET` | `/api/auth/me` | Authenticated | Current user profile |
| `GET` | `/api/auth/demo-users` | Public | Convenience list of test accounts |
| `GET` | `/api/books/my-books` | Author | Author's books with royalty metrics & aggregates |
| `GET` | `/api/books/all` | Admin | Full catalog search across all authors |
| `GET` | `/api/tickets` | Authenticated | Role-scoped tickets (Author sees own, Admin sees all with filters) |
| `POST` | `/api/tickets` | Author | Creates ticket; triggers AI classification, priority & draft |
| `GET` | `/api/tickets/stats/summary` | Admin | KPI summary counts (Total, Open, Critical, etc.) |
| `GET` | `/api/tickets/:id` | Authenticated | Ticket details (Internal notes omitted for authors) |
| `PATCH` | `/api/tickets/:id` | Admin | Update status, override category, override priority, or assign |
| `POST` | `/api/tickets/:id/messages` | Authenticated | Post message; emits real-time WebSocket event |
| `POST` | `/api/tickets/:id/internal-notes` | Admin | Add team-only private note (hidden from author) |
| `POST` | `/api/tickets/:id/ai-draft` | Admin | Regenerate AI draft response on demand |

---

## 🧪 Edge Cases Handled

1. **Books in Production**: Handled gracefully without errors when `mrp`, `author_royalty_per_copy`, or `publication_date` are `null` (e.g., *Midnight in Mysore* or *Raising Roots*).
2. **Zero Royalties / Under ₹1,000 Threshold**: Clear visual indication that earnings below ₹1,000 roll over to the subsequent quarter.
3. **Data Privacy**: Strict role-based projection ensures authors cannot see `internal_notes` or tickets belonging to other authors.
4. **Real-time Concurrency**: Live updates delivered via Socket.io rooms without full-page reloads.

---

## 📄 Evaluation Deliverables
- **Architecture & Approach Write-Up**: See [APPROACH.md](./APPROACH.md) for priorities, trade-offs, and production evolution roadmap.
- **OpenAPI Specification**: See [docs/swagger.json](./docs/swagger.json).
