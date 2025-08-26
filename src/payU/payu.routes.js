import express from "express";
import { initiatePayment, verifyPayment } from "./payu.controller.js";

const router = express.Router();

// Debug middleware
router.use((req, res, next) => {
  console.log(`[PayU Route] ${req.method} ${req.path}`);
  console.log('Body:', req.body);
  console.log('Query:', req.query);
  next();
});

// Payment initiation routes
router.post("/initiate-payment", initiatePayment);
router.post("/initiatePayment", initiatePayment);

// ✅ Handle BOTH GET and POST for verification
router.get("/verify/:id", verifyPayment);
router.post("/verify/:id", verifyPayment);  // Add this line!

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "PayU routes are working!" });
});

export default router;