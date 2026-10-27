'use strict';

const { init, q } = require('../../_lib/db');
const { cors, send, body } = require('../../_lib/http');
const { guard } = require('../../_lib/auth');

// Admin — list a competition's registrants (GET), or clear everyone's level/date
// choices (POST {action:'reset_choices'}) without touching the students themselves.
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.end();
  const me = guard(req, res, ['admin']);
  if (!me) return;

  const id = parseInt(req.query.id, 10);
  if (!id) return send(res, 400, { error: 'Invalid competition id' });

  try {
    await init();
    if (req.method === 'POST') {
      const b = await body(req);
      if (b.action === 'reset_choices') {
        // Clears ONLY the level + date choices; all student records stay intact.
        const { rowCount } = await q(
          `UPDATE competition_entries SET track = NULL, chosen_day = NULL WHERE competition_id = $1`, [id]);
        return send(res, 200, { ok: true, cleared: rowCount });
      }
      return send(res, 400, { error: 'Unknown action' });
    }
    if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
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
