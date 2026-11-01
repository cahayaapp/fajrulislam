/* Explicit, idempotent assignment migration. Never changes IDs or attendance history. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CahayaTeacherReassignment=api})(typeof window!=='undefined'?window:globalThis,function(){
  const version='20261101-kelas2-zawawi-zaky',names={ZAKY:'Zaky',ZAWAWI:'Muhammad Zawawi',DONY:'Dony Setiawan',MULTAZAM:'Multazam'};
  const norm=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  function target(row){
    const teacher=String(row.guruKode||row.teacherCode||'').toUpperCase(),subject=norm(row.mapel||row.mataPelajaran),cls=String(row.kelas||'');
    if(teacher==='MULTAZAM'&&subject==='haditsahkam')return 'ZAWAWI';
    if(['NAQIEB','ZAWAWI'].includes(teacher)&&subject==='adab'&&cls==='Kelas 2 Putra')return 'ZAKY';
    if(teacher==='NAQIEB'&&subject==='adab'&&cls==='Kelas 3 Putra')return 'ZAWAWI';
    if(teacher==='FAIQ'&&subject==='hadits'&&/^Kelas [23] Putra$/i.test(cls))return 'ZAWAWI';
    if(teacher==='FAIQ'&&subject==='aqidah'&&/^Kelas 1 Putra$/i.test(cls))return 'DONY';
    if(teacher==='FAIQ'&&/^alquran$/.test(subject))return 'MULTAZAM';
    return '';
  }
  function patch(row){
    const code=target(row),result={};
    if(code){result.guruKode=code;result.guruNama=names[code];for(const key of ['teacherCode','kodeGuru','guruKodeKalender'])if(key in row)result[key]=code;for(const key of ['namaGuru','guru','teacher'])if(key in row)result[key]=names[code]}
    const teacher=code||row.guruKode,subject=norm(row.mapel||row.mataPelajaran),cls=row.kelas;
    if(teacher==='ZAWAWI'&&subject==='haditsahkam'&&['Kelas 4 Putra','Kelas 5 Putra','Kelas 4 Putri'].includes(cls)&&Number(row.hari)===2){result.hari=4;result.hariLabel='Kamis'}
    if(Number(row.hari)===4&&((cls==='Kelas 4 Putra'&&subject==='shirah'&&teacher==='RAHIEL')||(cls==='Kelas 5 Putra'&&subject==='manajemendanbisnis'&&teacher==='MULTAZAM'))){result.hari=2;result.hariLabel='Selasa'}
    if(cls==='Kelas 2 Putra'&&subject==='hadits'&&teacher==='ZAWAWI'&&Number(row.hari)===4){result.hari=2;result.hariLabel='Selasa'}
    if(cls==='Kelas 2 Putra'&&subject==='adab'&&teacher==='ZAKY'&&Number(row.hari)===2){result.hari=4;result.hariLabel='Kamis'}
    return Object.keys(result).length?result:null;
  }

  return Object.freeze({version,names,target,patch});
});
