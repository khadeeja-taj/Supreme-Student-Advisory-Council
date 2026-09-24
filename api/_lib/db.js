'use strict';

/**
 * Postgres access layer for the Vercel serverless API.
 *
 * Requires a DATABASE_URL env var (Vercel Postgres / Neon / Supabase all work).
 * init() is idempotent: it creates the schema and seeds a first Admin account
 * (from ADMIN_EMAIL / ADMIN_PASSWORD) the first time it runs.
 */

const { Pool } = require('pg');

let pool;
// Accept whichever connection-string env var is present. Manual setup uses
// DATABASE_URL; Vercel's "Connect Database" / Vercel Postgres integrations
// inject POSTGRES_URL (and friends) automatically — any of these works.
function connString() {
  return process.env.DATABASE_URL
    || process.env.POSTGRES_URL
    || process.env.POSTGRES_URL_NON_POOLING
    || process.env.POSTGRES_PRISMA_URL
    || process.env.DATABASE_POSTGRES_URL
    || '';
}

function getPool() {
  if (!pool) {
    const cs = connString();
    if (!cs) throw new Error('No database connection string set (DATABASE_URL / POSTGRES_URL)');
    pool = new Pool({
      connectionString: cs,
      // Managed Postgres providers require SSL; local dev can disable it via sslmode=disable.
      ssl: /sslmode=disable/.test(cs) ? false : { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 10000
    });
  }
  return pool;
}

async function q(text, params) {
  return (await getPool()).query(text, params);
}

let initPromise = null;
async function init() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    // All schema DDL runs in a single round-trip (statements are idempotent).
    // Batching keeps cold-start latency low on serverless.
    await q(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        name          TEXT NOT NULL,
        email         TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role          TEXT NOT NULL CHECK (role IN ('admin','council','student')),
        department    TEXT,
        active        BOOLEAN NOT NULL DEFAULT TRUE,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;

      CREATE TABLE IF NOT EXISTS competitions (
        id             SERIAL PRIMARY KEY,
        title          TEXT NOT NULL,
        title_ar       TEXT,
        description    TEXT,
        description_ar TEXT,
        requirements   TEXT,
        requirements_ar TEXT,
        category       TEXT,
        status         TEXT NOT NULL DEFAULT 'soon',
        active         BOOLEAN NOT NULL DEFAULT TRUE,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      ALTER TABLE competitions ADD COLUMN IF NOT EXISTS requirements TEXT;
      ALTER TABLE competitions ADD COLUMN IF NOT EXISTS requirements_ar TEXT;
      ALTER TABLE competitions ADD COLUMN IF NOT EXISTS image TEXT;
      ALTER TABLE competitions ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE competitions DROP CONSTRAINT IF EXISTS competitions_status_check;

      CREATE TABLE IF NOT EXISTS competition_entries (
        id             SERIAL PRIMARY KEY,
        competition_id INTEGER NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
        name           TEXT NOT NULL,
        email          TEXT NOT NULL,
        phone          TEXT,
        nationality    TEXT,
        regno          TEXT,
        faculty        TEXT,
        gender         TEXT,
        program        TEXT,
        semester       TEXT,
        year           TEXT,
        cgpa           TEXT,
        skills         TEXT,
        hobbies        TEXT,
        note           TEXT,
        status         TEXT NOT NULL DEFAULT 'pending',
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      ALTER TABLE competition_entries ADD COLUMN IF NOT EXISTS socials TEXT;
      ALTER TABLE competition_entries ADD COLUMN IF NOT EXISTS level TEXT;

      CREATE TABLE IF NOT EXISTS council_members (
        id           SERIAL PRIMARY KEY,
        name         TEXT NOT NULL,
        department   TEXT NOT NULL,
        position     TEXT,
        email        TEXT,
        phone        TEXT,
        details      TEXT,
        status       TEXT NOT NULL DEFAULT 'pending',
        created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      ALTER TABLE council_members ADD COLUMN IF NOT EXISTS nationality TEXT;
      ALTER TABLE council_members ADD COLUMN IF NOT EXISTS regno TEXT;
      ALTER TABLE council_members ADD COLUMN IF NOT EXISTS gender TEXT;
      ALTER TABLE council_members ADD COLUMN IF NOT EXISTS level TEXT;
      ALTER TABLE council_members ADD COLUMN IF NOT EXISTS program TEXT;
      ALTER TABLE council_members ADD COLUMN IF NOT EXISTS semester TEXT;
      ALTER TABLE council_members ADD COLUMN IF NOT EXISTS cgpa TEXT;
      ALTER TABLE council_members ADD COLUMN IF NOT EXISTS skills TEXT;
      ALTER TABLE council_members ADD COLUMN IF NOT EXISTS hobbies TEXT;
      ALTER TABLE council_members ADD COLUMN IF NOT EXISTS socials TEXT;
    `);

    // Seed the first admin so there is always a way in.
    const { rows } = await q(`SELECT 1 FROM users WHERE role = 'admin' LIMIT 1`);
    if (rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const email = (process.env.ADMIN_EMAIL || 'admin@ssac.local').trim().toLowerCase();
      const pass = process.env.ADMIN_PASSWORD || 'sac2026';
      await q(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, 'admin')
         ON CONFLICT (email) DO NOTHING`,
        ['Administrator', email, bcrypt.hashSync(pass, 10)]
      );
    }
  })().catch((e) => { initPromise = null; throw e; });
  return initPromise;
}

module.exports = { q, init, getPool };
