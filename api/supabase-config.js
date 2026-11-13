'use strict';

/**
 * Exposes only the Supabase URL and browser-safe publishable/anon key.
 * Row Level Security is the security boundary for the browser client.
 */
module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    return res.end(JSON.stringify({ error: 'Method not allowed.' }));
  }

  const url = String(process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
  const key = String(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '').trim();
  let validUrl = false;
  try {
    const parsed = new URL(url);
    validUrl = parsed.protocol === 'https:' && Boolean(parsed.hostname) && !parsed.username && !parsed.password && parsed.pathname === '/';
  } catch { /* invalid or missing project URL */ }

  let isSecretKey = /^sb_secret_/i.test(key);
  try {
    const payload = key.split('.')[1];
    if (payload) {
      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      isSecretKey = isSecretKey || decoded.role === 'service_role';
    }
  } catch { /* publishable keys may not be JWTs */ }

  if (!validUrl || !key || isSecretKey) {
    res.statusCode = 503;
    return res.end(JSON.stringify({ configured: false, error: 'Supabase is not configured with a browser-safe key.' }));
  }

  res.statusCode = 200;
  return res.end(JSON.stringify({ configured: true, url, anonKey: key }));
};
