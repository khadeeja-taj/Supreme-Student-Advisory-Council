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

// Registration numbers are matched leniently: lower-cased and with ALL
// whitespace removed, so "4572 / Foc" and "4572/Foc" match. The student's
// originally stored value is never altered. REG_SQL applies the same
// normalisation to the stored column inside a query.
function normReg(s) {
  return String(s == null ? '' : s).toLowerCase().replace(/\s+/g, '');
}
const REG_SQL = "regexp_replace(lower(regno), '\\s+', '', 'g')";

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

module.exports = { TRACKS, isValidTrack, normReg, REG_SQL, parseDays, daysForGender, genToken };
