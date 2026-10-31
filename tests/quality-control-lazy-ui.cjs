const assert=require('node:assert/strict');
const fs=require('node:fs');

const page=fs.readFileSync('supervisor/kontrol-mutu-pendidikan.html','utf8');
const mirror=fs.readFileSync('docs/supervisor/kontrol-mutu-pendidikan.html','utf8');
assert.equal(page,mirror,'halaman root dan docs harus identik');
assert.match(page,/Mode Hemat Data/);
assert.match(page,/data-indicator="guru"/);
assert.match(page,/data-indicator="keuangan"/);
assert.match(page,/const INDICATOR_PATHS=/);
assert.match(page,/targets=force\?keys:keys\.filter\(key=>!loadedKeys\.has\(key\)\)/,'hanya path indikator aktif yang dimuat');
assert.doesNotMatch(page,/Object\.entries\(PATH\).*Promise\.all/s,'tidak boleh ada bulk-read seluruh path saat membuka halaman');
assert.match(page,/showPicker\(\);\s*\n<\/script>/,'halaman pertama harus berhenti di pemilih indikator');

const home=fs.readFileSync('js/supervisor-home-v2.js','utf8');
assert.match(home,/quick\.unshift\(\['▥','Kontrol Mutu Pendidikan'/,'Kontrol Mutu harus menjadi akses cepat pertama');
assert.match(home,/openAuthorizedMenu\('menu-kontrol-mutu-pendidikan'\)/);

console.log('quality-control-lazy-ui: ok');
