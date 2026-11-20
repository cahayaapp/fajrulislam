import {registrationMarkup,readForm,fillForm,readReceipt,downloadReceipt} from './portal-forms.js?v=2';
import{createUserWithEmailAndPassword,signInWithEmailAndPassword,onAuthStateChanged,signOut,sendPasswordResetEmail}from'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import{auth,call,$,esc,message,busy,phone,errorMessage}from'./api.js?v=5';
import {loginIdentity, accountIdentity} from './identity.js?v=1';
let signup=new URLSearchParams(location.search).get('mode')==='signup',authBusy=false,application=null;
function authMode(){
 $('authTitle').textContent=signup?'Buat akun calon wali':'Masuk akun PSB';
 $('authSubmit').textContent=signup?'Buat akun':'Masuk';
 $('switchAuth').textContent=signup?'Sudah punya akun? Masuk':'Belum punya akun? Daftar';
 $('authHelp').textContent=signup?'Pilih email atau nomor HP sebagai identitas akun Anda.':'Masuk menggunakan email atau nomor HP yang dipilih saat mendaftar.';
 $('passwordLabelText').textContent=signup?'Nomor HP (password awal)':'Masukkan password';
 $('authForm').elements.phone.placeholder=signup?'Masukkan nomor HP':'Masukkan password';
 $('authForm').elements.phone.autocomplete=signup?'new-password':'current-password';
 $('resetPassword').hidden=signup; $('signupName').hidden=!signup;$('authForm').elements.studentName.required=signup;
 $('authNote').textContent=signup?'Nomor HP dalam format 08… menjadi password awal. Jika memilih nomor HP sebagai identitas, gunakan nomor yang sama pada kedua kolom. Nomor HP tidak diverifikasi melalui SMS.':'Akun email masuk dengan email; akun nomor HP masuk dengan nomor HP. Pemulihan melalui email hanya tersedia untuk akun email. Untuk akun nomor HP, hubungi pengurus jika lupa password.';
}
async function signIn(identity, password){
 try { return await signInWithEmailAndPassword(auth,identity.email,password); }
 catch(error){
  // Preserve existing initial passwords entered with +62 or spaces, without changing custom passwords.
  if(!['auth/invalid-credential','auth/wrong-password'].includes(error.code))throw error;
  let initial;try{initial=phone(password)}catch{throw error}
  if(initial===password)throw error;
  return signInWithEmailAndPassword(auth,identity.email,initial);
 }
}
function tab(name){closeMenu();document.querySelectorAll('[data-panel]').forEach(e=>e.hidden=e.dataset.panel!==name);document.querySelectorAll('[data-tab]').forEach(e=>{e.classList.toggle('active',e.dataset.tab===name);e.setAttribute('aria-pressed',String(e.dataset.tab===name))})}
function render(data,fill=true){application=data.application;$('authView').hidden=true;$('portal').hidden=false;$('logout').hidden=false;$('menuToggle').hidden=false;$('accountLabel').textContent=accountIdentity(application);$('applicationStatus').textContent=application.status==='SUBMITTED'?'Pendaftaran terkirim':'Pendaftaran belum dikirim';
 const name=application.profile?.studentName||application.registration?.studentName||'';
 $('greeting').textContent=name?`Assalamu ‘alaikum, ${name}.`:'Assalamu ‘alaikum.';
 if(fill){for(const key of ['registration','waliAssessment','santriAssessment'])$(`${key}Form`).reset();$('profileForm').elements.studentName.value=name;for(const key of ['registration','waliAssessment','santriAssessment'])fillForm($(`${key}Form`),key,application[key]);$('registrationForm').elements.studentName.value=name;}
 if(!application.santriAssessment?.sekolah)$('santriAssessmentForm').elements.sekolah.value=application.registration?.school||'';if(!application.waliAssessment?.waWali)$('waliAssessmentForm').elements.waWali.value=application.registration?.parentPhone||application.phone||'';if(!application.waliAssessment?.namaWali)$('waliAssessmentForm').elements.namaWali.value=application.registration?.parentName||'';$('santriAssessmentForm').elements.nama.value=name;$('waliAssessmentForm').elements.namaAnak.value=name;
 $('receiptStatus').textContent=application.receiptName?`Tersimpan: ${application.receiptName}`:'Belum ada bukti pembayaran.';$('viewReceipt').hidden=!application.receiptName;
 $('santri-valTekad').textContent=$('santri-skalaTekad').value;
 $('schedule').textContent=application.schedule?`${application.schedule.date.replace('T',' · ')} WIB\n${application.schedule.location}\n${application.schedule.note||''}`:'Jadwal tes belum diumumkan.';
 $('result').textContent=application.result?`${application.result.status.replaceAll('_',' ')}\n${application.result.message||''}`:'Hasil tes belum diumumkan.';
 $('announcements').innerHTML=data.announcements.length?data.announcements.map(a=>`<article class="card"><h3>${esc(a.title)}</h3><p class="detail">${esc(a.body)}</p></article>`).join(''):'<p>Belum ada pengumuman.</p>';
}
async function load(fill=true){const uid=auth.currentUser?.uid;const data=await call('get');if(uid&&auth.currentUser?.uid===uid)render(data,fill)}
$('switchAuth').onclick=()=>{signup=!signup;authMode()};
$('authForm').onsubmit=e=>{e.preventDefault();busy(e.target,async()=>{
 authBusy=true;
 try{
  const identity=loginIdentity(e.target.elements.email.value),raw=e.target.elements.phone.value;
  message(signup?'Membuat akun…':'Memeriksa akun…');
  if(signup){
   const mobile=phone(raw);if(!e.target.elements.studentName.value.trim())throw Error('Isi nama calon santri.');
   if(identity.type==='phone'&&identity.phone!==mobile)throw new Error('Gunakan nomor HP yang sama pada kolom identitas dan password awal.');
   await createUserWithEmailAndPassword(auth,identity.email,mobile);
   await call('register',{phone:mobile,studentName:e.target.elements.studentName.value});await auth.currentUser.getIdToken(true);
  }else{
   await signIn(identity,raw);
   try{await call('get')}catch(error){
    if(error.code!=='functions/not-found')throw error;
    await call('register',{phone:identity.phone||phone(raw)});await auth.currentUser.getIdToken(true);
   }
  }
  await load();e.target.elements.phone.value='';message('Akun PSB siap digunakan.');
 }finally{authBusy=false}
})};
$('resetPassword').onclick=()=>busy($('authView'),async()=>{
 const identity=loginIdentity($('authForm').elements.email.value);
 if(identity.type==='phone')throw new Error('Pemulihan lewat email tidak tersedia untuk akun nomor HP. Silakan hubungi pengurus PSB untuk bantuan.');
 await sendPasswordResetEmail(auth,identity.email);message('Jika email terdaftar, tautan penggantian password akan dikirim.');
});
$('logout').onclick=()=>busy(document.querySelector('header'),async()=>{await signOut(auth);message('Anda sudah keluar.')});
for(const key of ['registration','waliAssessment','santriAssessment'])$(`${key}Form`).onsubmit=e=>{e.preventDefault();busy(e.target,async()=>{const payload=readForm(e.target,key);if(key==='registration'){const receipt=await readReceipt($('receiptFile').files[0]);if(receipt)await call('receipt',receipt);}await call(key,payload);message('Data tersimpan.');await load(false)})};
$('submitApplication').onclick=()=>busy($('portal'),async()=>{await call('submit');await load(false);message('Pendaftaran terkirim untuk ditinjau pengurus.')});
$('refresh').onclick=()=>busy($('portal'),async()=>{await load(false);message('Pengumuman diperbarui.')});
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
onAuthStateChanged(auth,async user=>{if(authBusy)return;if(!user){application=null;closeMenu();$('menuToggle').hidden=true;$('portal').hidden=true;$('authView').hidden=false;$('logout').hidden=true;return}try{await load()}catch(e){$('logout').hidden=false;message(errorMessage(e),true)}});authMode();

$('registrationFields').innerHTML=registrationMarkup();
$('profileForm').onsubmit=e=>{e.preventDefault();busy(e.target,async()=>{await call('profile',{studentName:e.target.elements.studentName.value});await load();message('Profil diperbarui.');})};
$('viewReceipt').onclick=()=>busy($('registrationForm'),async()=>downloadReceipt((await call('getReceipt')).receipt));
$('santri-skalaTekad').oninput=e=>$('santri-valTekad').textContent=e.target.value;
for(const [form,name,exclusive] of [[$('registrationForm'),'diseases','Tidak ada'],[$('santriAssessmentForm'),'pelanggaranList','Bersih']])form.addEventListener('change',e=>{if(e.target.name!==name||!e.target.checked)return;for(const el of form.querySelectorAll(`[name="${name}"]`))if(el!==e.target&&(e.target.value===exclusive||el.value===exclusive))el.checked=false});
const sections=[['testimoni','Testimoni'],['alumni','Alumni'],['mengenal','Mengenal Pesantren'],['pengasuh','Pengasuh'],['pendidikan','Kurikulum'],['karakter','Penanaman karakter'],['minat-bakat','Minat & bakat'],['digital','Digitalisasi'],['jenjang','Jenjang pendidikan'],['jadwal-psb','Jadwal PSB'],['biaya-psb','Biaya PSB']];
let infoSection='testimoni';
$('infoTabs').innerHTML=sections.map(([id,label])=>`<button type="button" data-info="${id}" aria-pressed="${id===infoSection}">${label}</button>`).join('');
function info(id){if(!sections.some(s=>s[0]===id))return;infoSection=id;document.querySelectorAll('[data-info]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.info===id)));$('infoFrame').contentWindow.postMessage({type:'psb-section',id},location.origin)}
$('infoTabs').onclick=e=>{const b=e.target.closest('[data-info]');if(b)info(b.dataset.info)};
$('infoFrame').onload=()=>info(infoSection);
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==$('infoFrame').contentWindow)return;if(e.data?.type==='psb-ready')info(infoSection);if(e.data?.type==='psb-select')info(e.data.id);if(e.data?.type==='psb-register')tab('registration')});

// Mobile navigation keeps the existing menu cards in a dismissible drawer.
const mobileMenuQuery=window.matchMedia('(max-width:760px)');
function closeMenu(){
 const wasOpen=document.body.classList.contains('menu-open');
 document.body.classList.remove('menu-open');
 $('menuToggle').setAttribute('aria-expanded','false');
 $('menuBackdrop').hidden=true;
 $('portalMenu').removeAttribute('role');$('portalMenu').removeAttribute('aria-modal');
 if(wasOpen)$('menuToggle').focus();
}
$('menuToggle').onclick=()=>{
 if(!mobileMenuQuery.matches)return;
 if(document.body.classList.contains('menu-open')){closeMenu();return}
 document.body.classList.add('menu-open');$('menuBackdrop').hidden=false;
 $('menuToggle').setAttribute('aria-expanded','true');
 $('portalMenu').setAttribute('role','dialog');$('portalMenu').setAttribute('aria-modal','true');
 requestAnimationFrame(()=>{if(document.body.classList.contains('menu-open'))$('menuClose').focus()});
};
$('menuClose').onclick=closeMenu;$('menuBackdrop').onclick=closeMenu;
mobileMenuQuery.addEventListener('change',closeMenu);
document.addEventListener('keydown',e=>{
 if(!document.body.classList.contains('menu-open'))return;
 if(e.key==='Escape'){e.preventDefault();closeMenu()}
 if(e.key==='Tab'){
  const items=[...$('portalMenu').querySelectorAll('button')];
  const first=items[0],last=items[items.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
 }
});
