import{initializeApp,getApps,getApp}from'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import{getAuth}from'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import{getFirestore,doc,collection,getDoc,getDocs,setDoc,updateDoc,addDoc,query,orderBy,limit,runTransaction,writeBatch,serverTimestamp}from'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
const app=getApps().length?getApp():initializeApp(window.CAHAYA_CONFIG.firebase);
export const auth=getAuth(app);const db=getFirestore(app);
const clean=(v,max=2000)=>String(v??'').trim().slice(0,max);
const values=(v,fields)=>Object.fromEntries(fields.map(k=>[k,clean(v[k],k==='address'?600:2000)]));
export async function call(action,payload={}){
 const user=auth.currentUser;if(!user)throw Error('Silakan masuk terlebih dahulu.');
 const own=doc(db,'psb_applications',user.uid),target=doc(db,'psb_applications',payload.uid||user.uid);
 if(action==='register'){
  const mobile=phone(payload.phone);await runTransaction(db,async tx=>{const snap=await tx.get(own);if(!snap.exists())tx.set(own,{uid:user.uid,email:user.email,phone:mobile,status:'DRAFT',createdAt:serverTimestamp(),updatedAt:serverTimestamp(),contentVersion:'DUMMY_V1'})});return{ok:true};
 }
 if(action==='get'){
  const snap=await getDoc(own);if(!snap.exists())throw Object.assign(Error('Akun belum terdaftar sebagai calon wali.'),{code:'functions/not-found'});
  const [updates,announcements]=await Promise.all([getDoc(doc(db,'psb_updates',user.uid)),getDocs(query(collection(db,'psb_announcements'),orderBy('createdAt','desc'),limit(30)))]);
  return{application:{...snap.data(),...updates.data()},announcements:announcements.docs.map(d=>({id:d.id,...d.data()}))};
 }
 if(['registration','waliAssessment','santriAssessment'].includes(action)){
  const data=action==='registration'?values(payload,['parentName','studentName','school','level','address']):values(payload,['motivation','readiness','support']);await updateDoc(own,{[action]:data,updatedAt:serverTimestamp()});return{ok:true};
 }
 if(action==='submit'){
  await runTransaction(db,async tx=>{const snap=await tx.get(own),d=snap.data();if(!d?.registration?.parentName||!d.registration?.studentName||!d.registration?.level||!d.waliAssessment?.motivation||!d.santriAssessment?.motivation)throw Error('Lengkapi pendaftaran dan kedua asesmen sebelum mengirim.');tx.update(own,{status:'SUBMITTED',submittedAt:serverTimestamp(),updatedAt:serverTimestamp()})});return{ok:true};
 }
 if(action==='list'){const snap=await getDocs(query(collection(db,'psb_applications'),orderBy('createdAt','desc'),limit(300)));return{applications:snap.docs.map(d=>d.data())}}
 if(action==='detail'){const [snap,review,updates]=await Promise.all([getDoc(target),getDoc(doc(db,'psb_reviews',payload.uid)),getDoc(doc(db,'psb_updates',payload.uid))]);if(!snap.exists())throw Error('Pendaftar tidak ditemukan.');return{application:{...snap.data(),...updates.data(),...review.data()}}}
 if(action==='interview'){await setDoc(doc(db,'psb_reviews',payload.uid),{interview:{...values(payload,['date','interviewer','notes','recommendation']),updatedBy:user.uid,updatedAt:new Date().toISOString()}},{merge:true});return{ok:true}}
 if(action==='schedule'){await setDoc(doc(db,'psb_updates',payload.uid),{schedule:values(payload,['date','location','note'])},{merge:true});return{ok:true}}
 if(action==='result'){const result={...values(payload,['status','message']),published:payload.published===true,updatedAt:new Date().toISOString()},batch=writeBatch(db);batch.set(doc(db,'psb_reviews',payload.uid),{result},{merge:true});batch.set(doc(db,'psb_updates',payload.uid),{result:result.published?result:null},{merge:true});await batch.commit();return{ok:true}}
 if(action==='announce'){await addDoc(collection(db,'psb_announcements'),{...values(payload,['title','body']),createdAt:serverTimestamp(),createdBy:user.uid});return{ok:true}}
 throw Error('Tindakan tidak dikenal.');
}
export const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function errorMessage(e){return ({'permission-denied':'Akses PSB belum tersedia untuk akun ini. Akun multazam perlu keluar lalu masuk kembali.','unavailable':'Koneksi database belum tersedia. Coba lagi nanti.','auth/email-already-in-use':'Email sudah terdaftar. Silakan masuk.','auth/invalid-email':'Periksa kembali alamat email.','auth/invalid-credential':'Email atau kata sandi tidak sesuai.','auth/wrong-password':'Email atau kata sandi tidak sesuai.','auth/weak-password':'Kata sandi belum memenuhi ketentuan akun.','auth/too-many-requests':'Terlalu banyak percobaan. Coba beberapa saat lagi.','functions/unavailable':'Layanan PSB belum tersedia. Coba lagi nanti.','functions/internal':'Layanan PSB belum siap. Hubungi pengurus.'})[e.code]||e.message||'Belum berhasil. Silakan coba lagi.'}
export function message(text,error=false){$('message').textContent=text;$('message').classList.toggle('error',error)}
export async function busy(form,fn){const buttons=[...form.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);try{await fn()}catch(e){console.error(e);message(errorMessage(e),true)}finally{buttons.forEach(b=>b.disabled=false)}}
export const phone=v=>{let n=v.trim().replace(/[\s()+-]/g,'');if(n.startsWith('62'))n='0'+n.slice(2);if(!/^08\d{8,12}$/.test(n))throw new Error('Gunakan nomor HP yang valid, format 08… atau +62….');return n};
