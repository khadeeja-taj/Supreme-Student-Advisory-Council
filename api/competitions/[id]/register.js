'use strict';

const { init, q } = require('../../_lib/db');
const { cors, send, body, str, isEmail } = require('../../_lib/http');

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
    const { rows } = await q('SELECT id, active, status FROM competitions WHERE id = $1', [id]);
    const c = rows[0];
    if (!c || !c.active || c.status !== 'open') {
      return send(res, 400, { error: 'This competition is not open for registration.' });
    }
    const b = await body(req);
    const data = {
      name: str(b.name, 120), email: str(b.email, 160), phone: str(b.phone, 40),
      nationality: str(b.nationality, 80), regno: str(b.regno, 60), faculty: str(b.faculty, 160),
      gender: str(b.gender, 20), program: str(b.program, 120), semester: str(b.semester, 40),
      year: str(b.year, 20), cgpa: str(b.cgpa, 20),
      skills: Array.isArray(b.skills) ? b.skills.join(', ') : str(b.skills, 600),
      hobbies: Array.isArray(b.hobbies) ? b.hobbies.join(', ') : str(b.hobbies, 600),
      socials: Array.isArray(b.socials) ? b.socials.join(' , ') : str(b.socials, 800),
      note: str(b.note, 500)
    };
    if (!data.name || !data.email) return send(res, 400, { error: 'Name and email are required.' });
    if (!isEmail(data.email)) return send(res, 400, { error: 'Please provide a valid email address.' });

    await q(
      `INSERT INTO competition_entries
         (competition_id, name, email, phone, nationality, regno, faculty, gender, program, semester, year, cgpa, skills, hobbies, note, socials)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [id, data.name, data.email, data.phone || null, data.nationality || null, data.regno || null,
       data.faculty || null, data.gender || null, data.program || null, data.semester || null,
       data.year || null, data.cgpa || null, data.skills || null, data.hobbies || null, data.note || null, data.socials || null]
    );
    return send(res, 201, { ok: true });
  } catch (e) {
    console.error('entry error', e);
    return send(res, 500, { error: 'Could not submit. Please try again.' });
  }
};
