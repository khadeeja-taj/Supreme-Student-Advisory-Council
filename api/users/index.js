'use strict';

const { init, q } = require('../_lib/db');
const { cors, send, body, str, isEmail } = require('../_lib/http');
const { guard, hash } = require('../_lib/auth');

// User management — Admin only.
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.end();
  const me = guard(req, res, ['admin']);
  if (!me) return;
  try {
    await init();

    if (req.method === 'GET') {
      const { rows } = await q(
        'SELECT id, name, email, role, department, active, created_at FROM users ORDER BY id'
      );
      return send(res, 200, { users: rows });
    }

    if (req.method === 'POST') {
      const b = await body(req);
      const name = str(b.name, 120);
      const email = str(b.email, 160).toLowerCase();
      const role = str(b.role, 20);
      const password = str(b.password, 200);
      if (!name || !email || !password || !['admin', 'council', 'student'].includes(role)) {
        return send(res, 400, { error: 'Name, email, password and a valid role are required.' });
      }
      if (!isEmail(email)) return send(res, 400, { error: 'Please provide a valid email address.' });
      if (password.length < 6) return send(res, 400, { error: 'Password must be at least 6 characters.' });
      try {
        const { rows } = await q(
          `INSERT INTO users (name, email, password_hash, role, department)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, name, email, role, department, active, created_at`,
          [name, email, hash(password), role, str(b.department, 160) || null]
        );
        return send(res, 201, { ok: true, user: rows[0] });
      } catch (e) {
        if (e.code === '23505') return send(res, 409, { error: 'A user with that email already exists.' });
        throw e;
      }
    }

    return send(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    console.error('users error', e);
    return send(res, 500, { error: 'Server error' });
  }
};
