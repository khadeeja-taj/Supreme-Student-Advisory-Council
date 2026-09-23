'use strict';

const { init, q } = require('../_lib/db');
const { cors, send, body } = require('../_lib/http');
const { guard } = require('../_lib/auth');

// Admin — approve / reject / delete a competition entry.
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.end();
  const me = guard(req, res, ['admin']);
  if (!me) return;

  const id = parseInt(req.query.id, 10);
  if (!id) return send(res, 400, { error: 'Invalid entry id' });

  try {
    await init();
    if (req.method === 'PATCH') {
      const b = await body(req);
      if (!['pending', 'approved', 'rejected'].includes(b.status)) return send(res, 400, { error: 'Invalid status' });
      const { rows } = await q('UPDATE competition_entries SET status = $1 WHERE id = $2 RETURNING *', [b.status, id]);
      if (!rows.length) return send(res, 404, { error: 'Entry not found' });
      return send(res, 200, { ok: true, entry: rows[0] });
    }
    if (req.method === 'DELETE') {
      const { rowCount } = await q('DELETE FROM competition_entries WHERE id = $1', [id]);
      if (!rowCount) return send(res, 404, { error: 'Entry not found' });
      return send(res, 200, { ok: true });
    }
    return send(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    console.error('entry admin error', e);
    return send(res, 500, { error: 'Server error' });
  }
};
