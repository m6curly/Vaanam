'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pages = {
  'index.html': 'home',
  'history.html': 'osm-history',
  'change-detection.html': 'change-detection',
  'lst.html': 'land-surface-temperature',
  'legal.html': 'legal'
};

function read(name) { return fs.readFileSync(path.join(root, name), 'utf8'); }

test('every page declares its workspace and loads the shared theme and cloud client', () => {
  for (const [filename, workspace] of Object.entries(pages)) {
    const html = read(filename);
    assert.match(html, new RegExp(`<body[^>]*data-workspace="${workspace}"`), `${filename} workspace`);
    assert.match(html, /href="vaanam-theme\.css"/, `${filename} shared theme`);
    assert.match(html, /src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2"/, `${filename} Supabase client`);
    assert.match(html, /src="vaanam-cloud\.js"/, `${filename} cloud client`);
    assert.match(html, /<title>[^<]*VAANAM[^<]*<\/title>/, `${filename} title`);
  }
});

test('page element IDs are unique', () => {
  for (const filename of Object.keys(pages)) {
    const html = read(filename);
    const ids = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map(match => match[1]);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    assert.deepEqual([...new Set(duplicates)], [], `${filename} duplicate ids`);
  }
});

test('local page links and script/style references exist', () => {
  for (const filename of Object.keys(pages)) {
    const html = read(filename);
    const refs = [
      ...[...html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)].map(match => match[1])
    ];
    for (const ref of refs) {
      if (!ref || ref.startsWith('#') || /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(ref)) continue;
      const local = decodeURIComponent(ref.split('#')[0].split('?')[0]);
      if (!local) continue;
      assert.equal(fs.existsSync(path.join(root, local)), true, `${filename} missing ${local}`);
    }
  }
});

test('all workspace links resolve to a page in this release', () => {
  const cloud = read('vaanam-cloud.js');
  for (const href of ['index.html', 'history.html', 'change-detection.html', 'lst.html']) {
    assert.equal(fs.existsSync(path.join(root, href)), true, `${href} exists`);
    assert.match(cloud, new RegExp(`'${href}'`), `${href} is in shared navigation`);
  }
});

test('obsolete custom Google authentication is removed', () => {
  assert.equal(fs.existsSync(path.join(root, 'api/auth')), false);
  assert.equal(fs.existsSync(path.join(root, 'lib/auth.js')), false);
  assert.doesNotMatch(read('vaanam-cloud.js'), /@gmail\.com|api\/auth\/google/);
});
