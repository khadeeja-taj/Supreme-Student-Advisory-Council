'use strict';

const { init, q } = require('../_lib/db');
const { cors, send, body, str } = require('../_lib/http');
const { guard } = require('../_lib/auth');

const MAX_PER_GENDER = 3; // each faculty may have up to 3 male + 3 female members

// GET: list council members (admin: all; council: all). POST: council or admin
// add a member (max 3 male + 3 female per department; council additions are
// pending admin approval).
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.end();
  const me = guard(req, res, ['admin', 'council']);
  if (!me) return;

  try {
    await init();

    if (req.method === 'GET') {
      const { rows } = await q('SELECT * FROM council_members ORDER BY department, created_at');
      return send(res, 200, { members: rows, maxPerGender: MAX_PER_GENDER });
    }

    if (req.method === 'POST') {
      const b = await body(req);
      const name = str(b.name, 120);
      const department = str(b.department, 160) || str(b.faculty, 160);
      if (!name || !department) return send(res, 400, { error: 'Member name and department are required.' });

      // Gender is required so we can enforce the 3 male + 3 female cap.
      const gender = (b.gender === 'Female') ? 'Female' : (b.gender === 'Male' ? 'Male' : null);
      if (!gender) return send(res, 400, { error: 'Please select the member gender (Male or Female).' });

      // Enforce the per-gender, per-department cap (count everything not rejected).
      const { rows: cnt } = await q(
        `SELECT count(*)::int AS n FROM council_members WHERE department = $1 AND gender = $2 AND status <> 'rejected'`,
        [department, gender]
      );
      if (cnt[0].n >= MAX_PER_GENDER) {
        return send(res, 400, { error: 'This department already has the maximum of ' + MAX_PER_GENDER + ' ' + (gender === 'Female' ? 'female' : 'male') + ' members.' });
      }

      const skills = Array.isArray(b.skills) ? b.skills.join(', ') : str(b.skills, 600);
      const hobbies = Array.isArray(b.hobbies) ? b.hobbies.join(', ') : str(b.hobbies, 600);
      const socials = Array.isArray(b.socials) ? b.socials.join(' , ') : str(b.socials, 800);
      // Admin additions are approved immediately; council additions await approval.
      const status = me.role === 'admin' ? 'approved' : 'pending';
      const { rows } = await q(
        `INSERT INTO council_members
           (name, department, position, email, phone, details, nationality, regno, gender, level, program, semester, cgpa, skills, hobbies, socials, status, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
        [name, department, str(b.position, 120) || null, str(b.email, 160) || null, str(b.phone, 40) || null,
         str(b.details, 1000) || null, str(b.nationality, 80) || null, str(b.regno, 60) || null, gender,
         str(b.level, 40) || null, str(b.program, 120) || null, str(b.semester, 40) || null, str(b.cgpa, 20) || null,
         skills || null, hobbies || null, socials || null, status, me.id]
      );
      return send(res, 201, { ok: true, member: rows[0] });
    }

    return send(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    console.error('council-members error', e);
    return send(res, 500, { error: 'Server error' });
  }
};
