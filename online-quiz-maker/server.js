require('dotenv').config();
const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./src/routes/authRoutes');
const quizRoutes = require('./src/routes/quizRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const { pool } = require('./src/config/db');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false }), authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use(express.static(path.join(__dirname, 'public')));
app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok', database: 'connected' }); }
  catch (_e) { res.status(503).json({ status: 'error', message: 'Database unavailable. Check your .env and MySQL server.' }); }
});
app.use('/api', (_req, res) => res.status(404).json({ message: 'API endpoint not found.' }));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Unexpected server error.' });
});
const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Online Quiz Maker running at http://localhost:${port}`));
