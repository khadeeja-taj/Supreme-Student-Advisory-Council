'use strict';

const { init, q } = require('../_lib/db');
const { cors, send, body, str } = require('../_lib/http');
const { guard } = require('../_lib/auth');

// PATCH: admin approve/reject/edit a council member.
// DELETE: admin removes anyone; a council user may remove their own pending entry.
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.end();
  const me = guard(req, res, ['admin', 'council']);
  if (!me) return;

  const id = parseInt(req.query.id, 10);
  if (!id) return send(res, 400, { error: 'Invalid member id' });

  // Only admins may approve/edit — reject before touching the DB.
  if (req.method === 'PATCH' && me.role !== 'admin') {
    return send(res, 403, { error: 'Only administrators can approve or edit members.' });
  }

  try {
    await init();

    if (req.method === 'PATCH') {
      const b = await body(req);
      const sets = []; const vals = []; let i = 1;
      if (b.status != null) {
        if (!['pending', 'approved', 'rejected'].includes(b.status)) return send(res, 400, { error: 'Invalid status' });
        sets.push(`status = $${i++}`); vals.push(b.status);
      }
      ['name', 'department', 'position', 'email', 'phone', 'details'].forEach((c) => {
        if (b[c] != null) { sets.push(`${c} = $${i++}`); vals.push(str(b[c], 1000) || null); }
      });
      if (!sets.length) return send(res, 400, { error: 'Nothing to update.' });
      vals.push(id);
      const { rows } = await q(`UPDATE council_members SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
      if (!rows.length) return send(res, 404, { error: 'Member not found' });
      return send(res, 200, { ok: true, member: rows[0] });
    }

    if (req.method === 'DELETE') {
      if (me.role === 'admin') {
        const { rowCount } = await q('DELETE FROM council_members WHERE id = $1', [id]);
        if (!rowCount) return send(res, 404, { error: 'Member not found' });
        return send(res, 200, { ok: true });
      }
      // council: only own, still-pending entries
      const { rowCount } = await q(
        `DELETE FROM council_members WHERE id = $1 AND created_by = $2 AND status = 'pending'`,
        [id, me.id]
      );
      if (!rowCount) return send(res, 403, { error: 'You can only remove your own pending submissions.' });
      return send(res, 200, { ok: true });
    }

    return send(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    console.error('council-member error', e);
    return send(res, 500, { error: 'Server error' });
  }
};
