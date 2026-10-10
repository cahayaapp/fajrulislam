'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),L=require('../js/teacher-leave-v1.js'),R=require('../js/role-system-v2.js'),N=require('../js/role-navigation-v2.js'),M=require('../js/role-menu-v2.js'),{profile,assignments}=require('./role-menu-v2-fixtures.cjs');
const input={type:'Sakit',startDate:'2026-10-08',startTime:'06:00',endDate:'2026-10-09',endTime:'15:00',reason:'Perlu istirahat',contact:'08123456789',handover:'Materi dan tugas diserahkan kepada guru pengganti'};
assert.equal(L.validate(input).type,'Sakit');
assert.throws(()=>L.validate({...input,reason:'   '}),/Alasan izin/);
assert.throws(()=>L.validate({...input,endDate:'2026-10-07'}),/lebih awal/);
const schedule=[
  {id:'kamis-putra',hari:4,jamMulai:'07:00',jamSelesai:'08:00',mapel:'Fiqih',kelas:'Kelas 3 Putra',guruKode:'RH',aktif:true},
  {id:'jumat-putri',hari:5,jamMulai:'09:00',jamSelesai:'10:00',mapel:'Bahasa Arab',kelas:'Kelas 3 Putri',guruKode:'RH',aktif:true},
  {id:'guru-lain',hari:4,jamMulai:'10:00',jamSelesai:'11:00',mapel:'Hadits',kelas:'Kelas 2 Putra',guruKode:'XX',aktif:true}
];
const lessons=L.affectedLessons(input,schedule,{teacherCode:'RH'},r=>r.guruKode==='RH');
assert.equal(lessons.length,2,'seluruh pertemuan Guru dalam rentang izin terdeteksi');
assert.deepEqual(L.requestUnits(lessons),['PUTRA','PUTRI']);
const request={id:'izin-1',teacherUid:'guru-1',teacherKey:'person-1',teacherCode:'RH',programDomain:'KEPONDOKAN',units:['PUTRA'],status:'PENDING_REVIEW',lessons};
assert(L.teacherOwns(request,{uid:'guru-1'}));assert(!L.teacherOwns(request,{uid:'guru-2'}));
assert(L.scopeAllows(request,{unit:'PUTRA'}));assert(!L.scopeAllows(request,{unit:'PUTRI'}));
const review=L.decision(request,{status:'APPROVED',note:'Disetujui. Koordinasikan guru pengganti.',now:'2026-10-08T01:00:00.000Z'},{uid:'supervisor-1',name:'Supervisor Pendidikan Putra'});
assert.equal(review.status,'APPROVED');assert.equal(review.reviewVersion,1);assert.equal(review.reviewerUid,'supervisor-1');
assert(L.managerVisible({...request,status:'APPROVED',review},{unit:'PUTRA'}));
assert(!L.managerVisible({...request,status:'PENDING_REVIEW'},{unit:'PUTRA'}));
const teacher=R.resolveSession(profile('GURU_PONDOK')),supervisor=R.resolveSession(profile('SUPERVISOR',{unit:'PUTRA',supervisedRoles:['GURU_PONDOK'],divisionIds:['PENDIDIKAN']})),manager=R.resolveSession(profile('MANAJER',assignments.MANAJER));
for(const [session,id,label] of [[teacher,'menu-izin-guru','Izin Guru'],[supervisor,'menu-persetujuan-izin-guru','Persetujuan Izin Guru'],[manager,'menu-informasi-izin-guru','Informasi Izin Guru']]){const item=M.model(session).find(x=>x.id===id);assert(item,label+' tersedia');assert.equal(item.route,'pendidikan/izin-guru.html?v=2');assert(N.decision(session,id,item.route).ok,label+' lolos route guard')}
const characterManager=R.resolveSession(profile('MANAJER',{area:'PEMBINAAN_KARAKTER',unit:'PUTRA',managedRoles:['NAQIB','KONSELOR']}));assert(!N.canAccessRoute(characterManager,'pendidikan/izin-guru.html').ok);
const source=fs.readFileSync('js/teacher-leave-page-v1.js','utf8'),page=fs.readFileSync('pendidikan/izin-guru.html','utf8');assert(source.includes("BASE='cahaya_app/izin_guru'"));assert(source.includes('managerNotice'));assert(source.includes('runTransaction'));assert(source.includes("cahaya_app/jadwal_pelajaran"));assert(source.includes("decision.dataset.decision"));assert(!source.includes('event.submitter'));assert(source.includes('Catatan keputusan wajib diisi'));assert.match(page,/data-decision="APPROVED"/);assert.match(page,/data-decision="REJECTED"/);assert.match(page,/data-decision="NEEDS_CONFIRMATION"/);
for(const file of ['js/teacher-leave-v1.js','js/teacher-leave-page-v1.js','js/role-system-v2.js','js/role-menu-v2.js','js/role-route-registry-v2.js','js/role-navigation-v2.js','pendidikan/izin-guru.html','css/teacher-leave-v1.css','main-dashboard.html'])assert.equal(fs.readFileSync(file,'utf8'),fs.readFileSync('docs/'+file,'utf8'),'mirror '+file);
console.log(JSON.stringify({status:'ok',lessons:lessons.length,teacherMenu:true,supervisorMenu:true,managerMenu:true},null,2));
