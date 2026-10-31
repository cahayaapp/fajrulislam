const assert=require('node:assert/strict');
const K=require('../js/weekly-kpi-v2.js');
const W=require('../js/naqib-weekend-mode-v2.js');
const schedule=require('../data/jadwal-piket-pengawas-2026-2027.json');
const week=K.weekOf('2026-09-23');
const earned=key=>({personKey:key,weekKey:week.weekKey,rewardEligible:true,status:'EARNED',rewardStart:week.rewardStart,rewardEnd:week.rewardEnd});

assert.equal(W.personKey('Yong'),'khaizuran');
assert.equal(W.personKey('ADE KHAIZURAN UTSMAN'),'khaizuran');
assert.equal(W.personKey('Favian'),'favian');
assert.equal(W.personKey('Kamal'),'kamal');

for(const key of ['khaizuran','favian','kamal']){
  const active=W.apply([{id:'routine'}],{reward:earned(key),person:key,at:new Date('2026-09-26T18:00:00+07:00')});
  assert.equal(active.weekendMode,true);assert.deepEqual(active.programs,[]);
}
assert.equal(W.apply([{id:'routine'}],{reward:earned('favian'),at:new Date('2026-09-26T12:59:00+07:00')}).weekendMode,false);
assert.equal(W.apply([{id:'routine'}],{reward:earned('favian'),at:new Date('2026-09-27T11:00:00+07:00')}).weekendMode,false);

const all={khaizuran:earned('khaizuran'),favian:earned('favian'),kamal:earned('kamal')};
const coverage=W.coverage(schedule,all,week);
assert.equal(coverage.rewarded.length,3);
assert.equal(coverage.autoReassign,false);
assert.equal(coverage.status,'BELUM_TERPENUHI');
assert.deepEqual(coverage.conflicts.map(row=>[row.personKey,row.day,row.blockId]),[
  ['khaizuran','sabtu','blok2'],['favian','sabtu','blok3'],['kamal','ahad','blok1']
]);
assert.match(coverage.needs.join(' '),/penanggung jawab dewasa\/institusi/);

const onlyYong=W.coverage(schedule,{khaizuran:earned('khaizuran')},week);
assert.equal(onlyYong.available.length,2);
assert.equal(onlyYong.autoReassign,false);
assert.equal(onlyYong.conflicts.length,1);
assert.equal(onlyYong.available.every(row=>row.availability==='TERSEDIA_TANPA_PENUGASAN_OTOMATIS'),true);

console.log('PASS Naqib Weekend Mode: stable identities, exact window, no auto reassignment, conflicts and adult coverage');
