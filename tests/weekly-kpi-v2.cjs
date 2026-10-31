const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const K=require('../js/weekly-kpi-v2.js');
const R=require('../js/role-system-v2.js');
const N=require('../js/role-navigation-v2.js');

const perfect=(role)=>Object.fromEntries(K.CONFIG[role].operational.map(([id])=>[id,{value:100}]));
const observation=(scores=[5,5,5,5,5],subject='Fiqih')=>({scores:Object.fromEntries(scores.map((value,index)=>[`i${index+1}`,value])),subject});
const example=(scores=[4,4,4,4,4])=>({scores:Object.fromEntries(scores.map((value,index)=>[`i${index+1}`,value]))});

// KPI Pekan Kerja konsisten Senin-Sabtu siang; Ahad bukan bagian pekan sebelumnya.
const workWeek=K.weekOf('2026-09-23');
assert.equal(workWeek.weekStart,'2026-09-21');assert.equal(workWeek.weekEnd,'2026-09-26');assert.equal(workWeek.weekKey,'2026-09-21_2026-09-26');
assert.equal(workWeek.cutoffAt,'2026-09-26T13:00:00+07:00');assert.equal(workWeek.rewardStart,'2026-09-26T13:00:00+07:00');assert.equal(workWeek.rewardEnd,'2026-09-27T11:00:00+07:00');
assert.equal(K.weekOf('2026-09-27').weekStart,'2026-09-28');
assert.equal(K.rewardWeekOf('2026-09-27T08:00:00+07:00').weekKey,workWeek.weekKey);
assert.equal(K.inWeek({createdAt:'2026-09-26T12:59:00+07:00'},workWeek),true);assert.equal(K.inWeek({createdAt:'2026-09-26T13:01:00+07:00'},workWeek),false);assert.equal(K.inWeek({tanggal:'2026-09-27'},workWeek),false);
assert.equal(K.canClose(workWeek,'2026-09-26T12:59:00+07:00'),false);assert.equal(K.canClose(workWeek,'2026-09-26T13:00:00+07:00'),true);
assert.equal(K.inRewardWindow('2026-09-27T10:59:00+07:00',workWeek),true);assert.equal(K.inRewardWindow('2026-09-27T11:00:00+07:00',workWeek),false);

// Struktur skor resmi dan maksimum 100.
assert.equal(K.scoreOperational('GURU',perfect('GURU')).score,55);
assert.equal(K.scoreOperational('NAQIB',perfect('NAQIB')).score,50);
let result=K.calculate('GURU',{operational:perfect('GURU'),observations:[observation()],exemplaryRecord:example()});
assert.equal(result.total,100);
assert.equal(result.qualified,true);assert.equal(result.rewardEligible,false);assert.equal(result.status,'SIAP_DITUTUP');
const guruReward=K.rewardRecord(result,workWeek,{key:'guru-1',name:'Guru 1'},{uid:'mgr',name:'Manajer'},new Date('2026-09-26T13:01:00+07:00'));
result=K.calculate('GURU',{operational:perfect('GURU'),observations:[observation()],exemplaryRecord:example(),closure:{closedAt:'2026-09-26T13:01:00+07:00'},reward:guruReward});
assert.equal(result.rewardEligible,true);assert.equal(result.status,'CLOSED');assert.equal(guruReward.status,'EARNED');
result=K.calculate('NAQIB',{operational:perfect('NAQIB'),observations:[observation([5,5,5,5,5],'Subuh'),observation([5,5,5,5,5],'Makan Pagi')],exemplaryRecord:example()});
assert.equal(result.total,100);
assert.equal(result.qualified,true);assert.equal(result.rewardEligible,false);

// N/A tidak menjadi nol: bobot indikator yang berlaku didistribusikan ke maksimum operasional.
const nA=K.scoreOperational('GURU',{attendance:{value:100},punctuality:{value:100},learningAttendance:{value:100},journal:{value:100},evaluationDue:{value:null}});
assert.equal(nA.score,55);
assert.equal(nA.items.find(item=>item.id==='evaluationDue').notApplicable,true);

// Belum terobservasi dan keteladanan kosong tidak pernah Final dan tidak diberi nol/penuh.
result=K.calculate('GURU',{operational:perfect('GURU')});
assert.equal(result.status,'BELUM_LENGKAP');
assert.equal(result.total,null);
assert.equal(result.rewardEligible,false);

// Observasi multipel dirata-rata; Naqib wajib dua program berbeda.
assert.equal(K.quality('GURU',[observation([5,5,5,5,5]),observation([3,3,3,3,3])]).score,20);
assert.equal(K.quality('NAQIB',[observation([5,5,5,5,5],'Subuh'),observation([4,4,4,4,4],'Subuh')]).complete,false);
assert.equal(K.quality('NAQIB',[observation([5,5,5,5,5],'Subuh'),observation([4,4,4,4,4],'Makan Pagi')]).complete,true);

// Gate reward tidak dapat dilewati hanya oleh total tinggi.
const guru92=K.calculate('GURU',{operational:perfect('GURU'),observations:[observation([4,4,3,3,3])],exemplaryRecord:example()});
assert.equal(guru92.total,92);
assert.equal(guru92.quality.score,17);
assert.equal(guru92.rewardEligible,false);
assert.match(guru92.rewardReason,/Kualitas Pembelajaran/);
const naqib92=K.calculate('NAQIB',{operational:perfect('NAQIB'),observations:[observation([5,5,5,4,4],'Subuh'),observation([5,5,5,4,4],'Makan Pagi')],exemplaryRecord:example([3,3,3,3,3])});
assert.equal(naqib92.total,92.6);
assert.equal(naqib92.exemplary.score,15);
assert.equal(naqib92.rewardEligible,false);
assert.match(naqib92.rewardReason,/Keteladanan/);

// Critical Failure selalu menggugurkan reward dan mempertahankan audit record.
result=K.calculate('GURU',{operational:perfect('GURU'),observations:[observation()],exemplaryRecord:example(),criticalFailures:{a:{active:true,reason:'Laporan fiktif',createdByName:'Manajer',createdAt:'2026-09-25T08:00:00Z'}}});
assert.equal(result.total,100);
assert.equal(result.rewardEligible,false);
assert.equal(result.criticalFailures.length,1);
assert.match(result.rewardReason,/Critical Failure/);

// Penyimpanan V2 terpisah dari data KPI lama.
assert.equal(K.basePath('GURU','GR-01','2026-09-21_2026-09-26'),'cahaya_app/kpi_mingguan_v2/guru/gr01/2026-09-21_2026-09-26');
assert.equal(K.basePath('NAQIB','NQ-01','2026-09-21_2026-09-26'),'cahaya_app/kpi_mingguan_v2/naqib/nq01/2026-09-21_2026-09-26');

const root=path.join(__dirname,'..');
const page=fs.readFileSync(path.join(root,'js/kpi-weekly-page-v2.js'),'utf8');
const css=fs.readFileSync(path.join(root,'css/kpi-weekly-v2.css'),'utf8');
const nav=fs.readFileSync(path.join(root,'js/role-navigation-v2.js'),'utf8');
const guru=fs.readFileSync(path.join(root,'pendidikan/kpi-guru.html'),'utf8');
const naqib=fs.readFileSync(path.join(root,'naqib/kpi.html'),'utf8');
assert.match(page,/cahaya_app\/jadwal_pelajaran/);
assert.match(page,/cahaya_app\/jadwal_piket_naqib/);
assert.match(page,/cahaya_app\/kpi_mingguan_v2/);
assert.match(page,/isManager/);
assert.match(page,/isSupervisor\|\|isDirector/);
assert.match(nav,/weekly-kpi-guru-v2/);
assert.match(nav,/weekly-kpi-naqib-v2/);
assert.match(guru,/KPI Pekan Kerja Guru/);
assert.match(naqib,/KPI Pekan Kerja Naqib/);
assert.match(css,/@media\(max-width:430px\)/);
assert.equal(fs.existsSync(path.join(root,'js/guru-kpi-v144.js')),true);
assert.equal(fs.existsSync(path.join(root,'js/naqib-kpi.js')),true);

const storage={getItem:()=>null};
const education=R.resolveSession({roleSystemVersion:2,roles:['MANAJER'],defaultRole:'MANAJER',assignments:{MANAJER:{area:'PENDIDIKAN',programDomain:'KEPONDOKAN',unit:'PUTRA',managedRoles:['GURU_PONDOK']}}},storage);
const character=R.resolveSession({roleSystemVersion:2,roles:['MANAJER','NAQIB'],defaultRole:'MANAJER',assignments:{MANAJER:{area:'PEMBINAAN_KARAKTER',unit:'PUTRA',managedRoles:['NAQIB','KONSELOR']},NAQIB:{unit:'PUTRA'}}},storage);
const supervisor=R.resolveSession({roleSystemVersion:2,roles:['SUPERVISOR'],defaultRole:'SUPERVISOR',assignments:{SUPERVISOR:{unit:'PUTRA',supervisedRoles:['NAQIB','NAQIBAH']}}},storage);
assert.equal(N.canAccessRoute(education,'pendidikan/kpi-guru.html','menu-kpi-guru').ok,true);
assert.equal(N.canAccessRoute(character,'pendidikan/kpi-guru.html').ok,false);
assert.equal(N.canAccessRoute(character,'naqib/kpi.html','menu-kontrol-pembinaan').ok,true);
assert.equal(N.canAccessRoute(supervisor,'naqib/kpi.html').ok,true);

console.log('PASS weekly KPI V2: weekly period, N/A, observations, gates, critical failure, legacy and mobile contracts');
