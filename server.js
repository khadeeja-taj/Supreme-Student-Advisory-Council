'use strict';

/**
 * Supreme Student Advisory Council — API + static server.
 *
 * Serves the front-end from /public and exposes a small JSON API:
 *   POST   /api/register          public   — submit a registration
 *   POST   /api/admin/login       public   — exchange the admin password for a token
 *   GET    /api/registrations     admin     — list all registrations
 *   DELETE /api/registrations     admin     — delete all registrations
 *   GET    /api/health            public   — health check
 */

require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const dbApi = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Config / secrets ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'sac2026';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me';
const TOKEN_TTL = process.env.TOKEN_TTL || '8h';

if (process.env.NODE_ENV === 'production') {
  if (JWT_SECRET === 'dev-only-insecure-secret-change-me') {
    console.warn('[WARN] JWT_SECRET is not set. Set a strong JWT_SECRET in production.');
  }
  if (ADMIN_PASSWORD === 'sac2026') {
    console.warn('[WARN] ADMIN_PASSWORD is still the default. Set ADMIN_PASSWORD in production.');
  }
}

// --- Middleware ---
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '64kb' }));
app.set('trust proxy', 1); // needed for correct rate-limit IPs behind a proxy/host

// Static front-end
app.use(express.static(path.join(__dirname, 'public')));

// --- Helpers ---
function str(v, max) {
  if (v === undefined || v === null) return '';
  return String(v).trim().slice(0, max || 300);
}

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

// --- Rate limiters ---
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const registerLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });

// --- Routes ---
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.post('/api/register', registerLimiter, (req, res) => {
  const b = req.body || {};
  const data = {
    name: str(b.name, 120),
    email: str(b.email, 160),
    phone: str(b.phone, 40),
    nationality: str(b.nationality, 80),
    regno: str(b.regno, 60),
    faculty: str(b.faculty, 160),
    gender: str(b.gender, 20),
    program: str(b.program, 120),
    semester: str(b.semester, 40),
    year: str(b.year, 20),
    cgpa: str(b.cgpa, 20),
    submittedAt: new Date().toISOString()
  };

  if (!data.name || !data.email || !data.phone || !data.regno) {
    return res.status(400).json({ error: 'Name, email, phone and registration number are required.' });
  }
  if (!isEmail(data.email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }
  if (data.gender && !['Male', 'Female'].includes(data.gender)) {
    return res.status(400).json({ error: 'Invalid council selection.' });
  }

  try {
    const id = dbApi.addRegistration(data);
    return res.status(201).json({ ok: true, id });
  } catch (e) {
    console.error('register error', e);
    return res.status(500).json({ error: 'Could not save registration. Please try again.' });
  }
});

app.post('/api/admin/login', loginLimiter, (req, res) => {
  const password = str((req.body || {}).password, 200);
  if (password && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: TOKEN_TTL });
    return res.json({ ok: true, token });
  }
  return res.status(401).json({ error: 'Incorrect password' });
});

app.get('/api/registrations', requireAdmin, (req, res) => {
  try {
    return res.json({ registrations: dbApi.listRegistrations() });
  } catch (e) {
    console.error('list error', e);
    return res.status(500).json({ error: 'Could not load registrations.' });
  }
});

app.delete('/api/registrations', requireAdmin, (req, res) => {
  try {
    const removed = dbApi.clearRegistrations();
    return res.json({ ok: true, removed });
  } catch (e) {
    console.error('clear error', e);
    return res.status(500).json({ error: 'Could not clear registrations.' });
  }
});

// SPA fallback: send index.html for any non-API GET route.
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Supreme Student Advisory Council running on http://localhost:${PORT}`);
  console.log(`Database: ${dbApi.DB_PATH}`);
});
