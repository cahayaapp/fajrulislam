import assert from 'node:assert/strict';
import test from 'node:test';
import {project} from '../tools/live-tv.mjs';
const date='2026-11-12';
test('ringkasan harian memisahkan izin, belum absen, dan alfa; buka hanya bidang publik',()=>{
  const data={
    roster:{'Usrah 1':['Satu','Dua','Tiga','Empat']},
    classes:{'Kelas 3 Putra':['Satu','Dua','Tiga','Empat'],'Kelas 3 Putri':['Putri']},
    placements:{dua:{programQuran:'TAHSIN',effectiveFrom:'2026-01-01'}},
    deposits:{a:{tanggal:date,program:'Tahfiz',data:[{nama:'SATU',setoran:'1–5',keterangan:'rahasia'}]},b:{tanggal:date,program:'Tahsin',data:[{nama:'Dua'}]}},
    lessons:{a:{tanggal:date,jamMulaiJadwal:'06:00',data:[{nama:'Satu',status:'Alfa'},{nama:'Dua',status:'Sakit'},{nama:'Tiga',status:'Belum Hadir'},{nama:'Empat',status:'Izin'}]},
      b:{tanggal:date,jamMulaiJadwal:'09:00',data:[{nama:'Satu',statusFinal:'Terlambat'}]}},
    staffLog:{a:{tanggal:date,namaGuru:'Guru Satu',guruKodeKalender:'A',unit:'PUTRA',statusKehadiran:'TEPAT_WAKTU',emailGuru:'rahasia'}},
    schedule:['A','B','C','D'].map((code,i)=>({hari:4,unit:'PUTRA',kelas:'Kelas 3 Putra',mapel:'Al Quran',guruKode:code,guruNama:['Guru Satu','Guru Dua','Guru Tiga','Guru Empat'][i],jamMulai:i===3?'17:00':'07:00'})),
    leave:{x:{units:['PUTRA'],teacherCode:'B',teacherName:'Guru Dua',startDate:date,endDate:date,review:{status:'APPROVED'},reason:'rahasia'}}};
  data.reports={
    r1:{tanggal:date,dilaporkan:'Tiga',tipe:'Lapor Pelanggaran',kodePelanggaran:'DISIPLIN'},
    r2:{tanggal:date,dilaporkan:'Putri',tipe:'Lapor Pelanggaran',kodePelanggaran:'MORAL'},
    r3:{tanggal:date,dilaporkan:'Dua',tipe:'Lapor Pelanggaran',kodePelanggaran:'MORAL',caseV2:{status:'SELESAI'}}
  };
  data.deposits.c={tanggal:date,program:'Tahfiz',data:[{nama:'Dua',setoran:'1–2'}]};
  const now=new Date(date+'T11:00:00+07:00');
  const result=project(data,now,'putra'),putri=project(data,now,'putri');
  assert.deepEqual(putri.konselor,{muda:[],madya:['Putri']});
  assert(result.konselor.muda.includes('Tiga'));assert.deepEqual(result.konselor.madya,[]);
  assert.deepEqual(putri.guru,{masuk:[],izin:[],belum:[]});
  assert(!JSON.stringify(result).includes('"Putri"'));
  assert.deepEqual(result.tahfiz.sudah,['Satu']);assert.equal(result.tahfiz.belum.length,2);
  assert.deepEqual(result.santri,{masuk:['Satu'],izin:['Empat'],sakit:['Dua'],alfa:[]});
  assert.deepEqual(result.guru,{masuk:['Guru Satu'],izin:['Guru Dua'],belum:['Guru Tiga']});
  assert(!JSON.stringify(result).includes('rahasia'));
});
test('riwayat dua hari menentukan rute hari ini dan menunggu pimpinan dikecualikan',()=>{
  const student='Santri A';
  const reports=Object.fromEntries(['10','11','12'].map(d=>[d,{tanggal:'2026-11-'+d,dilaporkan:student,tipe:'Lapor Pelanggaran',kodePelanggaran:'DISIPLIN'}]));
  const data={reports,roster:{'Usrah 1':[student]}},now=new Date(date+'T12:00:00+07:00');
  assert.deepEqual(project(data,now,'putra').konselor,{muda:[],madya:[student]});
  reports['12'].caseV2={higherEscalation:{requestedAt:date}};
  assert.deepEqual(project(data,now,'putra').konselor,{muda:[],madya:[]});
});
