const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Face=require('../dev/face-attendance-poc-core.js'),Multi=require('../dev/face-attendance-multidevice-core.js'),Server=require('../push-backend/functions/face-attendance-poc-core.js');

const vector=index=>Array.from({length:Server.EMBEDDING_LENGTH},(_,position)=>position===index?1:0);
const admin={active:true,internal:true,roles:['ADMIN']},naqibB={active:true,internal:true,roles:['NAQIB']},naqibC={active:true,internal:true,roles:['NAQIB']},wali={active:true,internal:false,roles:['WALI_SANTRI']};
const program={active:true,name:'Shalat Subuh Putra',timeZone:'Asia/Jakarta',onTimeCutoff:'04:45:00',scanCloseTime:'06:00:00',roster:{'student:a':true},allowedNaqibUids:{'naqib-b':true,'naqib-c':true},version:1};
assert.equal(Server.canEnroll(admin),true);assert.equal(Server.canEnroll(naqibB),false);assert.equal(Server.canScan(naqibB),true);assert.equal(Server.canScan(wali),false);
assert.equal(Server.authorizedForProgram(naqibB,program,'naqib-b'),true);assert.equal(Server.authorizedForProgram(naqibB,program,'naqib-x'),false);

const enrollment={studentKey:'student:a',studentName:'SANTRI A',className:'Kelas 1 Putra',modelVersion:Server.MODEL_VERSION,embeddingVersion:Server.EMBEDDING_VERSION,samples:[vector(0),vector(0),vector(0),vector(0)],centroid:vector(0),templateHash:'hash-v1'};
const profileV1=Server.nextProfile(enrollment,{}, {uid:'admin-a'},1000);assert.equal(profileV1.profileVersion,1);assert.equal(profileV1.rawImageStored,false);
const central={'student:a':profileV1};
const remoteFor=deviceUid=>{assert.equal(Server.authorizedForProgram(deviceUid==='naqib-b'?naqibB:naqibC,program,deviceUid),true);return {program:{id:'shalat-subuh-putra',version:program.version},modelVersion:Server.MODEL_VERSION,embeddingVersion:Server.EMBEDDING_VERSION,syncedAt:2000,profiles:Server.scopedProfiles(central,program)}};

// Device B and C start empty: both receive the same centrally enrolled profile.
let cacheB=Multi.cacheDecision([],remoteFor('naqib-b'),{modelVersion:Server.MODEL_VERSION,embeddingVersion:Server.EMBEDDING_VERSION});
let cacheC=Multi.cacheDecision([],remoteFor('naqib-c'),{modelVersion:Server.MODEL_VERSION,embeddingVersion:Server.EMBEDDING_VERSION});
assert.equal(cacheB.compatible,true);assert.equal(cacheC.compatible,true);assert.equal(cacheB.profiles[0].profileVersion,1);assert.equal(cacheC.profiles[0].profileVersion,1);
assert.equal(Face.matchEmbedding(vector(0),cacheB.profiles,{threshold:.82,minMargin:.04}).studentKey,'student:a');
assert.equal(Face.matchEmbedding(vector(0),cacheC.profiles,{threshold:.82,minMargin:.04}).studentKey,'student:a');

// Re-enrollment on Device A wins over both device caches.
const profileV2=Server.nextProfile({...enrollment,samples:[vector(1),vector(1),vector(1),vector(1)],centroid:vector(1),templateHash:'hash-v2'},profileV1,{uid:'admin-a'},3000);central['student:a']=profileV2;program.version=2;
cacheB=Multi.cacheDecision(cacheB.profiles,remoteFor('naqib-b'),{modelVersion:Server.MODEL_VERSION,embeddingVersion:Server.EMBEDDING_VERSION});
cacheC=Multi.cacheDecision(cacheC.profiles,remoteFor('naqib-c'),{modelVersion:Server.MODEL_VERSION,embeddingVersion:Server.EMBEDDING_VERSION});
assert.deepEqual(cacheB.changed,['student:a']);assert.deepEqual(cacheC.changed,['student:a']);assert.equal(cacheB.profiles[0].profileVersion,2);assert.equal(Face.matchEmbedding(vector(1),cacheB.profiles,{threshold:.82,minMargin:.04}).recognized,true);

// Clearing Device B cache requires no re-enrollment; sync restores v2.
cacheB=Multi.cacheDecision([],remoteFor('naqib-b'),{modelVersion:Server.MODEL_VERSION,embeddingVersion:Server.EMBEDDING_VERSION});assert.equal(cacheB.profiles[0].profileVersion,2);
const incompatible=Multi.cacheDecision(cacheB.profiles,{...remoteFor('naqib-b'),modelVersion:'different-model'},{modelVersion:Server.MODEL_VERSION,embeddingVersion:Server.EMBEDDING_VERSION});assert.equal(incompatible.compatible,false);assert.equal(incompatible.profiles.length,0);

// Offline recognition queues an idempotent record; backend gives server/review metadata at sync.
const offline=Multi.pendingRecord({sessionId:'session-1',programId:'shalat-subuh-putra',studentKey:'student:a',deviceId:'device-b',sessionDeviceId:'device-b-session',recognitionTimestamp:new Date('2026-09-26T04:41:00+07:00').getTime(),status:'HADIR',confidence:91,modelVersion:Server.MODEL_VERSION,recognitionMethod:'human-faceres-local'});
assert.equal(offline.pendingSync,true);assert(offline.submissionId);
const received=new Date('2026-09-26T04:50:00+07:00').getTime(),serverRecord=Server.sanitizeCheckIn(offline,program,received);assert.equal(serverRecord.requiresReview,true);assert.equal(serverRecord.timeBasis,'CLIENT_OFFLINE_REQUIRES_REVIEW');assert.equal(serverRecord.status,'HADIR');assert.equal(serverRecord.rawImageStored,false);

const rules=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../firebase-rtdb-rules-cahaya-app-v20.json'),'utf8')).rules;
assert.equal(rules.cahaya_app.face_attendance_poc['.read'],false);assert.equal(rules.cahaya_app.face_attendance_poc['.write'],false);
const functionsSource=fs.readFileSync(path.resolve(__dirname,'../push-backend/functions/index.js'),'utf8');
for(const name of ['getFaceAttendancePocContext','saveFaceProfilePoc','listFaceProfilesPoc','syncFaceProfilesPoc','submitFaceCheckInPoc'])assert(functionsSource.includes(`exports.${name}`));
console.log('PASS multi-device POC: A enrollment -> B/C sync+recognition, cache restore, re-enrollment version update, model invalidation, offline queue, trusted status, scoped roles and direct RTDB deny');
