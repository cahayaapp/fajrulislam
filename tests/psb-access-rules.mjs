// Remote simulator only: does not deploy rules or modify application data.
// Run with FIREBASE_RULES_ACCESS_TOKEN and optionally FIREBASE_PROJECT_ID.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const token=process.env.FIREBASE_RULES_ACCESS_TOKEN;
assert(token,'Provide FIREBASE_RULES_ACCESS_TOKEN for the Firebase Rules simulator.');
const project=process.env.FIREBASE_PROJECT_ID||'absensi-santri-fajrul-islam';
const content=fs.readFileSync(new URL('../pembinaan/usrah-bersih.rules',import.meta.url),'utf8');
assert.equal(content,fs.readFileSync(new URL('../docs/pembinaan/usrah-bersih.rules',import.meta.url),'utf8'));
const testCases=JSON.parse(fs.readFileSync(new URL('./psb-access-cases.json',import.meta.url),'utf8'));
const response=await fetch(`https://firebaserules.googleapis.com/v1/projects/${project}:test`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({source:{files:[{name:'firestore.rules',content}]},testSuite:{testCases}})});
const result=await response.json();
assert(response.ok,JSON.stringify(result));
assert.equal(result.testResults?.length,testCases.length);
assert.deepEqual(result.testResults.map(r=>r.state),testCases.map(()=>'SUCCESS'));
console.log(`PSB access: ${testCases.length} Firebase Rules simulations PASS`);
