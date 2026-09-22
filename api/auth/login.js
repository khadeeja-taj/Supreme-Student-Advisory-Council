'use strict';

const { init, q } = require('../_lib/db');
const { cors, send, body, str } = require('../_lib/http');
const { verifyPassword, sign } = require('../_lib/auth');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.end();
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  try {
    await init();
    const b = await body(req);
    const email = str(b.email, 160).toLowerCase();
    const password = str(b.password, 200);
    if (!email || !password) return send(res, 400, { error: 'Email and password are required.' });

    const { rows } = await q('SELECT * FROM users WHERE email = $1', [email]);
    const u = rows[0];
    if (!u || !u.active || !verifyPassword(password, u.password_hash)) {
      return send(res, 401, { error: 'Invalid email or password.' });
    }
    return send(res, 200, {
      ok: true,
      token: sign(u),
      user: { id: u.id, name: u.name, email: u.email, role: u.role }
    });
  } catch (e) {
    console.error('login error', e);
    return send(res, 500, { error: 'Login failed. Please try again.' });
  }
};
