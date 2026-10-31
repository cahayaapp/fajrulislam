const assert=require('node:assert/strict');
const fs=require('node:fs');

const home=fs.readFileSync('js/mobile-home-v2.js','utf8');
const session=fs.readFileSync('wali/dashboard/script.js','utf8');
const css=fs.readFileSync('css/mobile-home-v2.css','utf8');
const usrahMaster=fs.readFileSync('js/data-usrah.js','utf8');

assert.match(home,/data-mh-id="mentor-contact"/);
assert.match(home,/Informasi Mentor/);
assert.match(home,/Kirim Pesan WhatsApp/);
assert.match(home,/6285269888294/);
assert.match(home,/6287797340185/);
assert.match(home,/6283850534127/);
assert.match(home,/6281929623700/);
assert.match(home,/6289699984195/);
assert.match(home,/6287838723032/);
assert.match(home,/'Usrah 1':\[\{id:'DANDI',role:'Mentor Usrah'\}\]/);
assert.match(home,/'Usrah 2':\[\{id:'DANDI',role:'Mentor Usrah'\}\]/);
assert.match(home,/'Usrah 3':\[\{id:'BENNY',role:'Mentor Usrah'\}\]/);
assert.match(home,/'Usrah 4':\[\{id:'BENNY',role:'Mentor Usrah'\}\]/);
assert.match(home,/'Usrah 5':\[\{id:'DONY',role:'Mentor Usrah'\}\]/);
assert.match(home,/'Usrah 6':\[\{id:'DONY',role:'Mentor Usrah'\}\]/);
assert.match(home,/'Usrah 7':\[\{id:'ALAMANDA',role:'Mentor Kelompok'\},\{id:'DINI',role:'Mentor Individu'\}\]/);
assert.match(home,/'Usrah 8':\[\{id:'FATIMAH',role:'Mentor Kelompok'\},\{id:'DINI',role:'Mentor Individu'\}\]/);
assert.match(home,/\$\{wali\?'':`<button type="button" class="mh-role"/,'Wali role pill must not be rendered on Wali Home.');
assert.match(home,/assignedMentors\(usrah\)/);
assert.match(home,/findStudentUsrah\(window\.CAHAYA_MASTER_DATA\.usrah,childName\)/);
assert.match(home,/resolveStudentIdentity\(dbRT,childName,student\)/);
assert.match(home,/normalizeUsrahLabel\(identity\?\.usrah\)/);
assert.match(usrahMaster,/"Usrah 6":\s*\[[\s\S]*?"MEDIKA PRATAMA"/);
assert.match(home,/readRTDB\(dbRT,'cahaya_app\/log_mentoring_naqib'/);
assert.match(home,/!mentorName&&window\.CahayaWaliSession/);
assert.match(home,/namesMatch\(recordChild,childName\)/);
assert.doesNotMatch(home,/mentorContacts\.map\(/,'Popup must not render every mentor contact.');
assert.match(session,/child\.namaMentor/);
assert.match(session,/namaMentor:\s*cleanText/);
assert.match(css,/\.mh-mentor-dialog/);
assert.match(css,/\.mh-whatsapp/);

for(const [source,mirror] of [
  ['js/mobile-home-v2.js','docs/js/mobile-home-v2.js'],
  ['css/mobile-home-v2.css','docs/css/mobile-home-v2.css'],
  ['wali/dashboard/script.js','docs/wali/dashboard/script.js'],
  ['js/cahaya-ui-v2.js','docs/js/cahaya-ui-v2.js']
]) assert.equal(fs.readFileSync(source,'utf8'),fs.readFileSync(mirror,'utf8'),`${source} mirror differs`);

console.log('wali-mentor-contact-v1: ok');
