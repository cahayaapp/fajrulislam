(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.CahayaQualityControlEducation=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const norm=value=>String(value??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ' ).trim();
  const num=value=>{const parsed=Number(value);return Number.isFinite(parsed)?parsed:null};
  const pct=(part,total)=>total>0?Math.round(part/total*1000)/10:null;
  const average=values=>{const clean=values.map(num).filter(Number.isFinite);return clean.length?Math.round(clean.reduce((a,b)=>a+b,0)/clean.length*10)/10:null};
  const first=(row,keys)=>{for(const key of keys){if(row&&row[key]!==undefined&&row[key]!==null&&row[key]!=='')return row[key]}return''};
  const dateOf=row=>String(first(row,['tanggal','date','tanggalAbsensi','tanggalPresensi','tanggalAsesmen','tanggalSetoran','tanggalPelaksanaan','tanggalPenindakan','createdAt','timestamp','waktu','updatedAt'])).slice(0,10);
  const unitOf=row=>{const text=norm([row?.unit,row?.unitAsrama,row?.jenisKelamin,row?.gender,row?.kelas,row?.className,row?.usrah,row?.labelUsrah,row?.lokasi].filter(Boolean).join(' '));if(text.includes('putri')||text.includes('perempuan'))return'PUTRI';if(text.includes('putra')||text.includes('laki'))return'PUTRA';return''};
  const teacherOf=row=>String(first(row,['guruId','guruKey','teacherId','teacherUid','uidGuru','guruKode','teacherName','guruNama','namaGuru','guru','pengajar','penginputNama']));
  const studentOf=row=>String(first(row,['studentKey','santriId','namaSantri','santri','nama','dilaporkan']));
  const subjectOf=row=>String(first(row,['mataPelajaran','mata_pelajaran','mapel','subject','program','programName','namaProgram']));
  const classOf=row=>String(first(row,['kelasAkademik','kelas','className','kelompok']));
  function flatten(value){
    const rows=[];
    const hints=new Set(['tanggal','date','tanggalAbsensi','tanggalPresensi','timestamp','status','namaSantri','studentKey','guru','guruNama','guruId','mapel','mataPelajaran','program','jenis_ujian','nilai_total','tanggalSetoran','tanggalAsesmen']);
    const walk=(node,key='',context={})=>{
      if(node===null||node===undefined)return;
      if(Array.isArray(node)){node.forEach((item,index)=>walk(item,String(index),context));return}
      if(typeof node!=='object')return;
      const keys=Object.keys(node),isRecord=keys.some(item=>hints.has(item));
      if(isRecord){rows.push({_key:key,...context,...node});return}
      const nextContext={...context};
      if(key&&/^\d{4}-\d{2}-\d{2}$/.test(key))nextContext._parentDate=key;
      keys.forEach(child=>walk(node[child],child,nextContext));
    };
    walk(value);
    return rows.map(row=>row.tanggal||row.date||!row._parentDate?row:{...row,tanggal:row._parentDate});
  }
  const monthRows=(rows,month,unit='ALL')=>rows.filter(row=>dateOf(row).startsWith(month)&&(unit==='ALL'||unitOf(row)===unit));
  const statusOf=row=>norm(first(row,['status','statusKehadiran','statusAbsensi','kehadiran','status_nilai','statusNilai']));
  function attendanceStatus(row){
    const value=statusOf(row);
    if(/terlambat|late|\bt\b/.test(value))return'TERLAMBAT';
    if(/hadir|present|\bh\b/.test(value))return'HADIR';
    if(/sakit|sick|\bs\b/.test(value))return'SAKIT';
    if(/izin|ijin|permit|\bi\b/.test(value))return'IZIN';
    if(/alfa|alpha|mangkir|tanpa keterangan|\ba\b/.test(value))return'ALFA';
    return'';
  }
  function attendanceSummary(rows){
    const counts={HADIR:0,TERLAMBAT:0,SAKIT:0,IZIN:0,ALFA:0,UNKNOWN:0};
    rows.forEach(row=>{const key=attendanceStatus(row)||'UNKNOWN';counts[key]++});
    const present=counts.HADIR+counts.TERLAMBAT,effective=present+counts.ALFA,total=effective+counts.SAKIT+counts.IZIN;
    return{...counts,total,present,attendance:pct(present,effective),punctuality:pct(counts.HADIR,present),excusedAbsence:pct(counts.SAKIT+counts.IZIN,total)};
  }
  const DAYS={minggu:0,ahad:0,senin:1,selasa:2,rabu:3,kamis:4,jumat:5,sabtu:6};
  function daysInMonth(month,day){const [year,index]=month.split('-').map(Number),target=DAYS[norm(day)];if(target===undefined)return[];const result=[],cursor=new Date(year,index-1,1,12);while(cursor.getMonth()===index-1){if(cursor.getDay()===target)result.push(cursor.toISOString().slice(0,10));cursor.setDate(cursor.getDate()+1)}return result}
  function approvedLeaveOn(leaves,teacher,date){const key=norm(teacher);return leaves.some(row=>{const state=statusOf(row),owner=norm(teacherOf(row)||first(row,['nama','namaPemohon','pemohon'])),from=String(first(row,['tanggalMulai','startDate','mulai','tanggal'])).slice(0,10),to=String(first(row,['tanggalSelesai','endDate','selesai','tanggal'])).slice(0,10)||from;return /disetujui|approved|setuju/.test(state)&&owner===key&&from<=date&&date<=to})}
  function teacherQuality({schedule=[],attendance=[],leaves=[],month,unit='ALL',teacher='',asOf=''}){
    const scopedSchedule=schedule.filter(row=>row.aktif!==false&&(unit==='ALL'||unitOf(row)===unit)&&(!teacher||norm(teacherOf(row))===norm(teacher)));
    const scopedAttendance=monthRows(attendance,month,unit).filter(row=>!teacher||norm(teacherOf(row))===norm(teacher));
    const attendanceByKey=new Map();
    scopedAttendance.forEach(row=>{const key=[dateOf(row),norm(teacherOf(row)),norm(classOf(row)),norm(subjectOf(row))].join('|');if(!attendanceByKey.has(key))attendanceByKey.set(key,row)});
    let expected=0,present=0,onTime=0,excused=0,undetected=0;
    const people=new Map();
    const today=asOf||new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'}),currentMonth=today.slice(0,7),cutoff=month<currentMonth?'9999-12-31':month===currentMonth?today:'0000-00-00';
    scopedSchedule.forEach(item=>{
      const name=teacherOf(item);if(!name)return;
      const person=people.get(norm(name))||{name,expected:0,present:0,onTime:0,excused:0,undetected:0};
      daysInMonth(month,first(item,['hari','day'])).filter(date=>date<=cutoff).forEach(date=>{
        expected++;person.expected++;
        const exact=[date,norm(name),norm(classOf(item)),norm(subjectOf(item))].join('|');
        const loose=[...attendanceByKey.values()].find(row=>dateOf(row)===date&&norm(teacherOf(row))===norm(name)&&(norm(classOf(row))===norm(classOf(item))||norm(subjectOf(row))===norm(subjectOf(item))));
        const record=attendanceByKey.get(exact)||loose;
        if(record){present++;person.present++;const state=attendanceStatus(record),late=state==='TERLAMBAT'||/terlambat|late/.test(norm(first(record,['keterangan','catatan','statusWaktu'])));if(!late){onTime++;person.onTime++}}
        else if(approvedLeaveOn(leaves,name,date)){excused++;person.excused++}
        else{undetected++;person.undetected++}
      });
      people.set(norm(name),person);
    });
    const individuals=[...people.values()].map(item=>({...item,attendance:pct(item.present,item.expected),punctuality:pct(item.onTime,item.present),excusedAbsence:pct(item.excused,item.expected),undetectedPct:pct(item.undetected,item.expected)})).sort((a,b)=>a.name.localeCompare(b.name,'id'));
    return{expected,present,onTime,excused,undetected,attendance:pct(present,expected),punctuality:pct(onTime,present),excusedAbsence:pct(excused,expected),undetectedPct:pct(undetected,expected),individuals};
  }
  function scoreRows(raw){const output=[];flatten(raw).forEach(parent=>{const items=parent.data?(Array.isArray(parent.data)?parent.data:Object.values(parent.data)):parent.nilaiSantri?(Array.isArray(parent.nilaiSantri)?parent.nilaiSantri:Object.values(parent.nilaiSantri)):[parent];items.forEach(item=>output.push({...parent,...item,data:undefined,nilaiSantri:undefined}))});return output}
  function examSummary(rows,month,unit='ALL',defaultKkm=75){const scoped=monthRows(rows,month,unit).filter(row=>/final/.test(statusOf(row)));let pass=0,fail=0;scoped.forEach(row=>{const value=num(first(row,['nilai_total','nilaiTotal','nilaiAkhir','nilai','score']));if(value===null)return;const kkm=num(first(row,['kkm','nilaiKkm','batasLulus']))??defaultKkm;if(value>=kkm)pass++;else fail++});return{pass,fail,total:pass+fail,passPct:pct(pass,pass+fail),failPct:pct(fail,pass+fail)} }
  function tahfizSummary(rows,month,unit='ALL'){
    const scoped=monthRows(rows,month,unit).filter(row=>/tahfiz|hafalan/.test(norm([row.program,row.jenisProgram,row.kategori,row.mapel].filter(Boolean).join(' '))));let achieved=0,total=0;
    scoped.forEach(row=>{const lines=num(first(row,['baris','jumlahBaris','capaianBaris','barisTercapai'])),target=num(first(row,['targetBarisHarian','targetBaris','targetHarian']));if(lines===null||target===null||target<=0)return;total++;if(lines>=target)achieved++});
    return{achieved,total,percent:pct(achieved,total)};
  }
  function violationSummary(rows,month,unit='ALL'){
    const result={total:0,categories:{}};
    monthRows(rows,month,unit).forEach(row=>{const type=norm([row.tipe,row.jenis,row.kategori,row.bidangPelanggaran,row.kategoriKhusus].filter(Boolean).join(' '));if(!/pelanggaran|kasus|aduan/.test(type))return;if(/terlambat|ketepatan waktu|absensi|kehadiran/.test(type))return;const category=String(first(row,['bidangPelanggaran','kategoriKhusus','kategori','jenisPelanggaran','kelompokKasus'])||'Lainnya');result.total++;result.categories[category]=(result.categories[category]||0)+1});return result;
  }
  function observationSummary(rows,month,unit='ALL',kind=''){
    const scoped=monthRows(rows,month,unit).filter(row=>!kind||norm(first(row,['jenis','type','kategori'])).includes(norm(kind)));
    const scores=scoped.map(row=>num(first(row,['skorPersen','qualityScore','nilaiPersen','persentase','skorTotal','skor']))).filter(Number.isFinite).map(value=>value<=5?value/5*100:value);
    return{count:scoped.length,average:average(scores)};
  }
  function completionSummary(rows,month,unit='ALL'){
    const scoped=monthRows(rows,month,unit),done=scoped.filter(row=>/selesai|tuntas|final|closed|sudah/.test(statusOf(row))).length;
    return{done,total:scoped.length,percent:pct(done,scoped.length)};
  }
  function counselingSummary(reports,caseBook,month,unit='ALL'){
    const cases=monthRows(reports,month,unit).filter(row=>/pelanggaran|kasus|aduan/.test(norm([row.tipe,row.jenis,row.kategori,row.bidangPelanggaran].filter(Boolean).join(' '))));
    const actions=monthRows(caseBook,month,unit),handledIds=new Set(actions.flatMap(row=>[row.sourceCaseId,row.caseId,row.idLaporan,row.reportId,row._key].filter(Boolean).map(norm)));
    const handled=cases.filter(row=>/selesai|ditindak|tertangani|closed/.test(statusOf(row))||[row.id,row._key,row.caseId].filter(Boolean).some(id=>handledIds.has(norm(id)))).length;
    return{handled,total:cases.length,percent:pct(handled,cases.length)};
  }
  function characterSummary(rows,month,unit='ALL'){
    const scoped=monthRows(rows,month,unit),scores=[];
    scoped.forEach(row=>{let value=num(first(row,['persentase','skorPersen','nilaiPersen','skorTotal','nilai']));if(value===null&&row.checkinCahaya){const parts=Object.values(row.checkinCahaya).map(item=>num(item?.average)).filter(Number.isFinite);value=parts.length?average(parts)/4*100:null}if(value!==null)scores.push(value<=5?value/5*100:value)});
    return{records:scoped.length,achievement:average(scores)};
  }
  return{norm,num,pct,average,first,dateOf,unitOf,teacherOf,studentOf,subjectOf,classOf,flatten,monthRows,statusOf,attendanceStatus,attendanceSummary,daysInMonth,teacherQuality,scoreRows,examSummary,tahfizSummary,violationSummary,observationSummary,completionSummary,counselingSummary,characterSummary};
});
