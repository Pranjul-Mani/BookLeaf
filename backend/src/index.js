import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import { initSocket } from "./socket/index.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize real-time WebSocket layer
initSocket(server);

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "10mb" }));

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "BookLeaf Author Support & Communication API",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/tickets", ticketRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.method} ${req.originalUrl}' not found.`
  });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error("[Server Error]", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error occurred."
  });
});

// Database & Server Startup
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bookleaf";

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`[Database] Connected successfully to MongoDB at ${MONGODB_URI}`);

    server.listen(PORT, () => {
      console.log(`[BookLeaf Server] Running on http://localhost:${PORT}`);
      console.log(`[BookLeaf Socket] Real-time engine ready on port ${PORT}`);
    });
  } catch (err) {
    console.error("[Database] Connection failed:", err.message);
    process.exit(1);
  }
}

startServer();

export { app, server };
