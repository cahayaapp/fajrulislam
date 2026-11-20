import assert from 'node:assert/strict';
import {schemas,cleanForm,validateForm} from '../psb/form-schema.js';
import {readReceipt} from '../psb/portal-forms.js';
function valid(key){return Object.fromEntries(schemas[key].map(f=>[f.name,f.type==='checkbox'?[Array.isArray(f.options[0])?f.options[0][0]:f.options[0]]:f.options?(Array.isArray(f.options[0])?f.options.find(o=>o[0])[0]:f.options[0]):f.type==='range'?'5':f.type==='number'?'45':f.type==='date'?'2012-01-01':'Contoh']))}
const registration=valid('registration');Object.assign(registration,{nisn:'-',studentNik:'1234567890123456',familyCardNumber:'1234567890123456',fatherNik:'-',motherNik:'1234567890123456',parentPhone:'081234567890'});
validateForm('registration',registration);
assert.throws(()=>validateForm('registration',{...registration,studentNik:'123'}),/16 digit/);
assert.throws(()=>validateForm('registration',{...registration,diseases:['Tidak ada','Alergi']}),/Pilih Tidak ada/);
assert.throws(()=>validateForm('registration',{...registration,studentName:''}),/Nama lengkap/);
assert.throws(()=>validateForm('registration',{...registration,fatherJob:'Injected option'}),/pilihan/);
for(const key of ['waliAssessment','santriAssessment']){const v=valid(key);validateForm(key,v);assert.deepEqual(cleanForm(key,v),v)}
const wali=valid('waliAssessment');assert.throws(()=>validateForm('waliAssessment',{...wali,agree:[]}),/Lengkapi/);
assert.throws(()=>validateForm('santriAssessment',{...valid('santriAssessment'),pelanggaranList:['Bersih','Merokok']}),/Anak Baik/);
assert.throws(()=>validateForm('santriAssessment',{...valid('santriAssessment'),skalaTekad:'11'}),/1–10/);
const d=cleanForm('registration',{...registration,admin:true,studentName:'  Contoh  '});assert.equal(d.studentName,'Contoh');assert.equal(d.admin,undefined);
await assert.rejects(()=>readReceipt(new File(['bad'],'fake.pdf',{type:'application/pdf'})),/Format/);
await assert.rejects(()=>readReceipt(new File([new Uint8Array(614401)],'large.pdf',{type:'application/pdf'})),/600 KB/);
const receipt=await readReceipt(new File(['%PDF-1.4 test'],'test.pdf',{type:'application/pdf'}));assert.equal(atob(receipt.data),'%PDF-1.4 test');
console.log('PASS: field completeness, choices, IDs, consent, conflict checks, sanitation, receipt signature and size.');
