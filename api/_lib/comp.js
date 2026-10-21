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

// Registration numbers are compared case-insensitively and trimmed, but the
// student's originally stored value is never altered.
function normReg(s) {
  return String(s == null ? '' : s).trim().toLowerCase();
}

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

module.exports = { TRACKS, isValidTrack, normReg, parseDays, daysForGender, genToken };
