/* Wali report: no writes, no roster lookup, no unscoped mentoring read. */
(() => {
  'use strict';
  const M=window.CahayaWaliMentoring,C=window.CahayaAssessmentRegistry;
  const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const results={TERCAPAI:'Tercapai',CUKUP_BERKEMBANG:'Cukup Berkembang',BELUM_TERCAPAI:'Belum Tercapai'};
  let child='',db,records=null,busy=false,partial=false,alive=true;
  const format=value=>value?new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',day:'numeric',month:'long',year:'numeric'}).format(new Date(value+'T12:00:00+07:00')):'—';
  const dateParts=value=>{const date=new Date(value+'T12:00:00+07:00'),parts=new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',day:'2-digit',month:'short'}).formatToParts(date),map=Object.fromEntries(parts.map(x=>[x.type,x.value]));return{day:map.day||'—',month:map.month||''}};
  function state(message,error=false){$('mentoringState').hidden=!message;$('mentoringState').textContent=message;$('mentoringState').dataset.uiTone=error?'error':'neutral'}
  function dimension(row,d){
    const clarified=row.clarified,old=row.legacyCahaya?.[d.name];
    const stored=clarified?.dimensions?.[d.id];
    const entries=d.indicators.map((i,index)=>{
      const raw=clarified?.answers?.[i.id]??stored?.values?.[i.id]??old?.indicators?.[index];
      const score=Number(raw),answer=Number.isInteger(score)&&score>=1&&score<=i.options.length?i.options[score-1]:null;
      return `<li><strong>${esc(i.label)}</strong><p>${esc(answer||'Belum tercatat pada sesi ini.')}</p></li>`;
    });
    return `<details class="wm-dimension"><summary>${esc(d.name)}</summary><ul>${entries.join('')}</ul>${stored?.note?`<p class="wm-dimension-note"><strong>Catatan observasi:</strong> ${esc(stored.note)}</p>`:''}</details>`;
  }
  function render(){
    const rows=M.select(records,child,'0000-01-01','9999-12-31').slice(0,5);
    $('mentoringReports').innerHTML=rows.map(row=>{
      const status=results[String(row.result?.status||'').replace(/ /g,'_').toUpperCase()]||'Belum Dinilai';
      const improving=String(row.focusType||'').toUpperCase()==='TINGKATKAN',focus=improving?'Peningkatan':'Perbaikan',parts=dateParts(row.date);
      const targetFields=[[`Target ${focus}`,row.target],['Makna Target bagi Ananda',row.why],[`Strategi ${focus}`,row.strategy]];
      return `<details class="ui-record wm-document">
        <summary class="wm-card-summary">
          <span class="wm-summary-date"><strong>${esc(parts.day)}</strong><span>${esc(parts.month)}</span></span>
          <span class="wm-summary-main"><small>Laporan Perkembangan Karakter Cahaya Pekanan</small><strong>${esc(format(row.date))}</strong></span>
        </summary>
        <div class="wm-document-body">
          <section class="wm-identity" aria-label="Identitas laporan mentoring">
            <div class="wm-identity-item"><span>Nama Santri</span><strong>${esc(row.student)}</strong></div>
            <div class="wm-identity-item"><span>Tim Mentor</span><strong>${esc(row.mentor||'—')}</strong></div>
          </section>
          <div class="wm-reflection wm-reflection-single"><section><h3>Yang Paling Disyukuri</h3><p>${esc(row.gratitude||'Belum tercatat.')}</p></section></div>
          <section class="wm-section">
            <h2 class="wm-section-title"><span class="wm-section-number">01</span>Hasil Observasi Karakter Cahaya</h2>
            <p class="wm-section-subtitle">Gambaran perkembangan karakter yang dicatat Tim Mentor selama proses pendampingan dan telah melalui proses klarifikasi atau wawancara langsung oleh Mentor dengan Ananda.</p>
            <div class="wm-dimensions">${row.clarified||row.legacyCahaya?C.dimensions.map(d=>dimension(row,d)).join(''):'<p>Hasil observasi karakter belum tersedia pada catatan lama ini.</p>'}</div>
          </section>
          <section class="wm-section">
            <h2 class="wm-section-title"><span class="wm-section-number">02</span>Target dan Hasil</h2>
            <div class="wm-target-details">${targetFields.map(([title,value])=>`<section class="wm-target-item"><strong>${esc(title)}</strong><p>${esc(value||'Belum tercatat.')}</p></section>`).join('')}</div>
            <section class="wm-result">
              <div class="wm-result-grid"><div class="wm-result-target"><strong>Hasil Capaian Target</strong><p>${esc(row.result?.description||'Hasil target belum dicatat oleh Tim Mentor.')}</p></div><div class="wm-result-status"><span class="ui-status ${status==='Tercapai'?'success':'neutral'}">${status}</span>${row.result?.date?`<small>Dinilai ${esc(format(row.result.date))}</small>`:''}</div></div>
            </section>
          </section>
          <footer class="wm-document-note"><div><strong>Keterangan dokumen</strong><br>Dokumen digital ini disusun berdasarkan catatan hasil observasi dan pendampingan Tim Mentor Pesantren Cahaya Fajrul Islam melalui CAHAYA APP.</div></footer>
        </div>
      </details>`;
    }).join('');
    state(partial?'Sebagian catatan belum dapat dimuat. Silakan buka kembali halaman ini.':rows.length?`Menampilkan ${rows.length} mentoring terbaru.`:'Belum ada laporan mentoring untuk ananda.',partial);
  }
  async function load(){
    if(busy||!child||!alive)return;
    busy=true;state('Memuat 5 mentoring terbaru…');
    try{
      if(!records||partial){
        const snapshot=await CahayaWaliSession.readSnapshot(db,'cahaya_app/log_mentoring_naqib',{limit:160,noCache:true});if(!alive)return;
        partial=false;records=snapshot?.val?.()||{};
      }
      render();
    }catch(error){if(alive){console.error('Laporan mentoring Wali gagal dimuat',error);$('mentoringReports').replaceChildren();state('Laporan mentoring belum dapat dimuat. Periksa koneksi atau hak akses data, lalu coba Lihat Laporan kembali.',true)}}
    finally{busy=false}
  }
  async function init(){
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
      await load();
    }catch(error){console.error(error);state('Sesi Wali belum dapat dimuat. Silakan buka kembali dari Beranda Wali.',true)}
  }
  addEventListener('pagehide',()=>{alive=false;records=null});
  init();
})();
