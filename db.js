'use strict';

/**
 * Database layer (SQLite via better-sqlite3).
 * The DB file location can be overridden with DB_PATH so you can point it at a
 * persistent disk/volume on your host (recommended in production).
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'council.db');

// Make sure the folder for the database file exists.
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS registrations (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    email        TEXT NOT NULL,
    phone        TEXT NOT NULL,
    nationality  TEXT,
    regno        TEXT NOT NULL,
    faculty      TEXT,
    gender       TEXT,
    program      TEXT,
    semester     TEXT,
    year         TEXT,
    cgpa         TEXT,
    submitted_at TEXT NOT NULL
  );
`);

const insertStmt = db.prepare(`
  INSERT INTO registrations
    (name, email, phone, nationality, regno, faculty, gender, program, semester, year, cgpa, submitted_at)
  VALUES
    (@name, @email, @phone, @nationality, @regno, @faculty, @gender, @program, @semester, @year, @cgpa, @submitted_at)
`);

const listStmt = db.prepare(`SELECT * FROM registrations ORDER BY datetime(submitted_at) DESC`);
const clearStmt = db.prepare(`DELETE FROM registrations`);

function addRegistration(data) {
  const row = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    nationality: data.nationality || null,
    regno: data.regno,
    faculty: data.faculty || null,
    gender: data.gender || null,
    program: data.program || null,
    semester: data.semester || null,
    year: data.year || null,
    cgpa: data.cgpa || null,
    submitted_at: data.submittedAt || new Date().toISOString()
  };
  const info = insertStmt.run(row);
  return info.lastInsertRowid;
}

function listRegistrations() {
  // Return with the same camelCase keys the front-end expects.
  return listStmt.all().map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    nationality: r.nationality,
    regno: r.regno,
    faculty: r.faculty,
    gender: r.gender,
    program: r.program,
    semester: r.semester,
    year: r.year,
    cgpa: r.cgpa,
    submittedAt: r.submitted_at
  }));
}

function clearRegistrations() {
  return clearStmt.run().changes;
}

module.exports = { db, addRegistration, listRegistrations, clearRegistrations, DB_PATH };
