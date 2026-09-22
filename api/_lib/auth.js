'use strict';

/** Password hashing + JWT issuing/verification and role guards. */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { send } = require('./http');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me';
const TOKEN_TTL = process.env.TOKEN_TTL || '8h';

function hash(plain) {
  return bcrypt.hashSync(plain, 10);
}

function verifyPassword(plain, hashed) {
  try { return bcrypt.compareSync(plain, hashed); } catch (e) { return false; }
}

function sign(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

/** Returns the decoded user from the Bearer token, or null if missing/invalid. */
function userFromReq(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET); } catch (e) { return null; }
}

/**
 * Guard helper. Returns the user if authenticated and (optionally) holding one
 * of `roles`. Otherwise writes the 401/403 response and returns null so the
 * caller can `if (!user) return;`.
 */
function guard(req, res, roles) {
  const user = userFromReq(req);
  if (!user) { send(res, 401, { error: 'Authentication required' }); return null; }
  if (roles && roles.length && !roles.includes(user.role)) {
    send(res, 403, { error: 'You do not have permission to access this resource.' });
    return null;
  }
  return user;
}

module.exports = { hash, verifyPassword, sign, userFromReq, guard };
