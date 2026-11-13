'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const roots = ['.', 'api', 'tests', 'scripts'];
const files = roots.flatMap(folder => {
  const directory = path.join(root, folder);
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.js'))
    .map(entry => path.join(directory, entry.name));
});
let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed = true;
    process.stderr.write(`${path.relative(root, file)}\n${result.stderr}`);
  }
}
if (failed) process.exitCode = 1;
else process.stdout.write(`VAANAM syntax check passed · ${files.length} JavaScript files checked.\n`);
