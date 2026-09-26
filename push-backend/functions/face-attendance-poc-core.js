"use strict";

const MODEL_VERSION="@vladmandic/human@3.3.6:faceres";
const EMBEDDING_VERSION="faceres-1024-v1";
const MIN_SAMPLES=4,MAX_SAMPLES=8,EMBEDDING_LENGTH=1024;

function text(value,max=160){return String(value??"").trim().slice(0,max)}
function safeKey(value){return text(value,180).replace(/[.#$\[\]\/]/g,"")}
function roles(profile={}){const value=profile.roles??profile.akses??profile.role??[];return (Array.isArray(value)?value:[value]).flatMap(item=>String(item||"").split(/[;,|]/)).map(item=>item.trim().toLowerCase().replace(/[_-]+/g," ")).filter(Boolean)}
function canEnroll(profile={}){return profile.active===true&&profile.internal===true&&roles(profile).some(role=>["admin","administrator","direktur"].includes(role))}
function canScan(profile={}){return profile.active===true&&profile.internal===true&&roles(profile).some(role=>["naqib","naqibah","admin","administrator","direktur"].includes(role))}
function finiteVector(input){if(!Array.isArray(input)||input.length!==EMBEDDING_LENGTH)throw Error(`Embedding harus ${EMBEDDING_LENGTH} angka.`);return input.map(value=>{const number=Number(value);if(!Number.isFinite(number)||Math.abs(number)>100)throw Error("Embedding tidak valid.");return Math.round(number*1e7)/1e7})}
function sanitizeEnrollment(input={}){
  const studentKey=safeKey(input.studentKey),studentName=text(input.studentName,120),className=text(input.className,80),samples=Array.isArray(input.samples)?input.samples:[];
  if(!studentKey||!studentName)throw Error("StudentKey dan nama santri wajib.");
  if(input.modelVersion!==MODEL_VERSION||input.embeddingVersion!==EMBEDDING_VERSION)throw Error("Versi model/embedding tidak kompatibel.");
  if(samples.length<MIN_SAMPLES||samples.length>MAX_SAMPLES)throw Error(`Jumlah sampel harus ${MIN_SAMPLES}-${MAX_SAMPLES}.`);
  const cleanSamples=samples.map(finiteVector),centroid=finiteVector(input.centroid);
  return {studentKey,studentName,className,modelVersion:MODEL_VERSION,embeddingVersion:EMBEDDING_VERSION,sampleCount:cleanSamples.length,samples:cleanSamples,centroid,active:true,rawImageStored:false};
}
function nextProfile(input,existing={},actor={},now=Date.now()){
  const clean=sanitizeEnrollment(input),previousVersion=Number(existing.profileVersion||0),profileVersion=previousVersion+1;
  return {...clean,profileVersion,createdAt:existing.createdAt||now,createdByUid:existing.createdByUid||actor.uid,updatedAt:now,updatedByUid:actor.uid,templateHash:text(input.templateHash,128)};
}
function programRoster(program={}){return Object.entries(program.roster||{}).filter(([,enabled])=>enabled===true||enabled?.active===true).map(([key])=>safeKey(key)).filter(Boolean)}
function authorizedForProgram(profile={},program={},uid=""){
  if(!canScan(profile)||program.active!==true)return false;
  if(canEnroll(profile))return true;
  return program.allowedNaqibUids?.[uid]===true||program.allowedNaqibUids?.[uid]?.active===true;
}
function scopedProfiles(allProfiles={},program={}){
  const allowed=new Set(programRoster(program));
  return Object.values(allProfiles||{}).filter(profile=>profile?.active===true&&allowed.has(safeKey(profile.studentKey))).map(profile=>({...profile,samples:profile.samples||[]}));
}
function seconds(time){const parts=text(time,8).split(":").map(Number);return (parts[0]||0)*3600+(parts[1]||0)*60+(parts[2]||0)}
function timeInZone(timestamp,timeZone="Asia/Jakarta"){const parts=Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone,hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(new Date(timestamp)).filter(part=>part.type!=="literal").map(part=>[part.type,part.value]));return `${parts.hour}:${parts.minute}:${parts.second}`}
function officialStatus(timestamp,program={}){
  const value=seconds(timeInZone(timestamp,program.timeZone||"Asia/Jakarta"));
  if(value<=seconds(program.onTimeCutoff||"04:45:00"))return "HADIR";
  if(value<=seconds(program.scanCloseTime||"06:00:00"))return "TERLAMBAT";
  return "DITOLAK_DI_LUAR_WAKTU";
}
function sanitizeCheckIn(input={},program={},now=Date.now()){
  const recognitionTimestamp=Number(input.recognitionTimestamp),pendingSync=input.pendingSync===true;
  if(!safeKey(input.sessionId)||!safeKey(input.programId)||!safeKey(input.studentKey))throw Error("Identitas sesi, program, dan santri wajib.");
  if(input.modelVersion!==MODEL_VERSION)throw Error("Versi model check-in tidak kompatibel.");
  if(!Number.isFinite(recognitionTimestamp)||recognitionTimestamp>now+120000||recognitionTimestamp<now-86400000)throw Error("Timestamp recognition di luar rentang POC.");
  const officialTimestamp=pendingSync?recognitionTimestamp:now,status=officialStatus(officialTimestamp,program);
  return {sessionId:safeKey(input.sessionId),programId:safeKey(input.programId),studentKey:safeKey(input.studentKey),deviceId:safeKey(input.deviceId),sessionDeviceId:safeKey(input.sessionDeviceId),recognitionTimestamp,serverTimestamp:now,status,confidence:Math.max(0,Math.min(100,Number(input.confidence)||0)),modelVersion:MODEL_VERSION,pendingSync:false,syncDelayMs:Math.max(0,now-recognitionTimestamp),timeBasis:pendingSync?"CLIENT_OFFLINE_REQUIRES_REVIEW":"SERVER",requiresReview:pendingSync,recognitionMethod:text(input.recognitionMethod||"human-faceres-local",80),rawImageStored:false};
}

module.exports={MODEL_VERSION,EMBEDDING_VERSION,MIN_SAMPLES,MAX_SAMPLES,EMBEDDING_LENGTH,text,safeKey,roles,canEnroll,canScan,sanitizeEnrollment,nextProfile,programRoster,authorizedForProgram,scopedProfiles,timeInZone,officialStatus,sanitizeCheckIn};
