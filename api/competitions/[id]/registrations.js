'use strict';

const { init, q } = require('../../_lib/db');
const { cors, send } = require('../../_lib/http');
const { guard } = require('../../_lib/auth');

// List everyone registered for a competition — Admin only.
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.end();
  const me = guard(req, res, ['admin']);
  if (!me) return;
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });

  const id = parseInt(req.query.id, 10);
  if (!id) return send(res, 400, { error: 'Invalid competition id' });

  try {
    await init();
    const { rows } = await q(
      `SELECT r.id, r.note, r.created_at, u.name, u.email, u.role
         FROM competition_registrations r
         JOIN users u ON u.id = r.user_id
        WHERE r.competition_id = $1
        ORDER BY r.created_at DESC`,
      [id]
    );
    return send(res, 200, { registrations: rows });
  } catch (e) {
    console.error('registrations error', e);
    return send(res, 500, { error: 'Server error' });
  }
};
