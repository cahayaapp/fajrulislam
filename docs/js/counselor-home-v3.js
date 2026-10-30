const {getDatabase,ref,get,query,orderByChild,startAt,endAt}=window.CahayaCounselorFirebaseV3;
const C=window.CahayaCounselorCaseV2;
const R=window.CahayaRoleSystemV2;
const db=getDatabase();
let user={};
try{user=JSON.parse(localStorage.getItem('cahayaCurrentUser')||'{}')||{}}catch{}
const session=R.resolveSession(user,localStorage);
const assignment=session.activeAssignment;
const identity=C.nameKey(user.uid||user.username||'');
const displayName=user.label||user.nama||user.displayName||user.username||'Konselor';

document.getElementById('greeting').textContent="Assalamu'alaikum, "+displayName;
document.getElementById('levelChip').textContent=assignment.level;
document.getElementById('unitChip').textContent=assignment.unit;

document.addEventListener('click',event=>{
  const button=event.target.closest('[data-menu]');
  if(!button)return;
  const menu=button.dataset.menu;
  if(parent!==window&&typeof parent.openAuthorizedMenu==='function'){
    parent.openAuthorizedMenu(menu);
    return;
  }
  const views={'menu-kasus-masuk':'cases','menu-buku-konseling':'book','menu-evaluasi-pelanggaran':'evaluation','menu-surat-peringatan':'warnings'};
  if(views[menu]&&R.can('KONSELOR',menu,assignment))location.href='konselor/workspace-v3.html?view='+views[menu]+'&v=10';
});

function names(value,out){
  if(typeof value==='string'){out.add(C.nameKey(value));return}
  if(Array.isArray(value)){value.forEach(item=>names(item,out));return}
  if(value&&typeof value==='object'){
    const label=value.nama||value.namaSantri||value.label;
    if(label)out.add(C.nameKey(label));
    else Object.values(value).forEach(item=>names(item,out));
  }
}

async function badge(){
  const element=document.getElementById('incomingBadge');
  const today=C.jakartaDate(),from='2019-01-01';
  const usrahKeys=assignment.unit==='PUTRI'?['Usrah 7','Usrah 8']:['Usrah 1','Usrah 2','Usrah 3','Usrah 4','Usrah 5','Usrah 6'];
  const ranged=(path,field,to=today)=>get(query(ref(db,path),orderByChild(field),startAt(from),endAt(to)));
  try{
    const snapshots=await Promise.all([
      ranged(C.ROOT,'tanggal'),
      ranged(C.PROGRAM_ATTENDANCE_ROOT,'tanggal'),
      ranged(C.LEARNING_ATTENDANCE_ROOT,'tanggal'),
      ranged('cahaya_app/laporan_penindakan','tanggalPenindakan'),
      ranged('cahaya_app/buku_kasus_konselor','waktuKonseling',today+'T23:59:59.999Z'),
      ...usrahKeys.map(key=>get(ref(db,'cahaya_app/master_usrah/'+key)))
    ]);
    const roster=new Set();
    snapshots.slice(5).forEach(snapshot=>names(snapshot.val(),roster));
    const primary=Object.entries(snapshots[0].val()||{}).map(([key,value])=>C.normalizeCase(value,key)).filter(row=>C.isViolation(row.raw));
    const attendance=[
      ...C.attendanceCases(snapshots[1].val()||{},'ABSENSI_PROGRAM'),
      ...C.attendanceCases(snapshots[2].val()||{},'ABSENSI_KBM')
    ];
    const handled=[...Object.values(snapshots[3].val()||{}),...Object.values(snapshots[4].val()||{})];
    const rows=[...primary,...C.excludeRepresented(attendance,handled)].filter(row=>row.unit?row.unit===assignment.unit:roster.has(row.studentKey));
    const count=rows.filter(row=>
      !C.FINAL_STATES.has(row.status)&&row.status!=='SELESAI'&&
      (row.routeLevel||C.routeCase(row,rows).level)===assignment.level&&
      (!row.assignedId||C.nameKey(row.assignedId)===identity)&&
      !(row.caseV2?.higherEscalation?.requestedAt&&!row.caseV2?.higherEscalation?.response?.respondedAt)
    ).length;
    element.textContent=count+' kasus aktif';
  }catch(error){
    console.warn('Badge Konselor belum tersedia',error);
    element.textContent='Buka daftar';
  }
}
badge();
setTimeout(()=>{const element=document.getElementById('incomingBadge');if(element.textContent==='Memuat…')element.textContent='Buka daftar'},10000);
