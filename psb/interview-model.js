import {schemas} from './form-schema.js';
import {displayAnswer} from './staff-model.js';
export const interviewSections=[
 ['catatan_niat','Niat & Pendorong','santriAssessment',['skalaTekad','pendorong'],'Apakah calon santri benar-benar ingin mondok atas kemauannya sendiri?'],
 ['catatan_ibadah','Praktik Ibadah (Shalat & Baca Qur’an)','santriAssessment',['shalat','ngaji'],'Catat hasil tes baca Al-Qur’an, tajwid, dan praktik shalat.'],
 ['catatan_emosi','Karakter Sosial & Emosi','santriAssessment',['responEjek','pernahBully'],'Bagaimana adab dan respons calon santri saat diwawancara?'],
 ['catatan_pandangan_pelanggaran','Pandangan, Harapan & Riwayat Pelanggaran','santriAssessment',['sukaPondok','takutPondok','pelanggaranList'],'Gali harapan, kekhawatiran, dan riwayat pelanggaran.'],
 ['catatan_potensi','Potensi Diri / Bakat','santriAssessment',['kelebihan'],'Klarifikasi bakat dan kelebihan calon santri.'],
 ['catatan_kesehatan_wali','Motivasi Wali & Riwayat Kesehatan Anak','waliAssessment',['motivasiWali','penyakit'],'Klarifikasi motivasi serta kebutuhan kesehatan dan alergi anak.'],
 ['catatan_kepatuhan_wali','Komitmen Kepatuhan & Evaluasi Perilaku','waliAssessment',['sikap','pelanggaran'],'Klarifikasi kesiapan wali mengikuti sistem evaluasi pendidikan pesantren.'],
 ['catatan_komitmen_wali','Komitmen Kehadiran & Keuangan (SPP)','waliAssessment',['keuangan','hadir'],'Catat kesanggupan pembayaran SPP dan kendala kehadiran.']
];
export const interviewStatuses=['DITERIMA','CADANGAN','DITOLAK'];
export function cleanInterview(p){
 const fields=['date','interviewer','notes','recommendation','catatan_global',...interviewSections.map(x=>x[0])];
 const out=Object.fromEntries(fields.map(k=>[k,String(p[k]??'').trim()]));
 if(!/^\d{4}-\d{2}-\d{2}$/.test(out.date)||!out.interviewer||!out.catatan_global)throw Error('Lengkapi tanggal, pewawancara, dan catatan kesimpulan.');
 if(fields.some(k=>out[k].length>2000))throw Error('Catatan maksimal 2.000 karakter per bagian.');
 if(!interviewStatuses.includes(p.status_kelulusan))throw Error('Pilih rekomendasi kelulusan.');
 return {...out,status_kelulusan:p.status_kelulusan,version:2};
}
export function initialAnswers(d,key,names){return names.map(name=>{const f=schemas[key].find(f=>f.name===name);return [f?.label||name,displayAnswer(f||{},d[key]?.[name])]});}
export function filterInterviews(rows,q='',status='',sort='newest'){
 const found=rows.filter(d=>{const i=d.interview||{};return (!status||i.status_kelulusan===status)&&JSON.stringify([d.profile,d.registration?.studentName,d.waliAssessment?.namaWali,i]).toLowerCase().includes(q.trim().toLowerCase())});
 return found.sort((a,b)=>sort==='name'?(a.profile?.studentName||a.registration?.studentName||'').localeCompare(b.profile?.studentName||b.registration?.studentName||'','id'):(sort==='oldest'?1:-1)*String(a.interview.updatedAt||a.interview.date||'').localeCompare(String(b.interview.updatedAt||b.interview.date||'')));
}
