'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const rules = JSON.parse(fs.readFileSync(path.join(root, 'firebase-rtdb-rules-cahaya-app-v20.json'), 'utf8')).rules;
const app = rules.cahaya_app;
assert.equal(app['.read'], undefined, 'broad parent read bypasses protected children');
assert.equal(app['.write'], undefined, 'broad parent write bypasses protected children');
assert.equal(app.$other, undefined, 'unknown database paths require deliberate rules');
assert.equal(app.face_attendance_poc['.read'], false);
assert.equal(app.face_attendance_poc['.write'], false);
const used = new Set();
function visit(folder) {
  for (const entry of fs.readdirSync(folder, {withFileTypes:true})) {
    if (['.git', 'docs', 'node_modules'].includes(entry.name)) continue;
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) visit(file);
    else if (/\.(js|html|cjs)$/.test(entry.name)) {
      const source = fs.readFileSync(file, 'utf8');
      for (const match of source.matchAll(/cahaya_app\/([A-Za-z0-9_]+)/g)) used.add(match[1]);
    }
  }
}
visit(root);
for (const key of used) assert(app[key], `missing RTDB grant for ${key}`);
const adminTables = fs.readFileSync(path.join(root, 'admin/settings.html'), 'utf8')
  .split('const nodeLabels = {')[1].split('};')[0];
for (const match of adminTables.matchAll(/"([A-Za-z0-9_/]+)"\s*:/g))
  assert(app[match[1].split('/')[0]], `missing Admin data table ${match[1]}`);
console.log(`PASS ${used.size} referenced CAHAYA data branches and Admin tables have explicit rules; biometric POC remains private`);
