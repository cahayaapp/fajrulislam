/* Wali report: no writes, no roster lookup, no unscoped mentoring read. */
(() => {
  'use strict';
  const M=window.CahayaWaliMentoring,C=window.CahayaAssessmentRegistry;
  const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const results={TERCAPAI:'Tercapai',CUKUP_BERKEMBANG:'Cukup Berkembang',BELUM_TERCAPAI:'Belum Tercapai'};
  let child='',db,records=null,busy=false,partial=false,alive=true;
  const today=()=>M.date(new Date());
  const format=value=>value?new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',day:'numeric',month:'long',year:'numeric'}).format(new Date(value+'T12:00:00+07:00')):'—';
  function period(type){
    const end=today();let start=end.slice(0,8)+'01';
    if(type==='week'){const d=new Date(end+'T12:00:00+07:00');const dow=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Jakarta',weekday:'short'}).format(d);d.setUTCDate(d.getUTCDate()-['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].indexOf(dow));start=M.date(d)}
    $('mentoringStart').value=start;$('mentoringEnd').value=end;
  }
  function state(message,error=false){$('mentoringState').hidden=!message;$('mentoringState').textContent=message;$('mentoringState').dataset.uiTone=error?'error':'neutral'}
  function dimension(row,d){
    const clarified=row.clarified,old=row.legacyCahaya?.[d.name];
    const stored=clarified?.dimensions?.[d.id];
    const entries=d.indicators.map((i,index)=>{
      const raw=clarified?.answers?.[i.id]??stored?.values?.[i.id]??old?.indicators?.[index];
      const score=Number(raw),answer=Number.isInteger(score)&&score>=1&&score<=i.options.length?i.options[score-1]:null;
      return `<li><strong>${esc(i.label)}</strong><p>${esc(answer||'Belum tercatat pada sesi ini.')}</p></li>`;
    });
    return `<details class="wm-dimension"><summary>${esc(d.name)}</summary><ul>${entries.join('')}</ul>${stored?.note?`<p><strong>Catatan klarifikasi:</strong> ${esc(stored.note)}</p>`:''}</details>`;
  }
  function render(){
    const start=$('mentoringStart').value,end=$('mentoringEnd').value;
    if(!start||!end||start>end){state('Tanggal mulai harus sama dengan atau sebelum tanggal akhir.',true);return}
    const rows=M.select(records,child,start,end);
    $('mentoringReports').innerHTML=rows.map(row=>{
      const status=results[String(row.result?.status||'').replace(/ /g,'_').toUpperCase()]||'Belum Dinilai';
      const fields=[['Yang Disyukuri Pekan Ini',row.gratitude],['Fokus Pertumbuhan',row.target],['Mengapa Ini Penting',row.why],['Strategi Pekan Ini',row.strategy]];
      return `<article class="ui-record wm-report-card"><div class="wm-report-meta"><span class="ui-status">${esc(format(row.date))}</span>${row.focusType?`<span class="ui-status">${esc(row.focusType==='TINGKATKAN'?'Tingkatkan':row.focusType==='PERBAIKI'?'Perbaiki':row.focusType)}</span>`:''}</div><h2>${esc(row.student)}</h2><p>${esc([row.usrah,row.mentor&&'Mentor: '+row.mentor].filter(Boolean).join(' · '))}</p><div class="wm-reflection">${fields.map(([title,value])=>`<section><h3>${title}</h3><p>${esc(value||'Belum tercatat.')}</p></section>`).join('')}</div><h3>Klarifikasi CAHAYA</h3>${row.clarified||row.legacyCahaya?C.dimensions.map(d=>dimension(row,d)).join(''):'<p>Rincian CAHAYA belum tersedia pada catatan lama ini.</p>'}<section class="wm-result"><h3>Hasil Capaian Target</h3><span class="ui-status ${status==='Tercapai'?'success':'neutral'}">${status}</span>${row.result?.description?`<p>${esc(row.result.description)}</p>`:''}${row.result?.date?`<small>Dicatat ${esc(format(row.result.date))}</small>`:''}</section></article>`;
    }).join('');
    state(partial?'Sebagian catatan belum dapat dimuat. Silakan coba Lihat Laporan kembali.':rows.length?`${rows.length} sesi mentoring · ${format(start)} – ${format(end)}`:'Belum ada laporan mentoring pada rentang tanggal ini.',partial);
  }
  async function load(){
    if(busy||!child||!alive)return;
    if($('mentoringStart').value>$('mentoringEnd').value){state('Periksa kembali rentang tanggal.',true);return}
    busy=true;$('mentoringApply').disabled=true;state('Memuat laporan mentoring…');
    try{
      if(!records||partial){
        const snapshot=await CahayaWaliSession.readSnapshot(db,'cahaya_app/log_mentoring_naqib',{limit:160,noCache:true});if(!alive)return;
        partial=false;records=snapshot?.val?.()||{};
      }
      render();
    }catch(error){if(alive){console.error('Laporan mentoring Wali gagal dimuat',error);$('mentoringReports').replaceChildren();state('Laporan mentoring belum dapat dimuat. Periksa koneksi atau hak akses data, lalu coba Lihat Laporan kembali.',true)}}
    finally{busy=false;if(alive)$('mentoringApply').disabled=false}
  }
  async function init(){
    period('month');
    $('mentoringFilter').addEventListener('submit',e=>{e.preventDefault();load()});
    document.querySelectorAll('[data-period]').forEach(b=>b.onclick=()=>{period(b.dataset.period);load()});
    try{
      if(!firebase.apps.length)firebase.initializeApp(window.CAHAYA_CONFIG.firebase);
      db=firebase.database();
      const session=await CahayaWaliSession.ready({firestore:firebase.firestore(),database:db,auth:firebase.auth(),requireAuthAccess:true});
      const canonical=Number(session.account?.roleSystemVersion)===2;
      const role=canonical?window.CahayaRoleSystemV2.resolveSession(session.account,localStorage).activeRole:null;
      if(!session.valid||(canonical?role!=='WALI_SANTRI':!CahayaWaliSession.normalizeRoles(session.account).includes('wali'))){state('Akses ditolak. Buka laporan melalui akun Wali Santri.',true);return}
      // Identity is the linked session child, never a student supplied in the URL.
      child=CahayaWaliSession.studentName(session.student);
      if(!child){state('Ananda belum terhubung dengan akun Wali.',true);return}
      $('mentoringChild').textContent=child;await load();
    }catch(error){console.error(error);state('Sesi Wali belum dapat dimuat. Silakan buka kembali dari Beranda Wali.',true)}
  }
  addEventListener('pagehide',()=>{alive=false;records=null});
  init();
})();
