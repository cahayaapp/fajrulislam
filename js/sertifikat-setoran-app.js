import{initializeApp,getApps}from'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import{getDatabase,ref,get,query,orderByChild,equalTo,set,push,orderByKey,limitToLast,endBefore,startAt}from'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
const C=window.CahayaSetoranCertificate,$=id=>document.getElementById(id),R=window.CahayaRoleSystemV2;
const user=JSON.parse(localStorage.getItem('cahayaCurrentUser')||'{}'),session=R.resolveSession(user,localStorage);
if(session.activeRole!=='GURU_PONDOK')throw Error('Fitur sertifikat hanya tersedia untuk Guru Pondok.');
const teacherKey=String(user.uid||user.authUid||user.username||user.email||'').trim();if(!teacherKey)throw Error('Identitas guru belum tersedia. Silakan masuk kembali.');
const db=getDatabase(getApps()[0]||initializeApp(window.CAHAYA_CONFIG.firebase)),PATH='cahaya_app/sertifikat_setoran_sekali_duduk',MASTER='cahaya_app/master_akademik/kelas';
let roster=[],records=[],saved=null,pendingId='',busy=false;
let historyCursor=null,historyFallback=false,historyBusy=false;
const more=document.createElement('button');more.type='button';more.className='secondary';more.textContent='Muat riwayat lebih lama';more.hidden=true;$('history').after(more);
const historyNote=document.createElement('p');historyNote.className='hint';more.after(historyNote);
function historyDate(value){try{return C.dateLabel(value)}catch{return 'Tanggal belum lengkap'}}
async function loadHistory(reset=true){
 if(historyBusy)return;historyBusy=true;more.disabled=true;
 try{active();if(reset){historyCursor=null;historyFallback=false}
 let snap;
 if(!historyFallback){try{
  const clauses=[orderByChild('guruKey'),limitToLast(51)];
  if(historyCursor)clauses.push(startAt(teacherKey),endBefore(teacherKey,historyCursor));else clauses.push(equalTo(teacherKey));
  snap=await get(query(ref(db,PATH),...clauses));
 }catch(e){if(!/index/i.test(String(e.message||e)))throw e;historyFallback=true}}
 if(historyFallback){const clauses=[orderByKey(),limitToLast(51)];if(historyCursor)clauses.push(endBefore(historyCursor));snap=await get(query(ref(db,PATH),...clauses))}
 active();const entries=Object.entries(snap.val()||{}).sort(([a],[b])=>a.localeCompare(b));
 more.hidden=entries.length<=50;const page=entries.slice(-50);historyCursor=page[0]?.[0]||historyCursor;
 const own=page.filter(([,r])=>r&&typeof r==='object'&&r.guruKey===teacherKey).map(([id,r])=>({...r,id}));
 records=[...new Map([...(reset?[]:records),...own].map(r=>[r.id,r])).values()];renderHistory();
 historyNote.textContent=historyFallback&&!more.hidden?'Riwayat dimuat bertahap. Tekan tombol untuk mencari sertifikat Anda yang lebih lama.':'';
 }catch(e){if(!records.length)$('history').textContent='Riwayat belum tersedia. Coba muat ulang data.';historyNote.textContent='Riwayat belum dapat dimuat: '+(e.message||'Periksa koneksi internet.');$('retry').hidden=false;console.error('Riwayat sertifikat',e)}
 finally{historyBusy=false;more.disabled=false}
}
more.onclick=()=>loadHistory(false);

$('date').value=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function status(message,error=false){$('status').textContent=message;$('status').classList.toggle('error',error)}
function active(){const now=R.resolveSession(JSON.parse(localStorage.getItem('cahayaCurrentUser')||'{}'),localStorage);if(now.activeRole!=='GURU_PONDOK')throw Error('Peran aktif berubah. Buka kembali fitur dari akun guru.');const current=JSON.parse(localStorage.getItem('cahayaCurrentUser')||'{}');if(String(current.uid||current.authUid||current.username||current.email||'')!==teacherKey)throw Error('Akun aktif berubah. Muat ulang halaman.');}
function options(){
 const selected=$('student').value;
 $('student').replaceChildren(new Option('-- Pilih santri --',''));
 roster.forEach(s=>$('student').add(new Option(`${s.nama} • ${s.kelas}`,s.key)));
 $('student').value=selected;searchStudents();
}
function searchStudents(){
 const normalize=value=>String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
 const q=normalize($('search').value),tokens=q.split(/\s+/).filter(Boolean),host=$('searchResults');host.replaceChildren();host.hidden=!q;
 if(!q){$('searchCount').textContent=`${roster.length} santri tersedia. Ketik untuk mencari.`;return}
 const matches=roster.filter(s=>tokens.every(token=>normalize(`${s.nama} ${s.kelas}`).includes(token)));
 $('searchCount').textContent=matches.length?`${matches.length} santri ditemukan. Pilih nama di bawah.`:'Tidak ada santri yang cocok. Coba nama atau kelas lain.';
 matches.slice(0,30).forEach(s=>{const btn=document.createElement('button');btn.type='button';btn.className='ssd-result';const name=document.createElement('span');name.textContent=s.nama;const detail=document.createElement('small');detail.textContent=s.kelas;btn.append(name,detail);btn.onclick=()=>{if(busy)return;$('student').value=s.key;$('student').dispatchEvent(new Event('input',{bubbles:true}));$('search').value=s.nama;host.hidden=true;$('searchCount').textContent=`Dipilih: ${s.nama} • ${s.kelas}`;$('student').focus()};host.append(btn)});
 if(matches.length>30){const note=document.createElement('p');note.className='hint';note.textContent='Menampilkan 30 hasil pertama. Ketik nama lebih lengkap untuk mempersempit pencarian.';host.append(note)}
}
async function download(record){active();const blob=await C.pdf(record),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`Sertifikat-${record.nama.replace(/[^a-z0-9]+/gi,'-')}-${record.tanggal}-${record.id}.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000)}
function renderHistory(){const host=$('history');host.replaceChildren();if(!records.length){host.textContent='Belum ada sertifikat tersimpan.';return}records.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).forEach(r=>{const item=document.createElement('article');item.className='record';const name=document.createElement('b');name.textContent=r.nama;const detail=document.createElement('small');detail.textContent=`${r.kelas} • ${r.jumlahJuz} juz • ${historyDate(r.tanggal)} • Nilai ${r.nilai}`;const btn=document.createElement('button');btn.type='button';btn.className='secondary';btn.textContent='Unduh PDF';btn.onclick=async()=>{btn.disabled=true;try{await download(r)}catch(e){status(e.message,true)}finally{btn.disabled=false}};item.append(name,detail,btn);host.append(item)})}
async function load(){active();$('retry').hidden=true;try{const master=await get(ref(db,MASTER));roster=C.students(master.val()||{});options();$('student').disabled=$('search').disabled=!roster.length;$('save').disabled=!roster.length;status(roster.length?'Pilih santri dan isi pencapaian setoran.':'Database santri belum tersedia. Hubungi admin.');}catch(e){status('Gagal memuat database santri. Coba muat ulang.',true);$('retry').hidden=false}await loadHistory()}
$('search').oninput=searchStudents;$('retry').onclick=load;
$('form').addEventListener('input',e=>{if(e.target.id==='search')return;saved=null;$('download').hidden=true;$('preview').replaceChildren()});
$('form').onsubmit=async event=>{event.preventDefault();if(busy)return;if(saved){status('Data ini sudah tersimpan. Gunakan tombol Unduh PDF.');return;}busy=true;$('form').querySelectorAll('input,select,button').forEach(el=>el.disabled=true);try{active();const input={studentKey:$('student').value,jumlahJuz:$('juz').value,nilai:$('nilai').value,tanggal:$('date').value};const live=await get(ref(db,MASTER));const data=C.validate(input,C.students(live.val()||{}));active();pendingId=pendingId||push(ref(db,PATH)).key;const record={...data,id:pendingId,nomor:`SSD/${data.tanggal.slice(0,4)}/${pendingId}`,guruKey:teacherKey,guruNama:user.nama||user.label||user.displayName||user.username,institution:window.CAHAYA_CONFIG.app?.institutionName||'Pesantren Cahaya Fajrul Islam',createdAt:new Date().toISOString(),version:1};status('Menyimpan pencapaian…');await set(ref(db,`${PATH}/${pendingId}`),record);saved=record;pendingId='';records=records.filter(r=>r.id!==record.id);records.unshift(record);renderHistory();$('download').hidden=false;status('Data berhasil disimpan. Sertifikat siap diunduh.');try{$('preview').replaceChildren(await C.canvas(record))}catch(e){status('Data tersimpan. Pratinjau belum tersedia; coba unduh PDF.',true)}}catch(e){status(e.message||'Gagal menyimpan. Silakan coba lagi.',true)}finally{busy=false;$('form').querySelectorAll('input,select,button').forEach(el=>el.disabled=false);$('save').disabled=!roster.length}};
$('download').onclick=async()=>{if(!saved)return;$('download').disabled=true;try{await download(saved)}catch(e){status(e.message,true)}finally{$('download').disabled=false}};
load();
