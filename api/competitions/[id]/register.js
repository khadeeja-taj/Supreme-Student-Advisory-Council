'use strict';

const { init, q } = require('../../_lib/db');
const { cors, send, body, str, isEmail } = require('../../_lib/http');
const { isValidTrack, normReg, REG_SQL, daysForGender, genToken, todayInTZ, capForGender, windowState } = require('../../_lib/comp');

// PUBLIC — no login. A competitor submits the registration form for an OPEN
// competition. Saved to competition_entries (pending) for the admin to review.
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.end();
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  const id = parseInt(req.query.id, 10);
  if (!id) return send(res, 400, { error: 'Invalid competition id' });

  try {
    await init();
    const { rows } = await q(
      `SELECT id, active, status, eligibility, eligibility_source, levels_enabled, days_enabled, boys_days, girls_days,
              reg_open, reg_close, boys_cap, girls_cap
         FROM competitions WHERE id = $1`, [id]);
    const c = rows[0];
    if (!c || !c.active || c.status !== 'open') {
      return send(res, 400, { error: 'This competition is not open for registration.' });
    }
    const b = await body(req);
    const data = {
      name: str(b.name, 120), email: str(b.email, 160), phone: str(b.phone, 40),
      nationality: str(b.nationality, 80), regno: str(b.regno, 60), faculty: str(b.faculty, 160),
      gender: str(b.gender, 20), program: str(b.program, 120), semester: str(b.semester, 40),
      year: str(b.year, 20), cgpa: str(b.cgpa, 20), level: str(b.level, 40),
      skills: Array.isArray(b.skills) ? b.skills.join(', ') : str(b.skills, 600),
      hobbies: Array.isArray(b.hobbies) ? b.hobbies.join(', ') : str(b.hobbies, 600),
      socials: Array.isArray(b.socials) ? b.socials.join(' , ') : str(b.socials, 800),
      note: str(b.note, 500),
      track: str(b.track, 20), day: str(b.day, 40)
    };
    if (!data.name || !data.email) return send(res, 400, { error: 'Name and email are required.' });
    if (!isEmail(data.email)) return send(res, 400, { error: 'Please provide a valid email address.' });

    // --- Eligibility: "Existing students only" competitions require a reg number
    //     that already exists in the chosen source competition. -----------------
    if (c.eligibility === 'competition' && c.eligibility_source) {
      if (!data.regno) return send(res, 400, { error: 'A registration number is required for this competition.' });
      const src = await q(
        `SELECT 1 FROM competition_entries WHERE competition_id = $1 AND ${REG_SQL} = $2 LIMIT 1`,
        [c.eligibility_source, normReg(data.regno)]
      );
      if (!src.rows.length) {
        return send(res, 403, { error: 'This competition is open only to students already registered in the required competition.' });
      }
    }

    // --- No duplicate registration in the SAME competition (by reg number). -----
    if (data.regno) {
      const dup = await q(
        `SELECT 1 FROM competition_entries WHERE competition_id = $1 AND ${REG_SQL} = $2 LIMIT 1`,
        [id, normReg(data.regno)]
      );
      if (dup.rows.length) {
        return send(res, 409, { error: 'You have already registered for this competition.' });
      }
    }

    // --- Level (track) + day validation when the competition uses them. ---------
    if (c.levels_enabled) {
      if (!data.track) return send(res, 400, { error: 'Please choose a level.' });
      if (!isValidTrack(data.track)) return send(res, 400, { error: 'Invalid level selected.' });
    } else { data.track = ''; }
    if (c.days_enabled) {
      const allowed = daysForGender(c, data.gender);
      // Registration window: choosing is open only between reg_open and reg_close.
      const ws = windowState(c, todayInTZ());
      if (ws === 'before') return send(res, 403, { error: 'Registration has not opened yet. It opens on ' + (c.reg_open || '') + '.' });
      if (ws === 'after') return send(res, 403, { error: 'Registration is closed.' });
      if (!data.day) return send(res, 400, { error: 'Please choose a date.' });
      if (allowed.indexOf(data.day) === -1) return send(res, 400, { error: 'The selected date is not available for your group.' });
      // Per-date capacity for this gender.
      const cap = capForGender(c, data.gender);
      if (cap) {
        const t = await q(
          `SELECT count(*)::int AS n FROM competition_entries WHERE competition_id = $1 AND gender = $2 AND chosen_day = $3`,
          [id, data.gender, data.day]);
        if (t.rows[0].n >= cap) return send(res, 400, { error: 'This date is full. Please choose another date.' });
      }
    } else { data.day = ''; }

    await q(
      `INSERT INTO competition_entries
         (competition_id, name, email, phone, nationality, regno, faculty, gender, program, semester, year, cgpa, skills, hobbies, note, socials, level, track, chosen_day, edit_token)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
      [id, data.name, data.email, data.phone || null, data.nationality || null, data.regno || null,
       data.faculty || null, data.gender || null, data.program || null, data.semester || null,
       data.year || null, data.cgpa || null, data.skills || null, data.hobbies || null, data.note || null, data.socials || null, data.level || null,
       data.track || null, data.day || null, genToken()]
    );
    return send(res, 201, { ok: true });
  } catch (e) {
    console.error('entry error', e);
    return send(res, 500, { error: 'Could not submit. Please try again.' });
  }
};
