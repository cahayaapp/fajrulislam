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
  // Nilai akademik memakai key nama tanpa pemisah (lihat Input Nilai).
  // Publication marker harus memakai kontrak yang sama, bukan ID akun Wali
  // yang dapat berasal dari registry/migrasi berbeda.
  const academicStudentKey=value=>norm(value).replace(/\s+/g,'');
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
  const compactSubject=value=>norm(typeof value==='string'?value:subject(value)).replace(/\s+/g,'');
  const isQuranSubject=value=>/(alquran|quran|tahsin|tahfiz)/.test(compactSubject(value));
  const sameSubject=(left,right)=>isQuranSubject(left)&&isQuranSubject(right)||norm(typeof left==='string'?left:subject(left))===norm(typeof right==='string'?right:subject(right));
  const teacherCodeOf=value=>String(value?.teacherCode||value?.guruKode||value?.kode_guru||'').trim().toUpperCase();
  const teacherNameOf=value=>String(value?.teacher||value?.guru_penguji||value?.guruNama||value?.nama_guru||value?.guru||'').trim();
  function sameTeacher(record,item){const recordCode=teacherCodeOf(record),itemCode=teacherCodeOf(item);if(recordCode&&itemCode)return recordCode===itemCode;const actual=norm(teacherNameOf(record)),expected=norm(teacherNameOf(item));return !!(actual&&expected&&(actual===expected||actual.includes(expected)||expected.includes(actual)))}
  function recordStamp(record){return Date.parse(record?.updated_at||record?.updatedAt||record?.final_at||record?.finalAt||record?.created_at||record?.createdAt||0)||0}
  function isFinalRecord(record){return norm(record?.status_nilai||record?.statusNilai||record?.status)==='final'&&record?.locked!==false}
  function expectedSubjectRows(scheduleItems=[],records=[]){
    const groups=new Map();
    (scheduleItems||[]).forEach((item,index)=>{const label=typeof item==='string'?item:item?.label||item?.subject;if(!label)return;const id=isQuranSubject(label)?'quran':norm(label);if(!groups.has(id))groups.set(id,[]);groups.get(id).push(typeof item==='string'?{label,index}:{...item,label,index})});
    return [...groups.values()].map(candidates=>{
      const matching=(records||[]).filter(record=>sameSubject(record,candidates[0].label)).sort((a,b)=>Number(isFinalRecord(b))-Number(isFinalRecord(a))||Number(candidates.some(item=>sameTeacher(b,item)))-Number(candidates.some(item=>sameTeacher(a,item)))||recordStamp(b)-recordStamp(a));
      const actual=matching[0];
      if(actual)return{label:subject(actual),teacher:teacherNameOf(actual)||teacherNameOf(candidates.find(item=>sameTeacher(actual,item)))||teacherNameOf(candidates[0]),teacherCode:teacherCodeOf(actual)||teacherCodeOf(candidates.find(item=>sameTeacher(actual,item)))||teacherCodeOf(candidates[0])};
      const selected=[...candidates].sort((a,b)=>recordStamp(b)-recordStamp(a)||a.index-b.index)[0];
      return{label:selected.label,teacher:teacherNameOf(selected),teacherCode:teacherCodeOf(selected)};
    });
  }
  function reviewScoreRecords(records=[]){
    const selected=new Map();
    (records||[]).filter(record=>Number.isFinite(Number(record?.nilai_total??record?.nilai))).forEach(record=>{const id=isQuranSubject(record)?'quran':norm(subject(record)),previous=selected.get(id);if(!previous||recordStamp(record)>=recordStamp(previous))selected.set(id,record)});
    return [...selected.values()].sort((a,b)=>subject(a).localeCompare(subject(b),'id',{numeric:true}));
  }
  function scoreValue(record){
    const value=ScorePolicy?.reportScore?ScorePolicy.reportScore(record):Number(record?.nilai_total??record?.nilai_akhir??record?.nilai);
    return Number.isFinite(Number(value))?Number(value):null;
  }
  function rankClassReports(entries=[]){
    const prepared=(entries||[]).map((entry,index)=>{
      const records=reviewScoreRecords(entry?.records||entry?.readiness?.records||[]).filter(isFinalRecord),scores=records.map(scoreValue).filter(Number.isFinite),complete=entry?.complete===true||entry?.readiness?.ready===true;
      const total=scores.reduce((sum,value)=>sum+value,0),average=scores.length?total/scores.length:null;
      return {...entry,__index:index,records,complete,average,subjectCount:scores.length,remedial:records.filter(record=>ScorePolicy?.isRemedial?.(record)||record?.is_remedial===true).length,rank:null,rankingTotal:0};
    });
    const ranked=prepared.filter(item=>item.complete&&Number.isFinite(item.average)).sort((a,b)=>b.average-a.average);
    ranked.forEach((item,index)=>{const previous=ranked[index-1];item.rank=index>0&&previous&&Math.abs(item.average-previous.average)<1e-9?previous.rank:index+1;item.rankingTotal=ranked.length});
    return prepared.sort((a,b)=>{if(a.rank&&b.rank)return a.rank-b.rank;if(a.rank)return-1;if(b.rank)return 1;return String(a?.student?.name||a?.name||'').localeCompare(String(b?.student?.name||b?.name||''),'id')});
  }
  function rankingSnapshot(item){
    if(!item)return null;
    return {rank:item.rank||null,total:item.rankingTotal||0,average:Number.isFinite(item.average)?item.average:null,subjectCount:item.subjectCount||0,remedial:item.remedial||0,complete:item.complete===true,method:'competition-v1',computedAt:new Date().toISOString()};
  }
  function rankingLabel(value){
    const ranking=value?.classRanking||value?.ranking||value;
    return ranking?.complete&&ranking?.rank&&ranking?.total?`Peringkat ${ranking.rank} dari ${ranking.total} santri`:'Ranking belum tersedia — nilai belum lengkap.';
  }
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
  function renderScoreCards(records,{formatTeacher=value=>value,showWorkflowStatus=false}={}){
    return (records||[]).map(record=>{if(record?.__missing)return`<article class="period-report-card report-missing"><div class="period-report-head"><div><h4>${escape(record.label||record.subject||'Mata Pelajaran')}</h4><div class="period-report-meta">${escape(formatTeacher(record.teacher||'Guru'))}</div></div><div class="period-report-score">—</div></div><div class="period-report-note">Belum tersedia</div></article>`;const score=ScorePolicy?.reportScore?ScorePolicy.reportScore(record):Number(record.nilai_total),remedial=ScorePolicy?.isRemedial?ScorePolicy.isRemedial(record):record.is_remedial===true,note=String(record.keterangan||'').trim(),draft=showWorkflowStatus&&!isFinalRecord(record);return `<article class="period-report-card"><div class="period-report-head"><div><h4>${escape(subject(record))}</h4><div class="period-report-meta">${escape(formatTeacher(record.guru_penguji||record.guru||'Guru'))}</div></div><div class="period-report-score">${Number.isFinite(score)?score:'—'}</div></div><div class="period-report-components">${components(record)}</div>${draft?'<span class="report-draft">Draft · menunggu Finalisasi Guru</span>':''}${remedial?'<span class="report-remedial">Remedial</span>':''}${note?`<div class="period-report-note">${remedial?'Remedial · ':''}${escape(note)}</div>`:''}</article>`}).join('');
  }
  function renderTahfizHistory(records=[]){
    if(!(records||[]).length)return '<div class="period-tahfiz-empty">Belum ada setoran Tahfiz pada Triwulan ini.</div>';
    const date=value=>{const parsed=new Date(value);return Number.isNaN(parsed.getTime())?String(value||'-'):parsed.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'})};
    return `<table class="period-tahfiz-table"><thead><tr><th style="width:18%">Tanggal</th><th style="width:31%">Setoran</th><th style="width:12%">Ayat</th><th style="width:16%">Nilai</th><th style="width:23%">Catatan</th></tr></thead><tbody>${records.map(item=>`<tr><td>${escape(date(item.tanggal))}</td><td>${escape(item.setoran||'-')}</td><td>${escape(item.ayat??'-')}</td><td>${escape(item.nilai||'-')}</td><td>${escape(item.keterangan||'-')}</td></tr>`).join('')}</tbody></table>`;
  }
  function reportRows(records,expectedSubjects=[]){const pending=[...(records||[])],result=[];(expectedSubjects||[]).forEach(item=>{const label=typeof item==='string'?item:item.label||item.subject;let foundIndex=pending.findIndex(record=>sameSubject(record,label)&&sameTeacher(record,item));if(foundIndex<0)foundIndex=pending.findIndex(record=>sameSubject(record,label));if(foundIndex>=0)result.push(pending.splice(foundIndex,1)[0]);else result.push({__missing:true,label,teacher:typeof item==='string'?'':item.teacher||''})});return[...result,...pending]}
  function reportUnit(value){const text=norm(typeof value==='string'?value:[value?.kelas,value?.unit,value?.area].filter(Boolean).join(' '));return text.includes('putri')?'Putri':text.includes('putra')?'Putra':''}
  function roleList(profile){if(Array.isArray(profile?.roles))return profile.roles.map(String).map(x=>x.toUpperCase());if(profile?.roles&&typeof profile.roles==='object')return Object.entries(profile.roles).filter(([,enabled])=>enabled===true).map(([role])=>String(role).toUpperCase());return[String(profile?.role||profile?.defaultRole||'').toUpperCase()].filter(Boolean)}
  function educationSupervisorAccount(profile,unit){const assignment=profile?.assignments?.SUPERVISOR||profile?.assignment||{},roles=(assignment.supervisedRoles||[]).map(String).map(x=>x.toUpperCase()),wanted=String(unit||'').toUpperCase(),assignedUnit=String(assignment.unit||profile?.unit||'').toUpperCase(),area=String(assignment.area||'').toUpperCase(),domain=String(assignment.programDomain||'').toUpperCase(),inactive=profile?.active===false||['NONAKTIF','INACTIVE','DISABLED'].includes(String(profile?.status||'').toUpperCase());return !inactive&&roleList(profile).includes('SUPERVISOR')&&['PUTRA','PUTRI'].includes(wanted)&&(assignedUnit===wanted||assignedUnit==='ALL')&&(area==='PENDIDIKAN'||roles.includes('GURU_PONDOK'))&&(!domain||domain==='KEPONDOKAN')}
  function resolveEducationSupervisor(accounts,unit){const wanted=String(unit||'').toUpperCase();return (accounts||[]).filter(profile=>educationSupervisorAccount(profile,wanted)).sort((a,b)=>{const aa=a?.assignments?.SUPERVISOR||{},bb=b?.assignments?.SUPERVISOR||{},exactA=String(aa.unit||a.unit||'').toUpperCase()===wanted?0:1,exactB=String(bb.unit||b.unit||'').toUpperCase()===wanted?0:1,defaultA=String(a.defaultRole||'').toUpperCase()==='SUPERVISOR'?0:1,defaultB=String(b.defaultRole||'').toUpperCase()==='SUPERVISOR'?0:1;return exactA-exactB||defaultA-defaultB||String(a.label||a.nama||a.username||'').localeCompare(String(b.label||b.nama||b.username||''),'id')})[0]||null}
  function accountName(profile){return String(profile?.label||profile?.nama||profile?.displayName||profile?.username||'').trim()}
  function supervisorName(marker){return String(marker?.supervisorAccountName||marker?.publishedByName||marker?.reviewedByName||marker?.updatedByName||'Supervisor Pendidikan').trim()||'Supervisor Pendidikan'}
  function reviewStatement(marker,{kelas='',unit=''}={}){const name=supervisorName(marker),scope=reportUnit(unit||kelas),role=['Supervisor Pendidikan Pesantren Cahaya Fajrul Islam',scope].filter(Boolean).join(' '),identified=name!=='Supervisor Pendidikan';return `Isi Raport ini telah melalui pemeriksaan ${role}${identified?` ${name}`:''}. Jika ada yang perlu dikonsultasikan, dapat menghubungi supervisor ${identified?name:'Pendidikan'}.`}
  function renderReviewStatement(marker,context={}){const name=supervisorName(marker),escapedName=escape(name),statement=escape(reviewStatement(marker,context)),body=name==='Supervisor Pendidikan'?statement:statement.split(escapedName).join(`<strong>${escapedName}</strong>`);return `<aside class="report-review-note"><strong>Telah diperiksa Supervisor Pendidikan</strong><p>${body}</p></aside>`}
  return {TYPES,STATUS,PUBLICATION_REQUIRED_FROM,norm,key,academicStudentKey,stableStudentKey,path,isPublished,isLegacyMonthlyPublished,statusLabel,effectiveStatus,subject,studentKeyOf,classOf,finalRecords,isQuranSubject,sameSubject,expectedSubjectRows,reviewScoreRecords,scoreValue,rankClassReports,rankingSnapshot,rankingLabel,readiness,reportRows,renderScoreCards,renderTahfizHistory,reportUnit,roleList,educationSupervisorAccount,resolveEducationSupervisor,accountName,supervisorName,reviewStatement,renderReviewStatement};
});
