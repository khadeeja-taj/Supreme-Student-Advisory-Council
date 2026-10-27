'use strict';

const { init, q } = require('../_lib/db');
const { cors, send, body, str } = require('../_lib/http');
const { isValidTrack, normReg, daysForGender, todayInTZ, capForGender, windowState, groupLinkFor } = require('../_lib/comp');

// PUBLIC — "choose your level & date" WITHOUT needing a competition id.
// The student enters their registration number; we find them in whichever
// competition has level/date sorting switched on.
//   POST { action:'lookup', regno }                    -> find the entry
//   POST { action:'save', regno, compId, track, day }  -> update it
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.end();
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  try {
    await init();
    const b = await body(req);
    const regno = str(b.regno, 60);
    if (!regno) return send(res, 400, { error: 'Please enter your registration number.' });

    const { rows } = await q(
      `SELECT e.id, e.name, e.gender, e.track, e.chosen_day, e.competition_id,
              c.title, c.title_ar, c.levels_enabled, c.days_enabled, c.boys_days, c.girls_days,
              c.reg_open, c.reg_close, c.boys_cap, c.girls_cap, c.group_links
         FROM competition_entries e
         JOIN competitions c ON c.id = e.competition_id
        WHERE (c.levels_enabled = TRUE OR c.days_enabled = TRUE)
          AND regexp_replace(lower(e.regno), '[^a-z0-9]', '', 'g') = $1
        ORDER BY e.id DESC`,
      [normReg(regno)]
    );
    if (!rows.length) return send(res, 404, { error: 'No registration was found with that number.' });

    const wantComp = parseInt(b.compId, 10);
    let entry = rows[0];
    if (wantComp) { const m = rows.filter(function (r) { return r.competition_id === wantComp; })[0]; if (m) entry = m; }

    const info = await buildInfo(entry, rows.length > 1 ? rows : null);

    if (b.action === 'save') {
      const r = await doSave(entry, b, info);
      if (r.error) return send(res, r.code || 400, { error: r.error });
      Object.assign(info, r.info);
    }
    return send(res, 200, info);
  } catch (e) {
    console.error('choose error', e);
    return send(res, 500, { error: 'Something went wrong. Please try again.' });
  }
};

// Shared by the lookup response and (re-used) by the token pick endpoint.
async function buildInfo(entry, allRows) {
  const allowedDays = daysForGender(entry, entry.gender);
  const today = todayInTZ();
  const windowStatus = windowState(entry, today);   // before | open | after
  const windowOpen = entry.days_enabled ? (windowStatus === 'open') : true;
  const cap = capForGender(entry, entry.gender);

  // How many of this gender have already taken each date (for the full/greyed UI).
  const counts = {};
  if (entry.days_enabled && allowedDays.length) {
    const cr = await q(
      `SELECT chosen_day, count(*)::int AS n FROM competition_entries
         WHERE competition_id = $1 AND gender = $2 AND chosen_day IS NOT NULL
         GROUP BY chosen_day`,
      [entry.competition_id, entry.gender]
    );
    cr.rows.forEach(function (r) { counts[r.chosen_day] = r.n; });
  }
  // Only expose this student's own group links (the ones for their dates).
  const groupLinks = {};
  allowedDays.forEach(function (d) { const l = groupLinkFor(entry, d); if (l) groupLinks[d] = l; });

  return {
    found: true, compId: entry.competition_id,
    title: entry.title, title_ar: entry.title_ar,
    name: entry.name, gender: entry.gender,
    track: entry.track || '', day: entry.chosen_day || '',
    levels_enabled: !!entry.levels_enabled, days_enabled: !!entry.days_enabled,
    allowedDays: allowedDays, today: today,
    windowStatus: windowStatus, windowOpen: windowOpen,
    reg_open: entry.reg_open || '', reg_close: entry.reg_close || '',
    cap: cap, dateCounts: counts, groupLinks: groupLinks,
    groupLink: groupLinkFor(entry, entry.chosen_day || ''),
    options: allRows ? allRows.map(function (r) { return { compId: r.competition_id, title: r.title_ar || r.title }; }) : undefined
  };
}

async function doSave(entry, b, info) {
  if (entry.days_enabled && !info.windowOpen) {
    if (info.windowStatus === 'before') return { code: 403, error: 'Registration has not opened yet. It opens on ' + (entry.reg_open || '') + '.' };
    return { code: 403, error: 'Registration is closed.' };
  }
  const track = str(b.track, 20);
  const day = str(b.day, 40);
  if (entry.levels_enabled) {
    if (!track) return { error: 'Please choose a level.' };
    if (!isValidTrack(track)) return { error: 'Invalid level selected.' };
  }
  if (entry.days_enabled) {
    if (!day) return { error: 'Please choose a date.' };
    if (info.allowedDays.indexOf(day) === -1) return { error: 'The selected date is not available for your group.' };
    // Capacity: a date is full when it already holds `cap` of this gender
    // (not counting this student, so they can keep/re-confirm their own date).
    if (info.cap) {
      const t = await q(
        `SELECT count(*)::int AS n FROM competition_entries
           WHERE competition_id = $1 AND gender = $2 AND chosen_day = $3 AND id <> $4`,
        [entry.competition_id, entry.gender, day, entry.id]
      );
      if (t.rows[0].n >= info.cap) return { error: 'This date is full. Please choose another date.' };
    }
  }
  await q(`UPDATE competition_entries SET track = $1, chosen_day = $2 WHERE id = $3`,
    [entry.levels_enabled ? track : entry.track, entry.days_enabled ? day : entry.chosen_day, entry.id]);
  const savedDay = entry.days_enabled ? day : entry.chosen_day;
  return { info: { saved: true, track: entry.levels_enabled ? track : entry.track, day: savedDay, groupLink: groupLinkFor(entry, savedDay || '') } };
}

module.exports.buildInfo = buildInfo;
module.exports.doSave = doSave;
