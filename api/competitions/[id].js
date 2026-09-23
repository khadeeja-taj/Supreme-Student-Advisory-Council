'use strict';

const { init, q } = require('../_lib/db');
const { cors, send, body, str } = require('../_lib/http');
const { userFromReq } = require('../_lib/auth');

// GET: public single competition (for the conditions/detail page).
// PATCH / DELETE: admin only (edit, set Available/Coming soon/Closed, delete).
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.end();

  const id = parseInt(req.query.id, 10);
  if (!id) return send(res, 400, { error: 'Invalid competition id' });

  try {
    const me = userFromReq(req);
    // Reject unauthorized writes before touching the database.
    if (req.method === 'PATCH' || req.method === 'DELETE') {
      if (!me) return send(res, 401, { error: 'Authentication required' });
      if (me.role !== 'admin') return send(res, 403, { error: 'You do not have permission to modify competitions.' });
    }
    await init();

    if (req.method === 'GET') {
      const { rows } = await q('SELECT * FROM competitions WHERE id = $1', [id]);
      const c = rows[0];
      if (!c) return send(res, 404, { error: 'Competition not found' });
      // Non-admins can only see visible competitions.
      if (!(me && me.role === 'admin') && (!c.active || !['soon', 'open'].includes(c.status))) {
        return send(res, 404, { error: 'Competition not found' });
      }
      return send(res, 200, { competition: c });
    }

    if (!me) return send(res, 401, { error: 'Authentication required' });
    if (me.role !== 'admin') return send(res, 403, { error: 'You do not have permission to modify competitions.' });

    if (req.method === 'PATCH') {
      const b = await body(req);
      const sets = []; const vals = []; let i = 1;
      const setCol = (col, val, max) => { sets.push(`${col} = $${i++}`); vals.push(val === '' ? null : str(val, max)); };
      if (b.title != null) { const t = str(b.title, 160); if (!t) return send(res, 400, { error: 'Title cannot be empty.' }); sets.push(`title = $${i++}`); vals.push(t); }
      if (b.title_ar != null) setCol('title_ar', b.title_ar, 160);
      if (b.description != null) setCol('description', b.description, 4000);
      if (b.description_ar != null) setCol('description_ar', b.description_ar, 4000);
      if (b.requirements != null) setCol('requirements', b.requirements, 4000);
      if (b.requirements_ar != null) setCol('requirements_ar', b.requirements_ar, 4000);
      if (b.category != null) setCol('category', b.category, 80);
      if (b.image != null) {
        const img = (typeof b.image === 'string' && b.image.length > 0 && b.image.length < 3000000) ? b.image : null;
        sets.push(`image = $${i++}`); vals.push(img);
      }
      if (b.status != null) {
        if (!['soon', 'open', 'closed'].includes(b.status)) return send(res, 400, { error: 'Invalid status' });
        sets.push(`status = $${i++}`); vals.push(b.status);
      }
      if (b.active != null) { sets.push(`active = $${i++}`); vals.push(!!b.active); }
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
