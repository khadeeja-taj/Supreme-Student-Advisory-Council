'use strict';

const { init, q } = require('../../_lib/db');
const { cors, send } = require('../../_lib/http');
const { guard } = require('../../_lib/auth');

// Admin — list everyone who registered for a competition.
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
      `SELECT * FROM competition_entries WHERE competition_id = $1 ORDER BY created_at DESC`,
      [id]
    );
    return send(res, 200, { entries: rows });
  } catch (e) {
    console.error('entries error', e);
    return send(res, 500, { error: 'Server error' });
  }
};
