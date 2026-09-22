'use strict';

const { init, q } = require('../_lib/db');
const { cors, send, body, str } = require('../_lib/http');
const { guard, hash } = require('../_lib/auth');

// Update / delete a user — Admin only.
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.end();
  const me = guard(req, res, ['admin']);
  if (!me) return;

  const id = parseInt(req.query.id, 10);
  if (!id) return send(res, 400, { error: 'Invalid user id' });

  try {
    await init();

    if (req.method === 'PATCH') {
      const b = await body(req);
      const sets = [];
      const vals = [];
      let i = 1;
      if (b.name != null) { sets.push(`name = $${i++}`); vals.push(str(b.name, 120)); }
      if (b.role != null) {
        if (!['admin', 'council', 'student'].includes(b.role)) return send(res, 400, { error: 'Invalid role' });
        sets.push(`role = $${i++}`); vals.push(b.role);
      }
      if (b.active != null) { sets.push(`active = $${i++}`); vals.push(!!b.active); }
      if (b.password) {
        const p = str(b.password, 200);
        if (p.length < 6) return send(res, 400, { error: 'Password must be at least 6 characters.' });
        sets.push(`password_hash = $${i++}`); vals.push(hash(p));
      }
      if (!sets.length) return send(res, 400, { error: 'Nothing to update.' });
      vals.push(id);
      const { rows } = await q(
        `UPDATE users SET ${sets.join(', ')} WHERE id = $${i}
         RETURNING id, name, email, role, active, created_at`,
        vals
      );
      if (!rows.length) return send(res, 404, { error: 'User not found' });
      return send(res, 200, { ok: true, user: rows[0] });
    }

    if (req.method === 'DELETE') {
      if (id === me.id) return send(res, 400, { error: 'You cannot delete your own account.' });
      const { rowCount } = await q('DELETE FROM users WHERE id = $1', [id]);
      if (!rowCount) return send(res, 404, { error: 'User not found' });
      return send(res, 200, { ok: true });
    }

    return send(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    console.error('user error', e);
    return send(res, 500, { error: 'Server error' });
  }
};
