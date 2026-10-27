'use strict';

const { init, q } = require('../../_lib/db');
const { cors, send, body, str } = require('../../_lib/http');
const { normReg, REG_SQL } = require('../../_lib/comp');
const choose = require('../../choose/index');

// PUBLIC — the "choose your level & date" flow for a student ALREADY in a
// competition, reached by a personal token link (?pick=TOKEN&c=ID) or by
// registration number. Shares the window/capacity/group-link logic with /api/choose.
//   POST { action:'lookup', regno } | { action:'lookup', token }
//   POST { action:'save',  regno|token, track, day }
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.end();
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  const id = parseInt(req.query.id, 10);
  if (!id) return send(res, 400, { error: 'Invalid competition id' });

  try {
    await init();
    const compRows = await q(
      `SELECT id, title, title_ar, status, levels_enabled, days_enabled, boys_days, girls_days,
              reg_open, reg_close, boys_cap, girls_cap, group_links
         FROM competitions WHERE id = $1`, [id]);
    const c = compRows[0];
    if (!c) return send(res, 404, { error: 'Competition not found' });

    const b = await body(req);
    const token = str(b.token, 80);
    const regno = str(b.regno, 60);

    let entry = null;
    if (token) {
      entry = (await q(`SELECT * FROM competition_entries WHERE competition_id = $1 AND edit_token = $2 LIMIT 1`, [id, token])).rows[0] || null;
    } else if (regno) {
      entry = (await q(`SELECT * FROM competition_entries WHERE competition_id = $1 AND ${REG_SQL} = $2 LIMIT 1`, [id, normReg(regno)])).rows[0] || null;
    } else {
      return send(res, 400, { error: 'Please enter your registration number.' });
    }
    if (!entry) return send(res, 404, { error: 'No registration was found for this competition with those details.' });

    // Merge the competition + entry into one row (entry fields win where they overlap).
    const row = Object.assign({}, c, entry);
    const info = await choose.buildInfo(row, null);

    if (b.action === 'save') {
      const r = await choose.doSave(row, b, info);
      if (r.error) return send(res, r.code || 400, { error: r.error });
      Object.assign(info, r.info);
    }
    return send(res, 200, info);
  } catch (e) {
    console.error('pick error', e);
    return send(res, 500, { error: 'Something went wrong. Please try again.' });
  }
};
