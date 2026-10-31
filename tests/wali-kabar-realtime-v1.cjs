const assert = require('assert');
const fs = require('fs');

const root = fs.readFileSync('wali/dashboard/beranda.html', 'utf8');
const mirror = fs.readFileSync('docs/wali/dashboard/beranda.html', 'utf8');
const shell = fs.readFileSync('wali/dashboard/index.html', 'utf8');
const shellMirror = fs.readFileSync('docs/wali/dashboard/index.html', 'utf8');

assert.strictEqual(mirror, root, 'Mirror docs Kabar Ananda harus identik');
assert.strictEqual(shellMirror, shell, 'Mirror docs shell Wali harus identik');
assert.match(shell, /beranda\.html\?v=68/, 'Shell harus memuat revisi Kabar Ananda terbaru');
assert.doesNotMatch(shell, /beranda\.html\?v=67/, 'Referensi cache Kabar Ananda lama harus dihapus');
assert.match(root, /function kunciIndexSantriTimeline\(\)/, 'Resolver key index santri harus tersedia');
assert.match(root, /\[trustedKey, canonicalKey, legacyKey\]/, 'Key stabil dan key kompatibilitas harus dibaca');
assert.match(root, /noCache:\s*true/, 'Pembukaan Kabar Ananda harus melewati cache lama');

for (const category of ['halqah', 'tahfiz', 'program', 'pembelajaran', 'penindakan']) {
  assert.match(
    root,
    new RegExp(`${category}:\\s*\\d+`),
    `Listener realtime ${category} harus aktif`
  );
}

assert.match(
  root,
  /cahaya_app\/wali_index\/\$\{studentKey\}\/\$\{category\}/,
  'Listener harus dibatasi pada index anak aktif'
);
assert.doesNotMatch(
  root,
  /dbRT\.ref\('cahaya_app\/absensi_program_harian'\)\.on/,
  'Portal Wali tidak boleh memasang listener koleksi absensi global'
);
assert.match(root, /function lepasListenerTimeline\(\)/, 'Listener anak lama harus dapat dilepas');
assert.match(root, /pasangListenerTimeline\(\);\s*jadwalkanRefreshTimeline\(\);/, 'Pergantian profil harus memasang ulang listener');

console.log('PASS wali-kabar-realtime-v1');
