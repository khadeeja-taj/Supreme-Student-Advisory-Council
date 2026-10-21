'use strict';

const { init, q } = require('../../_lib/db');
const { cors, send, body, str } = require('../../_lib/http');
const { guard } = require('../../_lib/auth');
const { genToken } = require('../../_lib/comp');

// Admin — email each registrant of this competition a PRIVATE link so they can
// choose their level & day. Sent in batches (limit/offset) to stay within the
// serverless time budget; the admin UI calls this repeatedly until done.
//
// Requires RESEND_API_KEY (and optionally FROM_EMAIL) in the environment.
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.end();
  const me = guard(req, res, ['admin']);
  if (!me) return;
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  const id = parseInt(req.query.id, 10);
  if (!id) return send(res, 400, { error: 'Invalid competition id' });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return send(res, 400, { error: 'Email service is not connected yet. Add RESEND_API_KEY in Netlify to enable automatic emails.' });
  }
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

  try {
    await init();
    const b = await body(req);
    let base = str(b.base, 300).replace(/\/+$/, '');
    if (!/^https?:\/\//.test(base)) base = '';
    const limit = Math.min(Math.max(parseInt(b.limit, 10) || 25, 1), 50);
    const offset = Math.max(parseInt(b.offset, 10) || 0, 0);

    const compRows = await q(`SELECT title, title_ar FROM competitions WHERE id = $1`, [id]);
    const comp = compRows[0];
    if (!comp) return send(res, 404, { error: 'Competition not found' });

    const totalRow = await q(
      `SELECT count(*)::int AS n FROM competition_entries WHERE competition_id = $1 AND email IS NOT NULL AND email <> ''`, [id]);
    const total = totalRow.rows[0].n;

    const { rows } = await q(
      `SELECT id, name, email, edit_token FROM competition_entries
         WHERE competition_id = $1 AND email IS NOT NULL AND email <> ''
         ORDER BY id ASC LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    let sent = 0; const failed = [];
    for (const e of rows) {
      let token = e.edit_token;
      if (!token) { token = genToken(); await q(`UPDATE competition_entries SET edit_token = $1 WHERE id = $2`, [token, e.id]); }
      const link = base + '/?pick=' + encodeURIComponent(token) + '&c=' + id;
      const title = comp.title_ar || comp.title || 'the competition';
      const html = emailHtml(e.name || '', title, link);
      try {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: fromEmail,
            to: [e.email],
            subject: 'اختر مستواك ويومك • Choose your level & day',
            html: html
          })
        });
        if (r.ok) { sent++; } else { const t = await r.text(); failed.push({ email: e.email, error: t.slice(0, 200) }); }
      } catch (err) {
        failed.push({ email: e.email, error: String(err && err.message || err).slice(0, 200) });
      }
    }

    const processed = offset + rows.length;
    return send(res, 200, {
      ok: true, sent: sent, failed: failed,
      total: total, processed: processed, done: processed >= total,
      nextOffset: processed
    });
  } catch (e) {
    console.error('email error', e);
    return send(res, 500, { error: 'Could not send emails. Please try again.' });
  }
};

function emailHtml(name, title, link) {
  const safe = String(name || '').replace(/[<>&]/g, '');
  return '<div style="font-family:Tahoma,Arial,sans-serif;max-width:560px;margin:auto;padding:16px;direction:rtl;text-align:right">'
    + '<h2 style="color:#0b2a3a">السلام عليكم ' + safe + '</h2>'
    + '<p style="font-size:15px;color:#333;line-height:1.7">أنت مسجّل في <b>' + String(title).replace(/[<>&]/g, '') + '</b>.'
    + ' يرجى اختيار <b>المستوى</b> (القرآن كاملاً / 20 جزء / 10 أجزاء) و<b>اليوم</b> المناسب لك عبر الرابط التالي:</p>'
    + '<p style="text-align:center;margin:26px 0"><a href="' + link + '" style="background:#219EBC;color:#fff;text-decoration:none;padding:12px 26px;border-radius:8px;font-weight:bold;display:inline-block">اختر المستوى واليوم</a></p>'
    + '<p style="font-size:13px;color:#777">إذا لم يعمل الزر، انسخ هذا الرابط في المتصفح:<br><span style="word-break:break-all">' + link + '</span></p>'
    + '<hr style="border:none;border-top:1px solid #eee;margin:22px 0">'
    + '<p style="font-size:14px;color:#333;direction:ltr;text-align:left">You are registered in <b>' + String(title).replace(/[<>&]/g, '') + '</b>. Please choose your level and preferred day using the button above.</p>'
    + '</div>';
}
