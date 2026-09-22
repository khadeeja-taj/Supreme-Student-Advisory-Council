'use strict';

const { init, q } = require('../../_lib/db');
const { cors, send, body, str } = require('../../_lib/http');
const { guard } = require('../../_lib/auth');

// Register the current user for an OPEN competition — Student & Council only.
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.end();
  const me = guard(req, res, ['student', 'council']);
  if (!me) return;
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  const id = parseInt(req.query.id, 10);
  if (!id) return send(res, 400, { error: 'Invalid competition id' });

  try {
    await init();
    const { rows } = await q('SELECT id, active, status FROM competitions WHERE id = $1', [id]);
    const c = rows[0];
    if (!c || !c.active || c.status !== 'open') {
      return send(res, 404, { error: 'This competition is not open for registration.' });
    }
    const b = await body(req);
    try {
      await q(
        'INSERT INTO competition_registrations (competition_id, user_id, note) VALUES ($1, $2, $3)',
        [id, me.id, str(b.note, 500) || null]
      );
    } catch (e) {
      if (e.code === '23505') return send(res, 200, { ok: true, already: true });
      throw e;
    }
    return send(res, 201, { ok: true });
  } catch (e) {
    console.error('register error', e);
    return send(res, 500, { error: 'Server error' });
  }
};
