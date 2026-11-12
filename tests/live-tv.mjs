import assert from 'node:assert/strict';
import test from 'node:test';
import {project} from '../tools/live-tv.mjs';
const date='2026-11-12';
test('ringkasan harian memisahkan izin, belum absen, dan alfa; buka hanya bidang publik',()=>{
  const data={
    roster:{satu:['Satu','Dua','Tiga','Empat']},
    deposits:{a:{tanggal:date,program:'Tahfiz',data:[{nama:'SATU',setoran:'1–5',keterangan:'rahasia'}]},b:{tanggal:date,program:'Tahsin',data:[{nama:'Dua'}]}},
    lessons:{a:{tanggal:date,jamMulaiJadwal:'06:00',data:[{nama:'Satu',status:'Alfa'},{nama:'Dua',status:'Sakit'},{nama:'Tiga',status:'Belum Hadir'},{nama:'Empat',status:'Izin'}]},
      b:{tanggal:date,jamMulaiJadwal:'09:00',data:[{nama:'Satu',statusFinal:'Terlambat'}]}},
    staffLog:{a:{tanggal:date,namaGuru:'Guru Satu',guruKodeKalender:'A',statusKehadiran:'TEPAT_WAKTU',emailGuru:'rahasia'}},
    schedule:['A','B','C','D'].map((code,i)=>({hari:4,guruKode:code,guruNama:['Guru Satu','Guru Dua','Guru Tiga','Guru Empat'][i],jamMulai:i===3?'17:00':'07:00'})),
    leave:{x:{teacherCode:'B',teacherName:'Guru Dua',startDate:date,endDate:date,review:{status:'APPROVED'},reason:'rahasia'}}};
  const result=project(data,new Date(date+'T11:00:00+07:00'));
  assert.deepEqual(result.tahfiz.sudah,['Satu']);assert.equal(result.tahfiz.belum.length,3);
  assert.deepEqual(result.santri,{masuk:['Satu'],izin:['Empat'],sakit:['Dua'],alfa:[]});
  assert.deepEqual(result.guru,{masuk:['Guru Satu'],izin:['Guru Dua'],belum:['Guru Tiga']});
  assert(!JSON.stringify(result).includes('rahasia'));
});
