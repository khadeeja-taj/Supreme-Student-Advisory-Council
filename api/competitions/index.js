'use strict';

const { init, q } = require('../_lib/db');
const { cors, send, body, str } = require('../_lib/http');
const { guard } = require('../_lib/auth');

// List competitions (role-filtered) / create a competition (Admin only).
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.end();
  const me = guard(req, res); // any authenticated role
  if (!me) return;
  try {
    await init();

    if (req.method === 'GET') {
      let rows;
      if (me.role === 'admin') {
        // Admin sees everything, with a live registration count.
        rows = (await q(
          `SELECT c.*,
                  (SELECT count(*) FROM competition_registrations r WHERE r.competition_id = c.id)::int AS registrations
             FROM competitions c
            ORDER BY c.created_at DESC`
        )).rows;
      } else {
        // Council & Student only ever see competitions the Admin has opened.
        rows = (await q(
          `SELECT c.id, c.title, c.title_ar, c.description, c.description_ar, c.category,
                  c.status, c.opens_at, c.closes_at,
                  EXISTS (SELECT 1 FROM competition_registrations r
                           WHERE r.competition_id = c.id AND r.user_id = $1) AS registered
             FROM competitions c
            WHERE c.active = TRUE AND c.status = 'open'
            ORDER BY c.created_at DESC`,
          [me.id]
        )).rows;
      }
      return send(res, 200, { competitions: rows });
    }

    if (req.method === 'POST') {
      if (me.role !== 'admin') return send(res, 403, { error: 'Only administrators can create competitions.' });
      const b = await body(req);
      const title = str(b.title, 160);
      if (!title) return send(res, 400, { error: 'Title is required.' });
      const status = ['draft', 'open', 'closed'].includes(b.status) ? b.status : 'draft';
      const { rows } = await q(
        `INSERT INTO competitions
           (title, title_ar, description, description_ar, category, status, active, opens_at, closes_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING *`,
        [
          title,
          str(b.title_ar, 160) || null,
          str(b.description, 2000) || null,
          str(b.description_ar, 2000) || null,
          str(b.category, 80) || null,
          status,
          b.active !== false,
          b.opens_at || null,
          b.closes_at || null
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
