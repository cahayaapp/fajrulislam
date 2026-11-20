import{createUserWithEmailAndPassword,signInWithEmailAndPassword,onAuthStateChanged,signOut,sendPasswordResetEmail}from'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import{auth,call,$,esc,message,busy,phone,errorMessage}from'./api.js?v=3';
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
 $('resetPassword').hidden=signup;
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
function tab(name){document.querySelectorAll('[data-panel]').forEach(e=>e.hidden=e.dataset.panel!==name);document.querySelectorAll('[data-tab]').forEach(e=>{e.classList.toggle('active',e.dataset.tab===name);e.setAttribute('aria-pressed',String(e.dataset.tab===name))})}
function render(data,fill=true){application=data.application;$('authView').hidden=true;$('portal').hidden=false;$('logout').hidden=false;$('accountLabel').textContent=accountIdentity(application);$('applicationStatus').textContent=application.status==='SUBMITTED'?'Pendaftaran terkirim':'Pendaftaran belum dikirim';
 if(fill)for(const key of ['registration','waliAssessment','santriAssessment'])for(const field of $(`${key}Form`).elements)if(field.name)field.value=application[key]?.[field.name]||'';
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
   const mobile=phone(raw);
   if(identity.type==='phone'&&identity.phone!==mobile)throw new Error('Gunakan nomor HP yang sama pada kolom identitas dan password awal.');
   await createUserWithEmailAndPassword(auth,identity.email,mobile);
   await call('register',{phone:mobile});await auth.currentUser.getIdToken(true);
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
for(const key of ['registration','waliAssessment','santriAssessment'])$(`${key}Form`).onsubmit=e=>{e.preventDefault();busy(e.target,async()=>{await call(key,Object.fromEntries(new FormData(e.target)));message('Data tersimpan.');await load(false)})};
$('submitApplication').onclick=()=>busy($('portal'),async()=>{await call('submit');await load(false);message('Pendaftaran terkirim untuk ditinjau pengurus.')});
$('refresh').onclick=()=>busy($('portal'),async()=>{await load(false);message('Pengumuman diperbarui.')});
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
onAuthStateChanged(auth,async user=>{if(authBusy)return;if(!user){application=null;$('portal').hidden=true;$('authView').hidden=false;$('logout').hidden=true;return}try{await load()}catch(e){$('logout').hidden=false;message(errorMessage(e),true)}});authMode();
