const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const attendance=require(path.join(root,'js/naqib-prayer-attendance-v2.js'));

assert.equal(attendance.isCongregationalPrayer({nama:'Shalat Subuh Berjama\'ah'}),true);
assert.equal(attendance.isCongregationalPrayer({nama:'Sholat Ashar Berjamaah'}),true);
assert.equal(attendance.isCongregationalPrayer({nama:'Wirid Pagi'}),false);
assert.equal(attendance.isCongregationalPrayer({nama:'Maulid Pekanan'}),false);

assert.equal(attendance.stage(null,true),'AWAL');
assert.equal(attendance.stage({tahapAbsensi:'AWAL',statusFinalisasi:'BELUM_FINAL'},true),'AKHIR');
assert.equal(attendance.stage({tahapAbsensi:'FINAL',statusFinalisasi:'FINAL'},true),'FINAL_VIEW');
assert.equal(attendance.stage({status:'legacy'},true),'FINAL_VIEW');
assert.equal(attendance.stage(null,false),'SINGLE');

const late=attendance.initialItem({nama:'Ahmad',usrah:'usrah1'},'T');
assert.equal(late.status,'T');
assert.equal(late.statusAwal,'T');
assert.equal(late.final,false);
assert.equal(late.keteranganTerlambat,'');
assert.deepEqual(attendance.missingLateNotes([late]).map(row=>row.nama),['Ahmad']);

const finalized=attendance.finalizeItem(late,'Terlambat antre wudu');
assert.equal(finalized.status,'T');
assert.equal(finalized.statusFinal,'T');
assert.equal(finalized.final,true);
assert.equal(finalized.keteranganTerlambat,'Terlambat antre wudu');
assert.equal(attendance.missingLateNotes([finalized]).length,0);

const present=attendance.initialItem({nama:'Fauzan',usrah:'usrah1'},'H');
assert.equal(attendance.missingLateNotes([present]).length,0);
assert.equal(attendance.finalizeItem(present,'abaikan').keteranganTerlambat,'');

const implementation=fs.readFileSync(path.join(root,'js/naqib-absensi-v2.js'),'utf8');
assert.match(implementation,/tahapAbsensi:'AWAL'/);
assert.match(implementation,/tahapAbsensi:'FINAL'/);
assert.match(implementation,/statusFinalisasi:'BELUM_FINAL'/);
assert.match(implementation,/statusFinalisasi:'FINAL'/);
assert.match(implementation,/keteranganTerlambat/);
assert.match(implementation,/absensi_program_harian\/\$\{state\.existingKey\}/);
assert.doesNotMatch(implementation,/absensi_(?:awal|akhir)_shalat/);
assert.match(implementation,/function scopedLocalUsrah\(\)/);
assert.match(implementation,/function usableUsrah\(remote=\{\}\)/);
assert.match(implementation,/state\.usrah=scopedLocalUsrah\(\)/);

const html=fs.readFileSync(path.join(root,'naqib/absensi.html'),'utf8');
assert.match(html,/naqib-prayer-attendance-v2\.js/);
assert.match(html,/id="attendanceEyebrow"/);
assert.match(html,/id="attendanceSubtitle"/);

console.log('naqib prayer attendance v2 tests: OK');
