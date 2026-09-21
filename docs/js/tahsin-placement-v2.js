/* Tahsin membership comes from the Guru menu roster; this page assigns levels only. */
import {initializeApp,getApps,getApp} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {getDatabase,ref,get,runTransaction} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

const A=window.CahayaStudentProgramApplicability,R=window.CahayaRoleSystemV2,Q=window.CahayaQuranMenuRoster;
const context=window.cahayaRoleContext,assignment=context?.assignment||{};
const $=id=>document.getElementById(id);
const LEVELS={LEVEL_1:'Level 1 • Tahsin Praktek',LEVEL_2:'Level 2 • Tahsin Teori',LEVEL_3:'Level 3 • Tahsin Praktek'};
const state={students:[],classes:{},programs:{},busy:false,loaded:false,suspended:false,pending:null};
let db;
const scoped=()=>!state.suspended&&R.canManageTahsinLevels(context?.activeRole,assignment);
function assertAccess(){
  context?.assertCurrent?.();
  if(!scoped())throw Error('Akses penempatan level tidak sesuai penugasan aktif.');
}
function inUnit(className){
  if(!A.isExplicitClass(className))return false;
  const unit=/\bPutra\b/i.test(className)?'PUTRA':/\bPutri\b/i.test(className)?'PUTRI':'';
  return !!unit&&(assignment.unit==='ALL'||unit===assignment.unit);
}
function today(){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const p=Object.fromEntries(parts.map(item=>[item.type,item.value]));return p.year+'-'+p.month+'-'+p.day;
}
function validDate(value){
  return /^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
}
const dateLabel=value=>new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',day:'numeric',month:'long',year:'numeric'}).format(new Date(value+'T12:00:00+07:00'));
function status(message,error=false){$('status').textContent=message;$('status').className='status '+(error?'error':'success');}
function levelFor(row){
  return A.getQuranProgramPlacement(row.name,today(),{[row.storageKey]:row.record},null,
    {classes:state.classes,className:row.className,current:true}).tahsinLevel||'';
}
function rebuildStudents(){
  const checked=new Set(state.students.filter(row=>row.checked).map(row=>row.key));
  const classes=Object.keys(state.classes).filter(inUnit);
  state.students=Q.rows(state.classes,classes,'Tahsin',state.programs).map(row=>({
    key:row.key,storageKey:row.storageKey,name:row.nama,className:row.kelas,record:row.record,checked:checked.has(row.key)
  }));
}
function matches(row){
  const search=A.key($('search').value),className=$('classSelect').value,level=$('levelFilter').value;
  return (!search||A.key(row.name).includes(search))&&(!className||row.className===className)&&
    (!level||(level==='UNSET'?!levelFor(row):levelFor(row)===level));
}
function updateSelection(){
  const visible=state.students.filter(matches),selected=state.students.filter(row=>row.checked);
  const hidden=selected.filter(row=>!matches(row)).length;
  const all=visible.length&&visible.every(row=>row.checked);
  $('selectAll').textContent=all?'Hapus Centang yang Terlihat':'Centang Semua yang Terlihat';
  $('selectAll').disabled=state.busy||!visible.length;
  $('save').disabled=state.busy||!selected.length;
  $('placementAction').hidden=!selected.length;
  $('selectionSummary').textContent=selected.length?selected.length+' santri terpilih'+(hidden?' • '+hidden+' di luar filter saat ini':''):'';
  if(state.loaded)$('loading').textContent=visible.length+' dari '+state.students.length+' santri ditampilkan';
}
function render(){
  const summary=$('summary');summary.replaceChildren();
  const values=[['Santri Tahsin',state.students.length],['Belum Ditentukan',state.students.filter(row=>!levelFor(row)).length],
    ...Object.keys(LEVELS).map(level=>['Level '+level.slice(-1),state.students.filter(row=>levelFor(row)===level).length])];
  values.forEach(([label,count])=>{const chip=document.createElement('span');chip.textContent=label+': '+count;summary.append(chip);});
  const list=$('studentList');list.replaceChildren();
  for(const row of state.students.filter(matches)){
    const label=document.createElement('label');label.className='student';label.dataset.key=row.key;
    const input=document.createElement('input');input.type='checkbox';input.checked=row.checked;input.disabled=state.busy;
    input.addEventListener('change',()=>{row.checked=input.checked;updateSelection();});
    const copy=document.createElement('span'),name=document.createElement('b'),detail=document.createElement('small');
    name.textContent=row.name;detail.textContent=row.className+' • '+(LEVELS[levelFor(row)]||'Belum Ditentukan');
    copy.append(name,detail);
    const scheduled=A.date(row.record.effectiveFrom);
    if(scheduled>today()&&LEVELS[row.record.tahsinLevel]){
      const note=document.createElement('small');note.textContent='Terjadwal: '+LEVELS[row.record.tahsinLevel]+' mulai '+dateLabel(scheduled);copy.append(note);
    }
    label.append(input,copy);list.append(label);
  }
  if(!list.children.length){const empty=document.createElement('p');empty.className='hint';empty.textContent=state.students.length?'Tidak ada santri yang sesuai filter.':'Belum ada santri pada daftar Tahsin unit ini.';list.append(empty);}
  updateSelection();
}
async function load(){
  try{
    assertAccess();
    const [programSnap,classSnap]=await Promise.all([
      get(ref(db,'cahaya_app/program_quran_santri')),get(ref(db,'cahaya_app/master_akademik/kelas'))
    ]);
    assertAccess();
    state.classes=classSnap.exists()?classSnap.val():(window.CAHAYA_MASTER_DATA?.santriByClass||{});
    state.programs=programSnap.val()||{};
    rebuildStudents();
    const select=$('classSelect');select.replaceChildren(new Option('Semua Kelas',''));
    Object.keys(state.classes).filter(inUnit).sort((a,b)=>a.localeCompare(b,'id',{numeric:true}))
      .forEach(name=>select.append(new Option(name,name)));
    state.loaded=true;setBusy(false);render();
    const discrepancies=A.auditRoster(state.classes).filter(item=>inUnit(item.className)&&!item.ok);
    if(discrepancies.length)status('Master santri berbeda dari daftar terkonfirmasi: '+discrepancies.map(item=>item.className+' ('+item.tahsin+'/'+item.expected+' Tahsin)').join(', ')+'. Periksa master; tidak ada identitas santri baru yang dibuat.',true);
  }catch(error){console.error('Santri Tahsin gagal dimuat:',error);$('loading').textContent='Santri Tahsin gagal dimuat.';status('Gagal memuat daftar santri Tahsin. Silakan buka ulang halaman.',true);}
}
function setBusy(value){
  state.busy=value;
  for(const id of ['search','classSelect','levelFilter','placementSelect','effectiveDate'])$(id).disabled=value||!state.loaded;
  $('save').textContent=value?'Menyimpan...':'Simpan Penempatan Level';
  $('studentList').querySelectorAll('input').forEach(input=>input.disabled=value);
  updateSelection();
}
function placementHistory(old){
  const history=(Array.isArray(old?.history)?old.history:Object.values(old?.history||{})).filter(item=>item&&typeof item==='object').map(item=>({...item}));
  if(old?.programQuran){
    const effectiveFrom=A.date(old.effectiveFrom||old.berlakuMulai);
    const previous={effectiveFrom,programQuran:old.programQuran,tahsinLevel:old.tahsinLevel||''};
    if(!history.some(item=>A.date(item.effectiveFrom||item.berlakuMulai)===effectiveFrom&&item.programQuran===previous.programQuran&&item.tahsinLevel===previous.tahsinLevel))
      history.push({...previous,...(old.updatedAt?{updatedAt:old.updatedAt}:{}),...(old.updatedBy?{updatedBy:old.updatedBy}:{})});
  }
  return history;
}
function requestSave(){
  if(state.busy||state.pending)return;
  try{assertAccess();}catch(error){return status(error.message,true);}
  const selected=state.students.filter(row=>row.checked),level=$('placementSelect').value,effectiveFrom=$('effectiveDate').value;
  if(!selected.length)return status('Centang minimal satu santri.',true);
  if(!LEVELS[level]||!validDate(effectiveFrom))return status('Pilih level dan tanggal berlaku yang valid.',true);
  state.pending={selected,level,effectiveFrom};
  $('confirmText').textContent='Anda akan menempatkan '+selected.length+' santri ke '+LEVELS[level]+' mulai '+dateLabel(effectiveFrom)+'.';
  $('confirmDialog').showModal();
}
function cancelSave(){state.pending=null;$('confirmDialog').close();}
async function save(){
  if(state.busy||!state.pending)return;
  const {selected,level,effectiveFrom}=state.pending;
  state.pending=null;$('confirmDialog').close();setBusy(true);
  let saved=0,failed=0;
  try{
    assertAccess();
    const classes=[...new Set(selected.map(row=>row.className))];
    if(classes.some(name=>!inUnit(name)))throw Error('Kelas berada di luar unit penugasan.');
    const snapshots=await Promise.all(classes.map(name=>get(ref(db,'cahaya_app/master_akademik/kelas/'+name))));
    assertAccess();
    const liveClasses=Object.fromEntries(classes.map((name,index)=>[name,snapshots[index].exists()?snapshots[index].val():state.classes[name]]));
    let user={};try{user=JSON.parse(localStorage.getItem('cahayaCurrentUser')||'{}')||{};}catch{}
    const actor=user.label||user.nama||user.username||'',stamp=new Date().toISOString(),queue=selected.slice();
    const worker=async()=>{
      while(queue.length){
        const row=queue.shift();
        try{
          assertAccess();
          const result=await runTransaction(ref(db,'cahaya_app/program_quran_santri/'+row.storageKey),old=>{
            assertAccess();
            // Revalidate current membership with the same Guru menu resolver, never with level.
            if(!Q.rows(liveClasses,[row.className],'Tahsin',{[row.key]:old||{}}).some(item=>item.key===row.key))return;
            const history=placementHistory(old);
            const same=history.filter(item=>A.date(item.effectiveFrom||item.berlakuMulai)===effectiveFrom).at(-1);
            if(!same||same.programQuran!=='Tahsin'||same.tahsinLevel!==level)
              history.push({effectiveFrom,programQuran:'Tahsin',tahsinLevel:level,updatedAt:stamp,updatedBy:actor});
            // Stable ordering retains prior same-date revisions; the newest revision wins.
            history.sort((a,b)=>A.date(a.effectiveFrom||a.berlakuMulai).localeCompare(A.date(b.effectiveFrom||b.berlakuMulai)));
            const latest=history.at(-1);
            return {...old,namaSantri:row.name,kelasAkademik:row.className,history,
              programQuran:'Tahsin',tahsinLevel:latest.tahsinLevel||level,effectiveFrom:latest.effectiveFrom||effectiveFrom,
              updatedAt:stamp,updatedBy:actor};
          },{applyLocally:false});
          if(!result.committed){failed++;continue;}
          state.programs[row.storageKey]=result.snapshot.val();row.checked=false;saved++;
        }catch(error){console.error('Penempatan level gagal:',error);failed++;}
        status('Menyimpan... '+(saved+failed)+'/'+selected.length);
      }
    };
    await Promise.all(Array.from({length:Math.min(5,selected.length)},worker));
    rebuildStudents();render();
    status(failed?saved+' berhasil; '+failed+' gagal disimpan. Santri yang gagal tetap tercentang.':
      saved+' santri berhasil ditempatkan ke '+LEVELS[level]+'.',failed>0);
  }catch(error){console.error('Penempatan Tahsin gagal:',error);status('Penempatan gagal disimpan. '+error.message,true);}
  finally{setBusy(false);}
}
if(scoped()){
  db=getDatabase(getApps().length?getApp():initializeApp(window.CAHAYA_CONFIG.firebase));
  $('scopeLabel').textContent='Unit '+(assignment.unit==='ALL'?'Putra dan Putri':assignment.unit==='PUTRA'?'Putra':'Putri');
  $('effectiveDate').value=today();
  for(const id of ['classSelect','levelFilter'])$(id).addEventListener('change',render);
  $('search').addEventListener('input',render);
  $('selectAll').addEventListener('click',()=>{
    if(state.busy)return;
    const visible=state.students.filter(matches),check=!visible.every(row=>row.checked);
    visible.forEach(row=>row.checked=check);render();
  });
  $('save').addEventListener('click',requestSave);
  $('cancelSave').addEventListener('click',cancelSave);
  $('confirmSave').addEventListener('click',save);
  $('confirmDialog').addEventListener('cancel',()=>{state.pending=null;});
  $('confirmDialog').addEventListener('click',event=>{if(event.target===$('confirmDialog')){
    const box=$('confirmDialog').getBoundingClientRect();
    if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)cancelSave();
  }});
  addEventListener('cahaya:suspend',()=>{state.suspended=true;cancelSave();setBusy(true);});
  load();
}else status('Akses hanya untuk Manajer atau Supervisor Pendidikan sesuai penugasan.',true);
