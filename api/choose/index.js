'use strict';

const { init, q } = require('../_lib/db');
const { cors, send, body, str } = require('../_lib/http');
const { isValidTrack, normReg, daysForGender, todayInTZ } = require('../_lib/comp');

// PUBLIC — "choose your level & date" WITHOUT needing a competition id.
// The student just enters their registration number; we find them in whichever
// competition has level/date sorting switched on. This removes the whole
// "which competition number" problem.
//   POST { action:'lookup', regno }                          -> find the entry
//   POST { action:'save', regno, compId, track, day }        -> update it
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.end();
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  try {
    await init();
    const b = await body(req);
    const regno = str(b.regno, 60);
    if (!regno) return send(res, 400, { error: 'Please enter your registration number.' });

    // Any competition that sorts by level or date, matching the reg number
    // leniently (ignore slashes/spaces/case on both sides).
    const { rows } = await q(
      `SELECT e.id, e.name, e.gender, e.track, e.chosen_day, e.competition_id,
              c.title, c.title_ar, c.levels_enabled, c.days_enabled, c.boys_days, c.girls_days
         FROM competition_entries e
         JOIN competitions c ON c.id = e.competition_id
        WHERE (c.levels_enabled = TRUE OR c.days_enabled = TRUE)
          AND regexp_replace(lower(e.regno), '[^a-z0-9]', '', 'g') = $1
        ORDER BY e.id DESC`,
      [normReg(regno)]
    );
    if (!rows.length) {
      return send(res, 404, { error: 'No registration was found with that number.' });
    }

    // If the student is in more than one sorted competition, allow picking one.
    const wantComp = parseInt(b.compId, 10);
    let entry = rows[0];
    if (wantComp) { const m = rows.filter(function (r) { return r.competition_id === wantComp; })[0]; if (m) entry = m; }

    const allowedDays = daysForGender(entry, entry.gender);
    // Access is locked unless TODAY is one of this student's own dates.
    const today = todayInTZ();
    const openToday = entry.days_enabled ? (allowedDays.indexOf(today) !== -1) : true;
    const info = {
      found: true, compId: entry.competition_id,
      title: entry.title, title_ar: entry.title_ar,
      name: entry.name, gender: entry.gender,
      track: entry.track || '', day: entry.chosen_day || '',
      levels_enabled: !!entry.levels_enabled, days_enabled: !!entry.days_enabled,
      allowedDays: allowedDays, today: today, openToday: openToday,
      boys_days: entry.boys_days || '', girls_days: entry.girls_days || '',
      options: rows.length > 1 ? rows.map(function (r) { return { compId: r.competition_id, title: r.title_ar || r.title }; }) : undefined
    };

    if (b.action === 'save') {
      if (entry.days_enabled && !openToday) {
        return send(res, 403, { error: 'Registration is not open for you today. Your date(s): ' + allowedDays.join(' / ') });
      }
      const track = str(b.track, 20);
      const day = str(b.day, 40);
      if (entry.levels_enabled) {
        if (!track) return send(res, 400, { error: 'Please choose a level.' });
        if (!isValidTrack(track)) return send(res, 400, { error: 'Invalid level selected.' });
      }
      if (entry.days_enabled) {
        if (!day) return send(res, 400, { error: 'Please choose a date.' });
        if (allowedDays.indexOf(day) === -1) return send(res, 400, { error: 'The selected date is not available for your group.' });
      }
      await q(`UPDATE competition_entries SET track = $1, chosen_day = $2 WHERE id = $3`,
        [entry.levels_enabled ? track : entry.track, entry.days_enabled ? day : entry.chosen_day, entry.id]);
      info.track = entry.levels_enabled ? track : entry.track;
      info.day = entry.days_enabled ? day : entry.chosen_day;
      info.saved = true;
    }

    return send(res, 200, info);
  } catch (e) {
    console.error('choose error', e);
    return send(res, 500, { error: 'Something went wrong. Please try again.' });
  }
};
