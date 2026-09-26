(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CahayaHolidayJournalV1=api})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const ACTIVITIES=Object.freeze([
    'Shalat Tahajjud','Wirid Pagi','Wirid Petang','Ngaji Bersama Keluarga',
    'Mengulang Pelajaran Bersama Keluarga','Sholat Zuhur','Sholat Ashar',
    'Sholat Maghrib','Sholat Isya','Sholat Subuh','Membersihkan/Merapikan Rumah',
    'Membantu Pekerjaan Orang Tua'
  ].map((label,index)=>Object.freeze({id:`aktivitas_${index+1}`,label})));
  const QUESTIONS=Object.freeze([
    'Pelajaran apa saja yang paling menantang/kesulitan bagimu selama triwulan 1 kemarin?',
    'Apa yang akan kamu lakukan agar bisa lebih baik dalam pelajaran itu?',
    'Siapa teman yang bisa membantumu agar lebih baik dalam triwulan 2 nanti?',
    'Apa target terbesarmu yang ingin kamu capai di pondok untuk triwulan 2?',
    'Bagaimana caramu agar bisa mencapai target itu?',
    'Kalau kamu lagi lelah, tidak semangat, atau bermalas-malasan, apa yang bisa kamu lakukan agar kembali bersemangat lagi?',
    'Apa yang bisa ayah/ibu bantu kamu agar bisa lebih baik di triwulan 2 nanti?'
  ].map((label,index)=>Object.freeze({id:`jawaban_${index+1}`,label})));
  function key(value){return String(value??'').trim().replace(/[.#$\[\]/]/g,'_')}
  function dateKey(value){const text=String(value||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(text))throw new Error('INVALID_DATE');return text}
  function activityPath(studentKey,date){const student=key(studentKey);if(!student)throw new Error('STUDENT_KEY_REQUIRED');return`cahaya_app/jurnal_liburan/aktivitas_harian/${student}/${dateKey(date)}`}
  function reportPath(studentKey,period='triwulan_1_ke_2'){const student=key(studentKey),p=key(period);if(!student||!p)throw new Error('REPORT_KEY_REQUIRED');return`cahaya_app/jurnal_liburan/bedah_rapor/${student}/${p}`}
  function normalizeChecks(value={}){return Object.fromEntries(ACTIVITIES.map(item=>[item.id,value[item.id]===true]))}
  function normalizeAnswers(value={}){return Object.fromEntries(QUESTIONS.map(item=>[item.id,String(value[item.id]??'').trim()]))}
  function activityProgress(value={}){const checks=normalizeChecks(value);const completed=Object.values(checks).filter(Boolean).length;return{completed,total:ACTIVITIES.length,percent:Math.round(completed/ACTIVITIES.length*100)}}
  function reportProgress(value={}){const answers=normalizeAnswers(value);const completed=Object.values(answers).filter(Boolean).length;return{completed,total:QUESTIONS.length,complete:completed===QUESTIONS.length}}
  return Object.freeze({version:1,period:'triwulan_1_ke_2',ACTIVITIES,QUESTIONS,key,dateKey,activityPath,reportPath,normalizeChecks,normalizeAnswers,activityProgress,reportProgress});
});
