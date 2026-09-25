'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('guru/inputNilaiUjian.html','utf8');
const pick=name=>{
  const match=source.match(new RegExp(`function ${name}\\([^]*?\\n  \\}`));
  assert(match,`fungsi ${name} tidak ditemukan`);
  return match[0];
};
const context={
  activeUser:{uid:'uid-guru-1',username:'guru.satu',nama:'Nama Lama',label:'Nama Tampilan Baru'},
  TEACHER_CODE_ALIASES:{G01:['Nama Lama']}
};
vm.createContext(context);
vm.runInContext([
  pick('normalizeTeacherIdentity'),
  pick('activeTeacherAccountKey'),
  pick('activeTeacherAliases'),
  pick('teacherMatchesSession'),
  pick('teacherRecordMatchesSession')
].join('\n'),context);

const params={guru:'Nama Tampilan Baru',guruKode:'G01',guruUid:'uid-guru-1',guruAccountKey:'uid-guru-1',guruAliases:context.activeTeacherAliases()};
assert.equal(context.teacherRecordMatchesSession({guruKode:'G01',guru_penguji:'Nama Lama'},params),true,'guruKode stabil harus mengalahkan perubahan nama tampilan');
assert.equal(context.teacherRecordMatchesSession({guruKode:'G02',guru_penguji:'Nama Tampilan Baru'},params),false,'kode guru berbeda tidak boleh tersambung');
assert.equal(context.teacherRecordMatchesSession({guruUid:'uid-guru-1',guru_penguji:'Nama Lama'}, {...params,guruKode:''}),true,'UID stabil harus cocok');
assert.equal(context.teacherRecordMatchesSession({guruAccountKey:'guru.satu',guru_penguji:'Nama Lama'}, {...params,guruKode:'',guruUid:'',guruAccountKey:'guru.satu'}),true,'account key stabil harus cocok');
assert.equal(context.teacherRecordMatchesSession({guru_penguji:'Nama Lama'}, {...params,guruKode:'',guruUid:'',guruAccountKey:''}),true,'nama lama tetap terbaca dari alias akun');

for(const field of ['guruUid: params.guruUid','guruAccountKey: params.guruAccountKey','teacherRecordMatchesSession(record, params)'])assert(source.includes(field),field);
console.log('PASS nilai tetap terhubung setelah nama tampilan guru berubah: guruKode, UID, account key, dan alias legacy.');
