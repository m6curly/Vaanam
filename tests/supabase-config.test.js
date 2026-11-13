'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/supabase-config');

function invoke(method = 'GET', env = {}) {
  const previous = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY
  };
  for (const key of Object.keys(previous)) delete process.env[key];
  Object.assign(process.env, env);
  const headers = {};
  const res = {
    statusCode: 200,
    setHeader(name, value) { headers[name.toLowerCase()] = value; },
    end(body) { this.body = body; }
  };
  try { handler({ method }, res); }
  finally {
    for (const key of Object.keys(previous)) {
      delete process.env[key];
      if (previous[key] !== undefined) process.env[key] = previous[key];
    }
  }
  return { ...res, headers, json: JSON.parse(res.body) };
}

test('public Supabase config is returned for a publishable key', () => {
  const result = invoke('GET', {
    SUPABASE_URL: 'https://example-project.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_example_key'
  });
  assert.equal(result.statusCode, 200);
  assert.equal(result.json.configured, true);
  assert.equal(result.json.url, 'https://example-project.supabase.co');
  assert.equal(result.json.anonKey, 'sb_publishable_example_key');
  assert.equal(result.headers['cache-control'], 'no-store, max-age=0');
});

test('legacy anon key is supported through the alternative variable', () => {
  const payload = Buffer.from(JSON.stringify({ role: 'anon' })).toString('base64url');
  const result = invoke('GET', {
    SUPABASE_URL: 'https://example-project.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: `header.${payload}.signature`
  });
  assert.equal(result.statusCode, 200);
  assert.equal(result.json.configured, true);
});

test('service role JWTs are never exposed to the browser', () => {
  const payload = Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url');
  const result = invoke('GET', {
    SUPABASE_URL: 'https://example-project.supabase.co',
    SUPABASE_ANON_KEY: `header.${payload}.signature`
  });
  assert.equal(result.statusCode, 503);
  assert.equal(result.json.configured, false);
  assert.equal(result.body.includes('service_role'), false);
});

test('secret-format keys and non-HTTPS URLs are rejected', () => {
  const secret = invoke('GET', {
    SUPABASE_URL: 'https://example-project.supabase.co',
    SUPABASE_ANON_KEY: 'sb_secret_example'
  });
  const http = invoke('GET', {
    SUPABASE_URL: 'http://example-project.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_example'
  });
  assert.equal(secret.statusCode, 503);
  assert.equal(http.statusCode, 503);
});

test('missing settings and unsupported methods fail safely', () => {
  const missing = invoke('GET');
  const method = invoke('POST', {
    SUPABASE_URL: 'https://example-project.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_example'
  });
  assert.equal(missing.statusCode, 503);
  assert.equal(method.statusCode, 405);
  assert.equal(method.headers.allow, 'GET');
});
