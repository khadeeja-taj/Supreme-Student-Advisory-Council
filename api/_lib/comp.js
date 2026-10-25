'use strict';

/**
 * Helpers for the competition eligibility + level/day sorting feature.
 * Kept tiny and dependency-free so both the API handlers and the Netlify
 * wrappers can share one source of truth.
 */

const crypto = require('crypto');

// The three Quran memorisation tracks (branches) shown on the official poster.
const TRACKS = ['full', '20', '10'];

function isValidTrack(t) {
  return TRACKS.indexOf(String(t || '')) !== -1;
}

// Registration numbers are matched leniently: lower-cased with every
// non-alphanumeric character removed, so "4572/Foc/BSSE/f22", "4572 foc bsse
// f22" and "4572focbssef22" all match. The student's originally stored value is
// never altered. REG_SQL applies the same normalisation to the stored column.
function normReg(s) {
  return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]/g, '');
}
const REG_SQL = "regexp_replace(lower(regno), '[^a-z0-9]', '', 'g')";

// Days are stored as a comma-separated list, e.g. "Monday,Tuesday".
function parseDays(csv) {
  return String(csv == null ? '' : csv)
    .split(',')
    .map(function (d) { return d.trim(); })
    .filter(Boolean);
}

// Which days a given gender may pick, based on the competition settings.
function daysForGender(comp, gender) {
  const g = String(gender || '').trim().toLowerCase();
  if (g === 'female' || g === 'girl' || g === 'girls') return parseDays(comp.girls_days);
  if (g === 'male' || g === 'boy' || g === 'boys') return parseDays(comp.boys_days);
  return [];
}

function genToken() {
  return crypto.randomBytes(16).toString('hex');
}

// Today's date (YYYY-MM-DD) in the competition's timezone (Islamabad by default).
// Used to gate access so a student can only act on one of their own dates.
function todayInTZ(tz) {
  tz = tz || process.env.COMP_TZ || 'Asia/Karachi';
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}

module.exports = { TRACKS, isValidTrack, normReg, REG_SQL, parseDays, daysForGender, genToken, todayInTZ };
