/* Explicit administrative provisioning. Does not trust client-editable profiles. */
const {initializeApp}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
initializeApp();
const uid=process.argv[2],revoke=process.argv.includes('--revoke');
if(!uid||uid.startsWith('--'))throw new Error('Usage: node scripts/set-psb-staff.js FIREBASE_UID [--revoke]');
(async()=>{const user=await getAuth().getUser(uid),claims={...user.customClaims};if(revoke)delete claims.psbStaff;else claims.psbStaff=true;await getAuth().setCustomUserClaims(uid,claims);console.log(revoke?'Akses PSB dicabut.':'Akses PSB diberikan. Masuk ulang untuk memuat akses baru.');})().catch(e=>{console.error(e.message);process.exitCode=1});
