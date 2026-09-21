/* Level placement extends the existing program_quran_santri record. */
(() => {
  const A = window.CahayaStudentProgramApplicability;
  if (!A) return;
  const ready = async () => {
    const panel = document.querySelector('.filters'), program = document.getElementById('quran');
    const save = document.getElementById('save'), source = document.getElementById('source');
    if (!panel || !program || !save || !source) return;
    const levelField = document.createElement('div');
    levelField.className = 'field';
    levelField.innerHTML = '<label for="tahsinLevel">Level Tahsin</label><select class="control" id="tahsinLevel"><option value="">Pilih level</option><option value="LEVEL_1">Level 1 • Praktek</option><option value="LEVEL_2">Level 2 • Teori</option><option value="LEVEL_3">Level 3 • Praktek</option></select>';
    const dateField = document.createElement('div');
    dateField.className = 'field';
    dateField.innerHTML = '<label for="programEffectiveDate">Berlaku mulai</label><input class="control" type="date" id="programEffectiveDate"><small style="display:block;margin-top:5px;color:#7890ad">Riwayat bulan sebelumnya tetap mengikuti penempatan pada tanggalnya.</small>';
    panel.append(levelField, dateField);
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const local=Object.fromEntries(parts.map(part=>[part.type,part.value]));
    const today=`${local.year}-${local.month}-${local.day}`;
    dateField.querySelector('input').value = today;
    const refresh = () => { levelField.hidden = program.value !== 'Tahsin'; dateField.hidden = !program.value; };
    program.addEventListener('change', refresh); refresh();

    document.addEventListener('click', async event => {
      if (event.target !== save || !program.value) return;
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      if (save.disabled) return;
      const names=[...document.querySelectorAll('#list [data-name]:checked')].map(node=>node.dataset.name);
      const from=source.value,to=document.getElementById('destination').value;
      const chosenLevel=levelField.querySelector('select').value;
      const effectiveFrom=dateField.querySelector('input').value;
      const toast = message => { const el=document.getElementById('toast');el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),3000); };
      if (!names.length) return toast('Pilih santri yang akan ditempatkan.');
      if (program.value==='Tahsin' && !A.level(chosenLevel)) return toast('Pilih Level 1, 2, atau 3.');
      if (!A.date(effectiveFrom)) return toast('Pilih tanggal mulai yang sah.');
      save.disabled=true;save.textContent='Menyimpan...';
      try {
        const {initializeApp,getApps,getApp}=await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const {getDatabase,ref,get,update,push}=await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
        const app=getApps().length?getApp():initializeApp(window.CAHAYA_CONFIG.firebase),db=getDatabase(app);
        const [classSnap,programSnap]=await Promise.all([
          get(ref(db,'cahaya_app/master_akademik/kelas')),
          get(ref(db,'cahaya_app/program_quran_santri'))
        ]);
        const classes=classSnap.val()||{};
        if(to){
          Object.keys(classes).forEach(name=>{const list=Array.isArray(classes[name])?classes[name]:Object.values(classes[name]||{});classes[name]=list.filter(student=>!names.includes(student));});
          classes[to]=[...new Set([...(classes[to]||[]),...names])].sort((a,b)=>a.localeCompare(b,'id'));
        }
        const old=programSnap.val()||{},updates={},stamp=new Date().toISOString();
        names.forEach(name=>{
          const studentKey=A.key(name),previous=old[studentKey]||{};
          const history=Array.isArray(previous.history)?previous.history.slice():Object.values(previous.history||{});
          const oldDate=A.date(previous.effectiveFrom||(A.level(previous.tahsinLevel)?previous.updatedAt:''));
          if(previous.programQuran&&oldDate&&!history.some(entry=>A.date(entry?.effectiveFrom)===oldDate))
            history.push({effectiveFrom:oldDate,programQuran:previous.programQuran,tahsinLevel:previous.tahsinLevel||''});
          const next={effectiveFrom,programQuran:program.value,tahsinLevel:program.value==='Tahsin'?chosenLevel:'',updatedAt:stamp};
          const remaining=history.filter(entry=>A.date(entry?.effectiveFrom)!==effectiveFrom);
          remaining.push(next);remaining.sort((a,b)=>A.date(a.effectiveFrom).localeCompare(A.date(b.effectiveFrom)));
          const current=remaining[remaining.length-1];
          updates[`cahaya_app/program_quran_santri/${studentKey}`]={
            ...previous,namaSantri:name,programQuran:current.programQuran,
            tahsinLevel:current.tahsinLevel||'',effectiveFrom:current.effectiveFrom,
            kelasAkademik:to||from,history:remaining,updatedAt:stamp
          };
        });
        if(to)updates['cahaya_app/master_akademik/kelas']=classes;
        await update(ref(db),updates);
        await push(ref(db,'cahaya_app/log_manajemen_kelas'),{
          santri:names,dariKelas:from,keKelas:to||from,programQuran:program.value,
          tahsinLevel:program.value==='Tahsin'?chosenLevel:'',effectiveFrom,
          jumlah:names.length,oleh:JSON.parse(localStorage.getItem('cahayaCurrentUser')||'{}').label||'',timestamp:stamp
        });
        toast(`${names.length} penempatan berhasil disimpan.`);
        setTimeout(()=>location.reload(),800);
      } catch(error) { console.error('Penempatan Tahsin gagal:',error);toast('Penempatan gagal disimpan. Coba lagi.'); }
      finally { save.disabled=false;save.textContent='Simpan Perpindahan'; }
    },true);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
