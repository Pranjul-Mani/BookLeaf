import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "bookleaf-super-secret-jwt-key-2026";

export function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      author_id: user.author_id,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token required"
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User session is invalid or user has been deleted"
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access restricted to administrators only"
    });
  }
  next();
}

export function requireAuthor(req, res, next) {
  if (!req.user || req.user.role !== "author") {
    return res.status(403).json({
      success: false,
      message: "Access restricted to authors only"
    });
  }
  next();
}
