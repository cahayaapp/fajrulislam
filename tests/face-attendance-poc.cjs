const assert=require('node:assert/strict');
const Core=require('../dev/face-attendance-poc-core.js');

const enrollments=[
  {studentKey:'student:a',studentName:'SANTRI A',samples:[[1,0,0,0],[.98,.05,0,0]],centroid:[.99,.025,0,0]},
  {studentKey:'student:b',studentName:'SANTRI B',samples:[[0,1,0,0],[.02,.99,.02,0]],centroid:[.01,.995,.01,0]},
  {studentKey:'student:c',studentName:'SANTRI C',samples:[[0,0,1,0]],centroid:[0,0,1,0]},
  {studentKey:'student:d',studentName:'SANTRI D',samples:[[0,0,0,1]],centroid:[0,0,0,1]},
  {studentKey:'student:e',studentName:'SANTRI E',samples:[[.7,.7,0,0]],centroid:[.7,.7,0,0]}
];

const a=Core.matchEmbedding([.99,.02,0,0],enrollments,{threshold:.82,minMargin:.04});
assert.equal(a.recognized,true);assert.equal(a.studentKey,'student:a');
const b=Core.matchEmbedding([.01,.99,.01,0],enrollments,{threshold:.82,minMargin:.04});
assert.equal(b.studentKey,'student:b');assert.notEqual(b.studentKey,a.studentKey);
const unknown=Core.matchEmbedding([0,0,0,0],enrollments,{threshold:.82,minMargin:.04});
assert.equal(unknown.recognized,false);assert.match(unknown.reason,/BELOW_THRESHOLD|AMBIGUOUS/);

const before=Core.createSession({sessionId:'subuh:2026-09-26:a',cutoff:'04:45:00',now:new Date('2026-09-26T04:00:00+07:00')});
let result=Core.checkIn(before,a,{now:new Date('2026-09-26T04:41:00+07:00')});
assert.equal(result.created,true);assert.equal(result.record.status,'HADIR');
result=Core.checkIn(before,a,{now:new Date('2026-09-26T04:44:00+07:00')});
assert.equal(result.created,false);assert.equal(result.reason,'DUPLICATE');assert.equal(Object.keys(before.checkIns).length,1);assert.equal(before.checkIns['student:a'].scanTime,'04:41:00');
const late=Core.checkIn(before,b,{now:new Date('2026-09-26T04:48:00+07:00')});
assert.equal(late.record.status,'TERLAMBAT');

const next=Core.createSession({sessionId:'subuh:2026-09-27:b',cutoff:'04:45:00',now:new Date('2026-09-27T04:00:00+07:00')});
assert.equal(Object.keys(next.checkIns).length,0);assert.notEqual(next.sessionId,before.sessionId);

const tracker=Core.createLivenessTracker({livenessFrames:3,yawMovement:.12,minReal:.5,minLive:.5});
tracker.add({rotation:{angle:{yaw:-.08}},real:.8,live:.8});tracker.add({rotation:{angle:{yaw:0}},real:.82,live:.81});
assert.equal(tracker.add({rotation:{angle:{yaw:.08}},real:.79,live:.83}).passed,true);
const spoof=Core.createLivenessTracker({livenessFrames:3,yawMovement:.12,minReal:.5,minLive:.5});
spoof.add({rotation:{angle:{yaw:-.1}},real:.2,live:.8});spoof.add({rotation:{angle:{yaw:0}},real:.2,live:.8});
assert.equal(spoof.add({rotation:{angle:{yaw:.1}},real:.2,live:.8}).passed,false);

assert.equal(Core.meanEmbedding([[1,0],[0,1]])[0],.5);
console.log('PASS face POC: 5 identities, A/B separation, unknown rejection, cutoff, duplicate, session isolation, liveness and spoof-risk logic');
