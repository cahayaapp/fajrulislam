const assert=require('node:assert/strict');
const A=require('../js/naqib-program-today.js');
const W=require('../js/naqib-weekend-mode-v2.js');
const R=require('../js/role-system-v2.js');
const ROUTES=require('../js/role-route-registry-v2.js');
const N=require('../js/role-navigation-v2.js');
const daily=[
  {id:'a',no:1,waktu:'03.30–04.00',program:'Bangun'},
  {id:'b',no:2,waktu:'04.00–11.20',program:'Pagi'},
  {id:'c',no:3,waktu:'11.20–17.50',program:'Siang'},
  {id:'d',no:4,waktu:'17.50–03.30',program:'Malam'}
];
const monday=new Date('2026-09-14T05:00:00+07:00');
const base=A.basePrograms(daily,[{id:'w',no:101,waktu:'08.00–09.00',program:'Pekanan',hariAktif:['senin']}],monday);
assert.equal(base.length,5);
const putra={blok:{blok1:{mulai:'03:30',selesai:'11:20'},blok2:{mulai:'11:20',selesai:'17:50'},blok3:{mulai:'17:50',selesai:'03:30'}},jadwal:{senin:{blok1:'Favian',blok2:'Kamal',blok3:'Yong'},ahad:{blok3:'Favian'}}};
const favian=A.applyAssignment(base,putra,{userName:'Favian',day:'senin',minutes:500});
assert.deepEqual(favian.programs.map(x=>x.id),['a','b','w']);
assert.equal(favian.programs[0].block,'Blok 1');assert.equal(favian.programs[0].assignedNaqib,'Favian');
const friday={blok:A.DEFAULT_BLOCKS,jadwal:{jumat:{blok1:'Favian',blok2:'Abi Dandi',blok3:'Abi Dandi'},sabtu:{blok1:'Kamal',blok2:'Yong',blok3:'Favian'}}};
assert.deepEqual(A.currentDuty(friday,{day:'jumat',minutes:18*60}),{blockId:'blok3',scheduleDay:'jumat',petugas:'Abi Dandi',mulai:'17:50',selesai:'03:30',timezone:'Asia/Jakarta'});
assert.deepEqual(A.currentDuty(friday,{day:'sabtu',minutes:2*60}),{blockId:'blok3',scheduleDay:'jumat',petugas:'Abi Dandi',mulai:'17:50',selesai:'03:30',timezone:'Asia/Jakarta'});
assert.equal(A.currentDuty(friday,{day:'sabtu',minutes:209}).scheduleDay,'jumat');
assert.equal(A.currentDuty(friday,{day:'sabtu',minutes:210}).blockId,'blok1');
assert.equal(A.currentDuty(friday,{day:'sabtu',minutes:680}).blockId,'blok2');
assert.equal(A.currentDuty(friday,{day:'sabtu',minutes:1070}).blockId,'blok3');
assert.equal(A.samePerson('Abi Dandi','Dandy'),true);assert.equal(A.samePerson('abi dandi','DANDY'),true);assert.equal(A.samePerson('Abi Dandi','Naqib Dandy'),true);assert.equal(A.samePerson('Kamal','Favian'),false);
assert.equal(A.applyAssignment(base,friday,{userName:'Dandy',day:'jumat',minutes:18*60}).onDuty,true);
const reward={rewardEligible:true,status:'EARNED',rewardStart:'2026-09-19T13:00:00+07:00',rewardEnd:'2026-09-20T11:00:00+07:00'};
const weekend=A.applyAssignment(base,friday,{userName:'Favian',day:'sabtu',minutes:18*60,reward,at:new Date('2026-09-19T18:00:00+07:00'),weekendResolver:W});
assert.equal(weekend.weekendMode,true);assert.deepEqual(weekend.programs,[]);assert.match(weekend.message,/Hak Libur Pilihan/);
const midnightBase=A.basePrograms(daily,[],new Date('2026-09-17T21:09:00+07:00'));
const kamalAfterMidnight=A.applyAssignment(midnightBase,{putra:{blok:A.DEFAULT_BLOCKS,jadwal:{kamis:{blok1:'Khaizuran',blok2:'Favian',blok3:'Kamal'},jumat:{blok1:'Favian',blok2:'Abi Dandi',blok3:'Abi Dandi'}}}},{userName:['u-03','Naqib kamal','Kamal'],day:'kamis',minutes:39});
assert(kamalAfterMidnight.programs.length>0,'00:39 Friday must render Thursday Block 3 programs for Kamal');
assert(kamalAfterMidnight.programs.every(program=>program.scheduleDay==='kamis'&&program.assignedNaqib==='Kamal'));
assert.equal(A.normalizeDutySchedule({blok:A.DEFAULT_BLOCKS,jadwal:{kamis:{blok1:'FIREBASE'}}}).jadwal.kamis.blok1,'FIREBASE');
assert.equal(A.normalizeDutySchedule({putra:{blok:A.DEFAULT_BLOCKS,jadwal:{kamis:{blok1:'FIREBASE_WRAPPER'}}}}).jadwal.kamis.blok1,'FIREBASE_WRAPPER');
const program=id=>base.find(row=>row.id===id);
assert.equal(A.stateFor(program('b'),base.indexOf(program('b')),base,300).id,'current');
assert.equal(A.stateFor(program('c'),base.indexOf(program('c')),base,300).id,'upcoming');
assert.equal(A.stateFor(program('a'),base.indexOf(program('a')),base,600).id,'past');
assert.equal(A.stateFor(program('d'),base.indexOf(program('d')),base,120).id,'current');
assert.equal(A.stateFor({id:'all',name:'Puasa',time:'Seharian'},0,[],500).id,'all-day');
const att=[{tanggal:'2026-09-14',programId:'a',unit:'Putra'},{tanggal:'2026-09-14',programId:'a',unit:'Putri'}];
assert.equal(A.attendanceDone(att,{id:'a',name:'Bangun'},'PUTRA'),true);
assert.equal(A.attendanceDone(att,{id:'b',name:'Pagi'},'PUTRA'),false);
const reports=[{tipeLaporan:'PROGRAM',versiLaporan:'V2',unitPengawasan:'Putri',naqib:'Abi Dandi',blokPiket:'Blok 1',programId:'p1',programName:'Program Putri A'}];
assert.equal(A.reportDone(reports,{id:'p1',name:'Program Putri A',block:'Blok 1'},'PUTRI','Dandy'),true);
assert.equal(A.reportDone(reports,{id:'p1',name:'Program Putri A'},'PUTRA'),false);
assert.equal(A.reportDone([{unitPengawasan:'Putri',naqib:'Abi Dandi',programId:'p1'}],{id:'p1',name:'Program Putri A'},'PUTRI','Dandy'),false,'legacy shift record is not a V2 occurrence marker');
assert.deepEqual(A.context({id:'a',name:'Bangun',time:'03.30–04.00',group:'Usrah 1',block:'Blok 1',blockId:'blok1',scheduleDay:'senin',assignedNaqib:'Favian'},{date:'2026-09-14',unit:'PUTRA',role:'NAQIB'}),{programId:'a',programName:'Bangun',tanggal:'2026-09-14',unit:'PUTRA',activeRole:'NAQIB',block:'Blok 1',blockId:'blok1',scheduleDay:'senin',assignedNaqib:'Favian',time:'03.30–04.00',group:'Usrah 1',location:''});
const assignment={unit:'PUTRA',programDomain:'',level:'',supervisedRoles:[],managedRoles:[],usrahIds:[],studentIds:[],divisionIds:[]};
assert.equal(N.canAccessRoute({mode:'canonical',activeRole:'NAQIB',activeAssignment:assignment},'naqib/program-hari-ini.html?v=208').ok,true);
assert.equal(N.canAccessRoute({mode:'canonical',activeRole:'GURU_PONDOK',activeAssignment:{...assignment,unit:'',programDomain:'KEPONDOKAN'}},'naqib/program-hari-ini.html?v=208').ok,false);
assert(ROUTES['naqib/program-hari-ini.html']);assert(R.ROLE_IDS.includes('NAQIBAH'));
console.log('PASS unit scope, PIC assignment, timeline states, operational status, context and direct-route guard');
