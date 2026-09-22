'use strict';

const { cors, send } = require('../_lib/http');
const { userFromReq } = require('../_lib/auth');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.end();
  const u = userFromReq(req);
  if (!u) return send(res, 401, { error: 'Authentication required' });
  return send(res, 200, { user: { id: u.id, name: u.name, email: u.email, role: u.role } });
};
