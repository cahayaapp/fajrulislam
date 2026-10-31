'use strict';
const R=require('../js/role-system-v2.js');
const assignments={GURU_PONDOK:{programDomain:'KEPONDOKAN'},GURU_PKBM:{programDomain:'PKBM'},NAQIB:{unit:'PUTRA'},NAQIBAH:{unit:'PUTRI'},KONSELOR:{unit:'PUTRA',level:'PEMULA'},MENTOR_USRAH:{usrahIds:['USRAH_3']},MANAJER:{area:'PENDIDIKAN',unit:'PUTRA',programDomain:'KEPONDOKAN',managedRoles:['GURU_PONDOK']},SUPERVISOR:{unit:'PUTRA',supervisedRoles:['GURU_PONDOK','NAQIB','MENTOR_USRAH','KONSELOR','DAPUR','MEDIA','SARPRAS','KESEHATAN','LAYANAN_KEBERSIHAN']},DIREKTUR:{unit:'ALL'},KESEHATAN:{},SARPRAS:{},LAYANAN_KEBERSIHAN:{},DAPUR:{},MEDIA:{},WALI_SANTRI:{namaAnak:'SANTRI FIXTURE'}};
const profile=(role,a=assignments[role])=>({uid:'navigation-fixture',username:'navigation-fixture',nama:'Pengguna Uji',namaAnak:'SANTRI FIXTURE',roleSystemVersion:2,roles:[role],defaultRole:role,assignments:{[role]:a},akses:['admin'],allowedMenus:['menu-users']});
const fixtures=R.ROLE_IDS.map(role=>({name:role,user:profile(role)}));
fixtures.push(
  {name:'MANAJER / PEMBINAAN_KARAKTER',user:profile('MANAJER',{area:'PEMBINAAN_KARAKTER',unit:'PUTRI',managedRoles:['NAQIBAH','MENTOR_USRAH','KONSELOR']})},
  {name:'MANAJER / PENDIDIKAN PUTRI',user:profile('MANAJER',{...assignments.MANAJER,unit:'PUTRI'})},
  {name:'SUPERVISOR / PENDIDIKAN',user:profile('SUPERVISOR',{unit:'PUTRI',supervisedRoles:['GURU_PONDOK'],divisionIds:['PENDIDIKAN']})},
  {name:'SUPERVISOR / PELAYANAN',user:profile('SUPERVISOR',{unit:'PUTRI',supervisedRoles:['LAYANAN_KEBERSIHAN'],divisionIds:['PELAYANAN']})},
  {name:'KONSELOR / MADYA PUTRI',user:profile('KONSELOR',{unit:'PUTRI',level:'MADYA'})},
  ...['KESEHATAN','SARPRAS','LAYANAN_KEBERSIHAN'].map(role=>({name:role+' / PUTRA terbatas',user:profile(role,{unit:'PUTRA'})}))
);
module.exports={fixtures,profile,assignments};
