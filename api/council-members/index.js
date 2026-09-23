'use strict';

const { init, q } = require('../_lib/db');
const { cors, send, body, str } = require('../_lib/http');
const { guard } = require('../_lib/auth');

const MAX_PER_DEPARTMENT = 5;

// GET: list council members (admin: all; council: all). POST: council or admin
// add a member (max 5 per department; council additions are pending admin approval).
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.end();
  const me = guard(req, res, ['admin', 'council']);
  if (!me) return;

  try {
    await init();

    if (req.method === 'GET') {
      const { rows } = await q('SELECT * FROM council_members ORDER BY department, created_at');
      return send(res, 200, { members: rows, maxPerDepartment: MAX_PER_DEPARTMENT });
    }

    if (req.method === 'POST') {
      const b = await body(req);
      const name = str(b.name, 120);
      const department = str(b.department, 160);
      if (!name || !department) return send(res, 400, { error: 'Member name and department are required.' });

      // Enforce the per-department cap (count everything not rejected).
      const { rows: cnt } = await q(
        `SELECT count(*)::int AS n FROM council_members WHERE department = $1 AND status <> 'rejected'`,
        [department]
      );
      if (cnt[0].n >= MAX_PER_DEPARTMENT) {
        return send(res, 400, { error: 'This department already has the maximum of ' + MAX_PER_DEPARTMENT + ' members.' });
      }

      // Admin additions are approved immediately; council additions await approval.
      const status = me.role === 'admin' ? 'approved' : 'pending';
      const { rows } = await q(
        `INSERT INTO council_members (name, department, position, email, phone, details, status, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [name, department, str(b.position, 120) || null, str(b.email, 160) || null,
         str(b.phone, 40) || null, str(b.details, 1000) || null, status, me.id]
      );
      return send(res, 201, { ok: true, member: rows[0] });
    }

    return send(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    console.error('council-members error', e);
    return send(res, 500, { error: 'Server error' });
  }
};
