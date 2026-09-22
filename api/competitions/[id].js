'use strict';

const { init, q } = require('../_lib/db');
const { cors, send, body, str } = require('../_lib/http');
const { guard } = require('../_lib/auth');

// Edit / activate / open / close / delete a competition — Admin only.
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.end();
  const me = guard(req, res, ['admin']);
  if (!me) return;

  const id = parseInt(req.query.id, 10);
  if (!id) return send(res, 400, { error: 'Invalid competition id' });

  try {
    await init();

    if (req.method === 'PATCH') {
      const b = await body(req);
      const sets = [];
      const vals = [];
      let i = 1;
      const setStr = (col, val, max) => { sets.push(`${col} = $${i++}`); vals.push(val === '' ? null : str(val, max)); };
      if (b.title != null) { const t = str(b.title, 160); if (!t) return send(res, 400, { error: 'Title cannot be empty.' }); sets.push(`title = $${i++}`); vals.push(t); }
      if (b.title_ar != null) setStr('title_ar', b.title_ar, 160);
      if (b.description != null) setStr('description', b.description, 2000);
      if (b.description_ar != null) setStr('description_ar', b.description_ar, 2000);
      if (b.category != null) setStr('category', b.category, 80);
      if (b.status != null) {
        if (!['draft', 'open', 'closed'].includes(b.status)) return send(res, 400, { error: 'Invalid status' });
        sets.push(`status = $${i++}`); vals.push(b.status);
      }
      if (b.active != null) { sets.push(`active = $${i++}`); vals.push(!!b.active); }
      if (b.opens_at !== undefined) { sets.push(`opens_at = $${i++}`); vals.push(b.opens_at || null); }
      if (b.closes_at !== undefined) { sets.push(`closes_at = $${i++}`); vals.push(b.closes_at || null); }
      if (!sets.length) return send(res, 400, { error: 'Nothing to update.' });
      vals.push(id);
      const { rows } = await q(`UPDATE competitions SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
      if (!rows.length) return send(res, 404, { error: 'Competition not found' });
      return send(res, 200, { ok: true, competition: rows[0] });
    }

    if (req.method === 'DELETE') {
      const { rowCount } = await q('DELETE FROM competitions WHERE id = $1', [id]);
      if (!rowCount) return send(res, 404, { error: 'Competition not found' });
      return send(res, 200, { ok: true });
    }

    return send(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    console.error('competition error', e);
    return send(res, 500, { error: 'Server error' });
  }
};
