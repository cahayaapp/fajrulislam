const assert=require('node:assert/strict'),C=require('../js/sertifikat-setoran-core.js');
const rows=C.students({'Kelas 4 Putra':['GHOZY FATHURRAHMAN'],'Kelas 5 Putra':{id1:{id:'stable',nama:'Santri Kedua'}},'PKBM X':['GHOZY FATHURRAHMAN']});assert.equal(rows.length,2);
const input={studentKey:rows[0].key,jumlahJuz:'5',nilai:'95',tanggal:'2026-11-05'};
assert.equal(C.validate(input,rows).jumlahJuz,5);
for(const patch of [{studentKey:'unknown'},{jumlahJuz:0},{jumlahJuz:31},{jumlahJuz:1.5},{nilai:''},{nilai:101},{nilai:-1},{tanggal:'2026-02-30'}])assert.throws(()=>C.validate({...input,...patch},rows));
assert.equal(C.validate({...input,nilai:'0'},rows).nilai,0);
console.log('PASS database roster, stable IDs, invalid/empty inputs, date and range validation');
