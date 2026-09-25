/* Shared Draft -> Review -> Publication contract for academic reports. */
(function(root,factory){
  const common=typeof module==='object'&&module.exports;
  const api=factory(common?require('./wali-academic-report-v2.js'):root.CahayaWaliAcademicReportV2,common?require('./academic-report-score-policy.js'):root.CahayaAcademicReportScorePolicy);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.CahayaAcademicReportPublication=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Report,ScorePolicy){
  'use strict';
  const TYPES={
    bulanan:{label:'Bulanan',title:'Laporan Akademik Bulanan',description:'Laporan perkembangan akademik setiap bulan.',periods:Report?.MONTHS||['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']},
    triwulan:{label:'Triwulan',title:'Rapor Triwulan',description:'Rapor evaluasi perkembangan tiga bulanan.',periods:['Triwulan 1','Triwulan 2','Triwulan 3','Triwulan 4']},
    semester:{label:'Semester',title:'Rapor Semester',description:'Rapor hasil belajar satu semester.',periods:['Semester 1','Semester 2']}
  };
  const STATUS={DRAFT:'DRAFT',READY:'READY_FOR_REVIEW',NEEDS_REVISION:'NEEDS_REVISION',PUBLISHED:'PUBLISHED',WITHDRAWN:'WITHDRAWN'};
  const PUBLICATION_REQUIRED_FROM='2026-09-01';
  const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const key=value=>norm(value).replace(/\s+/g,'_')||'unknown';
  const stableStudentKey=value=>String(value||'').trim().replace(/[.#$\[\]\/]/g,'')||key(value);
  function path({studentKey,tahunAkademik,type,period}){
    return `cahaya_app/rapor_publication/${stableStudentKey(studentKey)}/${key(tahunAkademik)}/${key(type)}/${key(period)}`;
  }
  const isPublished=value=>String(value?.status||'').toUpperCase()===STATUS.PUBLISHED;
  const isLegacyMonthlyPublished=({marker,type,periodDate,finalRecordCount})=>!marker&&type==='bulanan'&&/^\d{4}-\d{2}-\d{2}$/.test(String(periodDate||''))&&periodDate<PUBLICATION_REQUIRED_FROM&&Number(finalRecordCount)>0;
  function statusLabel(value){return({DRAFT:'DRAFT',READY_FOR_REVIEW:'SIAP DITINJAU',NEEDS_REVISION:'PERLU PERBAIKAN',PUBLISHED:'DIPUBLIKASIKAN',WITHDRAWN:'DRAFT'})[String(value||'').toUpperCase()]||'DRAFT'}
  function effectiveStatus(marker,readiness={},revisionResolved=false){const status=String(marker?.status||'').toUpperCase();if(status===STATUS.PUBLISHED)return STATUS.PUBLISHED;if(status===STATUS.NEEDS_REVISION&&!revisionResolved)return STATUS.NEEDS_REVISION;return readiness.ready?STATUS.READY:STATUS.DRAFT}
  function subject(record){return Report?.subjectOf?Report.subjectOf(record):String(record?.mata_pelajaran||record?.mapel||'Mata Pelajaran')}
  function studentKeyOf(record){return stableStudentKey(record?.studentKey||record?.santriId||record?.studentId||record?.nama_santri||record?.namaSantri||record?.nama||'')}
  function classOf(record){return String(record?.kelas_kelompok||record?.kelas||record?.namaKelas||'').trim()}
  function finalRecords(records,options={}){return Report?.filterScores?Report.filterScores(records,options):[]}
  const isQuranSubject=value=>/(alquran|quran|tahsin|tahfiz)/.test(key(typeof value==='string'?value:subject(value)));
  const sameSubject=(left,right)=>isQuranSubject(left)&&isQuranSubject(right)||norm(typeof left==='string'?left:subject(left))===norm(typeof right==='string'?right:subject(right));
  function readiness({allRecords=[],studentRecords=[],type,year,period,student,applicable,expectedSubjects=[]}){
    const cohort=(allRecords||[]).filter(record=>Report.typeOf(record)===type&&(!year||norm(Report.yearOf(record))===norm(year))&&(!period||norm(Report.periodOf(record,type))===norm(period))&&(!student?.kelas||norm(classOf(record))===norm(student.kelas))).filter(record=>typeof applicable!=='function'||applicable(record,student));
    const scheduled=expectedSubjects||[];
    const expected=(scheduled.length?scheduled.map(item=>typeof item==='string'?item:item.label||item.subject):cohort.map(subject)).filter(Boolean).filter((item,index,list)=>list.findIndex(other=>sameSubject(other,item))===index);
    const finals=finalRecords(studentRecords,{tab:type,year,period,student,applicable:record=>typeof applicable!=='function'||applicable(record,student)});
    const completed=finals.map(subject).filter(Boolean).filter((item,index,list)=>list.findIndex(other=>sameSubject(other,item))===index);
    const missing=expected.filter(item=>!completed.some(done=>sameSubject(done,item)));
    return {expected:expected.length,final:completed.length,missing,ready:expected.length>0&&missing.length===0,records:finals,remedial:finals.filter(record=>ScorePolicy?.isRemedial?.(record)).length};
  }
  function escape(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
  function components(record){return [['nilai_syafawi','Lisan'],['nilai_tahriri','Tulisan'],['nilai_tashnif','Tashnif'],['nilai_tathbiqi','Praktek']].filter(([field])=>record[field]!==undefined&&record[field]!==null&&record[field]!==''&&Number(record[`bobot_${field.replace('nilai_','')}_persen`]??1)>0).map(([field,label])=>`<span>${label}: ${escape(record[field])}</span>`).join('')}
  function renderScoreCards(records,{formatTeacher=value=>value}={}){
    return (records||[]).map(record=>{if(record?.__missing)return`<article class="period-report-card report-missing"><div class="period-report-head"><div><h4>${escape(record.label||record.subject||'Mata Pelajaran')}</h4><div class="period-report-meta">${escape(formatTeacher(record.teacher||'Guru'))}</div></div><div class="period-report-score">—</div></div><div class="period-report-note">Belum tersedia</div></article>`;const score=ScorePolicy?.reportScore?ScorePolicy.reportScore(record):Number(record.nilai_total),remedial=ScorePolicy?.isRemedial?ScorePolicy.isRemedial(record):record.is_remedial===true,note=String(record.keterangan||'').trim();return `<article class="period-report-card"><div class="period-report-head"><div><h4>${escape(subject(record))}</h4><div class="period-report-meta">${escape(formatTeacher(record.guru_penguji||record.guru||'Guru'))}</div></div><div class="period-report-score">${Number.isFinite(score)?score:'—'}</div></div><div class="period-report-components">${components(record)}</div>${remedial?'<span class="report-remedial">Remedial</span>':''}${note?`<div class="period-report-note">${remedial?'Remedial · ':''}${escape(note)}</div>`:''}</article>`}).join('');
  }
  function reportRows(records,expectedSubjects=[]){const pending=[...(records||[])],result=[];(expectedSubjects||[]).forEach(item=>{const label=typeof item==='string'?item:item.label||item.subject,foundIndex=pending.findIndex(record=>sameSubject(record,label));if(foundIndex>=0)result.push(pending.splice(foundIndex,1)[0]);else result.push({__missing:true,label,teacher:typeof item==='string'?'':item.teacher||''})});return[...result,...pending]}
  function reportUnit(value){const text=norm(typeof value==='string'?value:[value?.kelas,value?.unit,value?.area].filter(Boolean).join(' '));return text.includes('putri')?'Putri':text.includes('putra')?'Putra':''}
  function supervisorName(marker){return String(marker?.publishedByName||marker?.reviewedByName||marker?.updatedByName||'Supervisor Pendidikan').trim()||'Supervisor Pendidikan'}
  function reviewStatement(marker,{kelas='',unit=''}={}){const name=supervisorName(marker),scope=reportUnit(unit||kelas),role=['Supervisor Pendidikan Pesantren Cahaya Fajrul Islam',scope].filter(Boolean).join(' '),identified=name!=='Supervisor Pendidikan';return `Isi Raport ini telah melalui pemeriksaan ${role}${identified?` ${name}`:''}. Jika ada yang perlu dikonsultasikan, dapat menghubungi supervisor ${identified?name:'Pendidikan'}.`}
  function renderReviewStatement(marker,context={}){return `<aside class="report-review-note"><strong>Telah diperiksa Supervisor Pendidikan</strong><p>${escape(reviewStatement(marker,context))}</p></aside>`}
  return {TYPES,STATUS,PUBLICATION_REQUIRED_FROM,norm,key,stableStudentKey,path,isPublished,isLegacyMonthlyPublished,statusLabel,effectiveStatus,subject,studentKeyOf,classOf,finalRecords,isQuranSubject,sameSubject,readiness,reportRows,renderScoreCards,reportUnit,supervisorName,reviewStatement,renderReviewStatement};
});
