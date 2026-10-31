(function(root){'use strict';
  const templates={
    shalat:['Ketepatan waktu berkumpul','Ketertiban saf','Kekhidmatan','Keterlibatan santri','Kesiapan imam/muadzin','Kebersihan dan kerapian masjid'],
    wirid:['Ketepatan mulai','Kekhidmatan','Keterlibatan santri','Ketertiban','Fokus dan ketenangan','Kelancaran pelaksanaan'],
    makan:['Ketepatan waktu','Ketertiban antrean','Adab makan','Keterlibatan santri','Kebersihan tempat setelah makan','Kelancaran distribusi'],
    quran:['Kesiapan santri','Ketepatan waktu','Ketertiban','Fokus','Keterlibatan','Kondisi tempat belajar'],
    kebersihan:['Kehadiran dan keterlibatan','Pembagian tugas','Kesungguhan','Ketertiban','Hasil kebersihan','Penyelesaian tepat waktu'],
    olahraga:['Keterlibatan','Ketertiban','Sportivitas','Keamanan','Ketepatan waktu','Transisi setelah kegiatan'],
    transisi:['Ketertiban','Antrean','Ketepatan waktu','Kebersihan area','Kelancaran transisi','Kesiapan menuju program berikutnya'],
    istirahat:['Ketertiban','Ketenangan','Ketepatan waktu','Kondisi kamar','Kesiapan bangun','Transisi program berikutnya'],
    generic:['Ketepatan waktu','Ketertiban','Keterlibatan santri','Kesiapan pelaksanaan','Kelancaran program','Kondisi tempat kegiatan']
  };
  const rules=[['shalat',/shalat|salat|jamaah|berjamaah/i],['wirid',/wirid|dzikir|zikir/i],['makan',/makan|sarapan|sahur|berbuka|buka puasa/i],['quran',/qur.?an|halqah|tahfiz|tahsin|tilawah/i],['kebersihan',/bersih|piket|kerja bakti/i],['olahraga',/olahraga|senam|futsal|sepak|badminton/i],['transisi',/mandi|transisi|persiapan|ganti pakaian/i],['istirahat',/istirahat|qailulah|tidur|bangun/i]];
  function resolve(name){const found=rules.find(([,re])=>re.test(String(name||''))),key=found?found[0]:'generic';return Object.freeze({key,items:Object.freeze(templates[key].map((label,index)=>Object.freeze({id:`${key}-${index+1}`,label})))});}
  const api=Object.freeze({resolve,templates:Object.freeze(templates)});root.CahayaNaqibReportTemplates=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
