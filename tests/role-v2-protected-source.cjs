// Approval snapshot captured before Phase 2B. Entry-only additions are allowed.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const expected={
  "home-guru.html": "5857a6827d56f71c852f613103dab39e545023dc847b6a5b777187704cd877aa",
  "home-direktur.html": "0039f2ace7da724e8468c8450d08ab86360921b95b9af27c25aa5ade4fee416f",
  "home-naqib.html": "6e6e28567665d3d0b96541258b2fd7ce7c39530b132d581554c19d668714e495",
  "guru/absensiPembelajaran.html": "ebb4ce9dd6db21d2fcf538620e371b9f6d9879efd8be6333d3faf82ab4b4e09c",
  "guru/inputNilaiUjian.html": "cb0aa3a338be64ad3d579a4b7a0e986d7f9aa53de4c984d9152d8bddb0095336",
  "wali/dashboard/script.js": "99d740bd76153bc73c26f344091efd4c1d6cafea08971727de5ba4d67e359053",
  "tools/role-v2-confirmed-plan.json": "9ffbe1f2cacd962d58bede49e6ce06babb59907009b8c30c1a23fa215e0f0b3c"
};
for(const [file,sha] of Object.entries(expected)){
 const text=fs.readFileSync(path.join(__dirname,'..',file),'utf8').replace(/<!-- ROLE_V2_ENTRY_START -->[\s\S]*?<!-- ROLE_V2_ENTRY_END -->/,'');
 assert.equal(crypto.createHash('sha256').update(text).digest('hex'),sha,file+' changed beyond entry hook');
}
console.log('PASS frozen Homes, Presensi, Nilai, Wali engine and prepared production payloads unchanged (except entry hooks)');
