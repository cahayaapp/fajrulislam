(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.CahayaFaceMultiDevice=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function clean(value){return String(value??'').trim()}
  function cacheDecision(localProfiles=[],remote={},expected={}){
    if(remote.modelVersion!==expected.modelVersion||remote.embeddingVersion!==expected.embeddingVersion)return {compatible:false,reason:'MODEL_VERSION_MISMATCH',profiles:[],changed:[],removed:localProfiles.map(item=>item.studentKey)};
    const current=new Map(localProfiles.map(item=>[clean(item.studentKey),item])),changed=[];
    const profiles=(remote.profiles||[]).filter(item=>item?.active===true&&item.modelVersion===expected.modelVersion&&item.embeddingVersion===expected.embeddingVersion).map(item=>{
      const old=current.get(clean(item.studentKey));if(!old||Number(old.profileVersion)!==Number(item.profileVersion)||old.templateHash!==item.templateHash)changed.push(item.studentKey);return {...item,cachedAt:Number(remote.syncedAt||Date.now()),programId:remote.program?.id||''};
    });
    const nextKeys=new Set(profiles.map(item=>clean(item.studentKey))),removed=localProfiles.filter(item=>!nextKeys.has(clean(item.studentKey))).map(item=>item.studentKey);
    return {compatible:true,reason:'OK',profiles,changed,removed,program:remote.program,syncedAt:Number(remote.syncedAt||Date.now())};
  }
  function makeSubmissionId(sessionId,studentKey,deviceId,timestamp){return [sessionId,studentKey,deviceId,Number(timestamp)].map(value=>clean(value).replace(/[^a-zA-Z0-9:_-]/g,'')).join('__')}
  function pendingRecord(record){return {...record,submissionId:record.submissionId||makeSubmissionId(record.sessionId,record.studentKey,record.deviceId,record.recognitionTimestamp),pendingSync:true,queuedAt:Date.now(),syncAttempts:Number(record.syncAttempts||0)} }
  function markAttempt(record,error=''){return {...record,syncAttempts:Number(record.syncAttempts||0)+1,lastSyncAttemptAt:Date.now(),lastSyncError:clean(error).slice(0,300)}}
  return {cacheDecision,makeSubmissionId,pendingRecord,markAttempt};
});
