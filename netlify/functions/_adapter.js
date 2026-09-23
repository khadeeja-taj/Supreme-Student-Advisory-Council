'use strict';

/**
 * Adapter: run the existing Vercel-style handlers ( module.exports = (req,res) )
 * unchanged under Netlify Functions ( exports.handler = (event,context) ).
 *
 * The handlers only use: req.method, req.headers, req.query, req.body and
 * res.statusCode / res.setHeader / res.end — so we shim exactly those.
 * Files starting with "_" are ignored by Netlify, so this is not itself a route.
 */

function normalizeHeaders(h) {
  const out = {};
  if (h) for (const k in h) out[k.toLowerCase()] = h[k];
  return out;
}

function parseBody(event) {
  if (!event || !event.body) return {};
  let raw = event.body;
  if (event.isBase64Encoded) { try { raw = Buffer.from(raw, 'base64').toString('utf8'); } catch (e) { raw = ''; } }
  try { return JSON.parse(raw); } catch (e) { return {}; }
}

module.exports = function adapt(handler) {
  return function (event, context) {
    // keep the DB pool alive between invocations
    if (context) context.callbackWaitsForEmptyEventLoop = false;
    return new Promise((resolve) => {
      let settled = false;
      const headers = {};
      const done = (statusCode, body) => {
        if (settled) return;
        settled = true;
        resolve({ statusCode: statusCode, headers: headers, body: body == null ? '' : String(body) });
      };
      const req = {
        method: event.httpMethod || 'GET',
        headers: normalizeHeaders(event.headers),
        query: event.queryStringParameters || {},
        body: parseBody(event)
      };
      const res = {
        statusCode: 200,
        setHeader: (k, v) => { headers[k] = v; },
        end: (body) => done(res.statusCode, body)
      };
      try {
        const r = handler(req, res);
        if (r && typeof r.then === 'function') {
          r.catch((e) => { console.error('function error', e); done(500, JSON.stringify({ error: 'Server error' })); });
        }
      } catch (e) {
        console.error('function threw', e);
        done(500, JSON.stringify({ error: 'Server error' }));
      }
    });
  };
};
