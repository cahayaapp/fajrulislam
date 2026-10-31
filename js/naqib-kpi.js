import {initializeApp,getApps} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {getDatabase,ref,get,query,orderByChild,equalTo} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const context=window.cahayaRoleContext;
if(context)context.assertCurrent();
const profile=(()=>{try{return JSON.parse(localStorage.getItem('cahayaCurrentUser')||'{}')||{}}catch{return{}}})();
const activeRole=context?.activeRole||'';
const unit=context?.unit||'';
const displayName=String(profile.label||profile.nama||profile.username||'Naqib').replace(/^Naqib(ah)?\s+/i,'').trim();
const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const $=id=>document.getElementById(id);
const app=getApps()[0]||initializeApp(window.CAHAYA_CONFIG.firebase);
const db=getDatabase(app);
const jakartaMonth=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit'}).format(new Date()).slice(0,7);

$('kpiRole').textContent=activeRole==='NAQIBAH'?'Naqibah':'Naqib';
$('kpiUnit').textContent=unit==='PUTRI'?'Putri':'Putra';
$('kpiName').textContent=displayName||'Naqib';
$('kpiMonth').value=jakartaMonth();
$('refreshKpi').addEventListener('click',loadKpi);
$('kpiMonth').addEventListener('change',loadKpi);

function rowTime(row){return String(row?.tanggalSubmit||row?.timestamp||'')}
function render(rows){
  const latest=rows.slice().sort((a,b)=>rowTime(b).localeCompare(rowTime(a)))[0];
  $('latestScore').textContent=latest&&Number.isFinite(Number(latest.skorAkhir))?`${Number(latest.skorAkhir).toFixed(1)}%`:'—';
  $('latestWeek').textContent=latest?.periodePekan||'Belum tersedia';
  $('latestPredicate').textContent=latest?.predikat||'Belum ada evaluasi';
  $('latestNote').textContent=latest?'Hasil terbaru dari Self Asesmen pekanan Anda pada periode terpilih.':'Isi Self Asesmen Naqib untuk melihat hasil evaluasi pekanan di sini.';
  $('weekList').innerHTML=[1,2,3,4].map(no=>{
    const row=rows.filter(item=>String(item.periodePekan)===`Pekan ${no}`).sort((a,b)=>rowTime(b).localeCompare(rowTime(a)))[0];
    const score=row&&Number.isFinite(Number(row.skorAkhir))?`${Number(row.skorAkhir).toFixed(1)}%`:'—';
    return `<article class="week-card"><span class="week-icon">P${no}</span><span class="week-copy"><b>Pekan ${no}</b><small>${row?.predikat||'Belum diisi'}</small></span><span class="week-score ${row?'':'empty'}">${score}</span></article>`;
  }).join('');
}

async function loadKpi(){
  const month=$('kpiMonth').value||jakartaMonth(),state=$('kpiState');
  $('kpiPage').classList.add('kpi-loading');state.textContent='Memuat hasil Self Asesmen pada periode ini…';state.dataset.tone='';
  try{
    if(context)context.assertCurrent();
    const snap=await get(query(ref(db,'cahaya_app/self_asesmen_naqib'),orderByChild('periodeBulan'),equalTo(month)));
    if(context)context.assertCurrent();
    // Muhasabah V2 sengaja tidak memiliki skor formal. KPI hanya menampilkan
    // record legacy yang memang sudah memiliki hasil perhitungan resmi.
    const rows=Object.values(snap.val()||{}).filter(row=>norm(row?.namaNaqib)===norm(displayName)&&Number.isFinite(Number(row?.skorAkhir)));
    render(rows);state.textContent=rows.length?`${rows.length} catatan pekanan ditemukan.`:'Belum ada Self Asesmen pada periode ini.';state.dataset.tone=rows.length?'success':'';
  }catch(error){console.error(error);render([]);state.textContent='Data KPI belum dapat dimuat. Periksa koneksi lalu coba lagi.';state.dataset.tone='danger';}
  finally{$('kpiPage').classList.remove('kpi-loading')}
}
loadKpi();
