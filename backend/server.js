/**
 * LibraryOS — Main Server
 * Express.js REST API
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes       = require('./routes/auth');
const bookRoutes       = require('./routes/books');
const borrowRoutes     = require('./routes/borrow');
const reserveRoutes    = require('./routes/reservations');
const reviewRoutes     = require('./routes/reviews');
const progressRoutes   = require('./routes/progress');
const roomRoutes       = require('./routes/rooms');
const notifRoutes      = require('./routes/notifications');
const analyticsRoutes  = require('./routes/analytics');
const marketRoutes     = require('./routes/marketplace');
const chatbotRoutes    = require('./routes/chatbot');
const userRoutes       = require('./routes/users');
const finesRoutes      = require('./routes/fines');
const requestRoutes    = require('./routes/requests');

const app = express();
const PORT = process.env.PORT || 4000;

// ── Security & Parsing ─────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiting ──────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ── Routes ─────────────────────────────────────
app.use('/api/auth',            authRoutes);
app.use('/api/books',           bookRoutes);
app.use('/api/borrow',          borrowRoutes);
app.use('/api/reserve',         reserveRoutes);
app.use('/api/reviews',         reviewRoutes);
app.use('/api/reading-progress', progressRoutes);
app.use('/api/study-rooms',     roomRoutes);
app.use('/api/notifications',   notifRoutes);
app.use('/api/analytics',       analyticsRoutes);
app.use('/api/marketplace',     marketRoutes);
app.use('/api/chatbot',         chatbotRoutes);
app.use('/api/users',           userRoutes);
app.use('/api/fines',           finesRoutes);
app.use('/api/requests',        requestRoutes);

// ── Health Check ───────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// ── 404 Handler ────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global Error Handler ───────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ──────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  LibraryOS API  →  http://localhost:${PORT}`);
  console.log(`📊  Environment    →  ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
