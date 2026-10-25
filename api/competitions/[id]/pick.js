'use strict';

const { init, q } = require('../../_lib/db');
const { cors, send, body, str } = require('../../_lib/http');
const { isValidTrack, normReg, REG_SQL, daysForGender, todayInTZ } = require('../../_lib/comp');

// PUBLIC — the "choose your level & day" flow for students who are ALREADY in a
// competition (e.g. the 307 who registered before these options existed).
//   POST { action:'lookup', regno } | { action:'lookup', token }
//        -> finds the student's existing entry in this competition.
//   POST { action:'save',  regno|token, track, day }
//        -> updates that same entry (no new row, nothing else changed).
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.end();
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  const id = parseInt(req.query.id, 10);
  if (!id) return send(res, 400, { error: 'Invalid competition id' });

  try {
    await init();
    const compRows = await q(
      `SELECT id, title, title_ar, status, levels_enabled, days_enabled, boys_days, girls_days
         FROM competitions WHERE id = $1`, [id]);
    const c = compRows[0];
    if (!c) return send(res, 404, { error: 'Competition not found' });

    const b = await body(req);
    const token = str(b.token, 80);
    const regno = str(b.regno, 60);

    // Locate the student's existing entry — by private token (from the email
    // link) or by registration number (case-insensitive).
    let entry = null;
    if (token) {
      entry = (await q(`SELECT * FROM competition_entries WHERE competition_id = $1 AND edit_token = $2 LIMIT 1`, [id, token])).rows[0] || null;
    } else if (regno) {
      entry = (await q(`SELECT * FROM competition_entries WHERE competition_id = $1 AND ${REG_SQL} = $2 LIMIT 1`, [id, normReg(regno)])).rows[0] || null;
    } else {
      return send(res, 400, { error: 'Please enter your registration number.' });
    }

    if (!entry) {
      return send(res, 404, { error: 'No registration was found for this competition with those details.' });
    }

    const allowedDays = daysForGender(c, entry.gender);
    const today = todayInTZ();
    const openToday = c.days_enabled ? (allowedDays.indexOf(today) !== -1) : true;
    const info = {
      found: true,
      title: c.title, title_ar: c.title_ar,
      name: entry.name, gender: entry.gender,
      track: entry.track || '', day: entry.chosen_day || '',
      levels_enabled: !!c.levels_enabled, days_enabled: !!c.days_enabled,
      allowedDays: allowedDays, today: today, openToday: openToday,
      boys_days: c.boys_days || '', girls_days: c.girls_days || ''
    };

    if (b.action === 'save') {
      if (c.days_enabled && !openToday) {
        return send(res, 403, { error: 'Registration is not open for you today. Your allowed date: ' + allowedDays.join(' / ') });
      }
      const track = str(b.track, 20);
      if (c.levels_enabled) {
        if (!track) return send(res, 400, { error: 'Please choose a level.' });
        if (!isValidTrack(track)) return send(res, 400, { error: 'Invalid level selected.' });
      }
      await q(
        `UPDATE competition_entries SET track = $1, chosen_day = $2 WHERE id = $3`,
        [c.levels_enabled ? track : entry.track, c.days_enabled ? today : entry.chosen_day, entry.id]
      );
      info.track = c.levels_enabled ? track : entry.track;
      info.day = c.days_enabled ? today : entry.chosen_day;
      info.saved = true;
    }

    return send(res, 200, info);
  } catch (e) {
    console.error('pick error', e);
    return send(res, 500, { error: 'Something went wrong. Please try again.' });
  }
};
