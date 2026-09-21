const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'wali/dashboard/pembinaan.html'), 'utf8');
const counselor = fs.readFileSync(path.join(root, 'js/counselor-app-v2.js'), 'utf8');
const inline = page.match(/<script>\s*([\s\S]*?)<\/script>/g)?.at(-1)?.replace(/^<script>|<\/script>$/g, '');
assert.ok(inline, 'Laporan Pembinaan has an inline controller');
new vm.Script(inline, { filename: 'wali/dashboard/pembinaan.html' });

const scoring = page.match(/const safeNumber = \(\.\.\.values\) => \{[\s\S]*?const explicitReportPoint = item =>/);
assert.ok(scoring, 'status scoring contract is present');
const context = vm.createContext({});
vm.runInContext(`${scoring[0].replace(/const explicitReportPoint = item =>$/, '')}\nthis.score = programAttendanceScore`, context);
assert.equal(context.score({ status: 'H' }), 100);
assert.equal(context.score({ status: 'T' }), 70);
assert.equal(context.score({ status: 'A' }), 0);
assert.equal(context.score({ status: 'I' }), null);
assert.equal(context.score({ status: 'S' }), null);
assert.equal(context.score({ status: 'H', poin: 7 }), 7, 'legacy point is preserved');
assert.match(page, /const poin = programAttendanceScore\(item\);\s*if \(poin === null\) return;/);

assert.match(counselor, /wali_index\/\$\{waliKey\}\/kasus_konselor\/\$\{handlingId\}/);
assert.match(page, /readSnapshot\(dbRT,"cahaya_app\/buku_kasus_konselor",\{limit:100,noCache:true\}\)/);
assert.match(page, /readSnapshot\(dbRT,"cahaya_app\/laporan_penindakan",\{limit:100,noCache:true\}\)/);
assert.match(page, /const id = record\.sumberCaseId \|\| key;/);
console.log('Wali Pembinaan: status absensi, indeks Konselor, dan deduplikasi lulus.');
