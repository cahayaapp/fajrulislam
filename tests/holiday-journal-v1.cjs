const assert=require('node:assert/strict');
const M=require('../js/holiday-journal-v1.js');
const R=require('../js/role-system-v2.js');
const N=require('../js/role-navigation-v2.js');

assert.equal(M.ACTIVITIES.length,12,'aktivitas harian harus 12');
assert.equal(M.QUESTIONS.length,7,'pertanyaan Bedah Rapor harus 7');
assert.equal(M.ACTIVITIES[0].label,'Shalat Tahajjud');
assert.equal(M.ACTIVITIES[11].label,'Membantu Pekerjaan Orang Tua');
assert.match(M.QUESTIONS[0].label,/triwulan 1/i);
assert.match(M.QUESTIONS[6].label,/ayah\/ibu/i);

const checks=M.normalizeChecks({aktivitas_1:true,aktivitas_2:false,aktivitas_3:'true'});
assert.equal(checks.aktivitas_1,true);
assert.equal(checks.aktivitas_2,false);
assert.equal(checks.aktivitas_3,false,'boolean false/true harus eksplisit, bukan truthy');
assert.deepEqual(M.activityProgress(checks),{completed:1,total:12,percent:8});

const answers=Object.fromEntries(M.QUESTIONS.map((x,i)=>[x.id,` jawaban ${i+1} `]));
assert.deepEqual(M.reportProgress(answers),{completed:7,total:7,complete:true});
assert.equal(M.normalizeAnswers(answers).jawaban_1,'jawaban 1');

assert.equal(M.activityPath('santri.01','2026-12-20'),'cahaya_app/jurnal_liburan/aktivitas_harian/santri_01/2026-12-20');
assert.equal(M.reportPath('santri/01'),'cahaya_app/jurnal_liburan/bedah_rapor/santri_01/triwulan_1_ke_2');
assert.throws(()=>M.activityPath('','2026-12-20'),/STUDENT_KEY_REQUIRED/);
assert.throws(()=>M.activityPath('santri','20-12-2026'),/INVALID_DATE/);

function profile(role,scope){return{uid:'test-user',username:'test-user',nama:'Pengguna Uji',...(role==='WALI_SANTRI'?{namaAnak:'Santri Uji'}:{}),roleSystemVersion:2,roles:[role],defaultRole:role,assignments:{[role]:scope}}}
const mentor=R.resolveSession(profile('MENTOR_USRAH',{usrahIds:['USRAH_3']}));
const supervisor=R.resolveSession(profile('SUPERVISOR',{unit:'PUTRA',divisionIds:['PEMBINAAN_KARAKTER'],supervisedRoles:['NAQIB','MENTOR_USRAH']}));
const educationSupervisor=R.resolveSession(profile('SUPERVISOR',{unit:'PUTRA',divisionIds:['PENDIDIKAN'],supervisedRoles:['GURU_PONDOK']}));
assert.equal(N.canAccessRoute(mentor,'pembinaan/jurnal-liburan-monitor.html').ok,true);
assert.equal(N.canAccessRoute(supervisor,'pembinaan/jurnal-liburan-monitor.html').ok,true);
assert.equal(N.canAccessRoute(educationSupervisor,'pembinaan/jurnal-liburan-monitor.html').ok,false);
assert.equal(N.canAccessRoute(R.resolveSession(profile('WALI_SANTRI',{namaAnak:'Santri Uji'})),'wali/dashboard/jurnal-liburan.html').ok,true);

console.log('holiday-journal-v1: ok');
