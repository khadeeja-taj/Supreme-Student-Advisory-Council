'use strict';

const { init, q } = require('../_lib/db');
const { cors, send, body, str } = require('../_lib/http');
const { userFromReq } = require('../_lib/auth');

// GET: public list (Available + Coming soon). Admin (with token) gets everything
// plus entry counts. POST: admin only — create a competition.
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.end();
  try {
    const me = userFromReq(req); // may be null for public visitors
    // Reject unauthorized writes before touching the database.
    if (req.method === 'POST') {
      if (!me) return send(res, 401, { error: 'Authentication required' });
      if (me.role !== 'admin') return send(res, 403, { error: 'Only administrators can create competitions.' });
    }
    await init();

    if (req.method === 'GET') {
      let rows;
      if (me && me.role === 'admin') {
        rows = (await q(
          `SELECT c.*,
                  (SELECT count(*) FROM competition_entries e WHERE e.competition_id = c.id)::int AS entries
             FROM competitions c
            ORDER BY c.created_at DESC`
        )).rows;
      } else {
        rows = (await q(
          `SELECT id, title, title_ar, description, description_ar, requirements, requirements_ar, category, status
             FROM competitions
            WHERE active = TRUE AND status IN ('soon','open')
            ORDER BY created_at DESC`
        )).rows;
      }
      return send(res, 200, { competitions: rows });
    }

    if (req.method === 'POST') {
      if (!me) return send(res, 401, { error: 'Authentication required' });
      if (me.role !== 'admin') return send(res, 403, { error: 'Only administrators can create competitions.' });
      const b = await body(req);
      const title = str(b.title, 160);
      if (!title) return send(res, 400, { error: 'Title is required.' });
      const status = ['soon', 'open', 'closed'].includes(b.status) ? b.status : 'soon';
      const { rows } = await q(
        `INSERT INTO competitions
           (title, title_ar, description, description_ar, requirements, requirements_ar, category, status, active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING *`,
        [
          title,
          str(b.title_ar, 160) || null,
          str(b.description, 4000) || null,
          str(b.description_ar, 4000) || null,
          str(b.requirements, 4000) || null,
          str(b.requirements_ar, 4000) || null,
          str(b.category, 80) || null,
          status,
          b.active !== false
        ]
      );
      return send(res, 201, { ok: true, competition: rows[0] });
    }

    return send(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    console.error('competitions error', e);
    return send(res, 500, { error: 'Server error' });
  }
};
