(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.CahayaFaceAttendancePOC=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='poc-v1';
  const DEFAULTS=Object.freeze({similarityThreshold:0.62,minMargin:0.06,minSamples:4,livenessFrames:3,yawMovement:0.12,minLive:0.5,minReal:0.5});

  function finite(value,fallback=0){const number=Number(value);return Number.isFinite(number)?number:fallback}
  function clean(value){return String(value??'').trim()}
  function vector(value){return Array.from(value||[],item=>finite(item,0))}
  function clamp(value,min=0,max=1){return Math.min(max,Math.max(min,finite(value,min)))}
  function dot(a,b){let sum=0;for(let i=0;i<Math.min(a.length,b.length);i++)sum+=a[i]*b[i];return sum}
  function cosineSimilarity(a,b){
    const left=vector(a),right=vector(b);
    if(!left.length||left.length!==right.length)return 0;
    const denominator=Math.sqrt(dot(left,left))*Math.sqrt(dot(right,right));
    return denominator?clamp((dot(left,right)/denominator+1)/2):0;
  }
  function meanEmbedding(samples){
    const valid=(samples||[]).map(vector).filter(item=>item.length);
    if(!valid.length)return [];
    const length=valid[0].length,compatible=valid.filter(item=>item.length===length),result=Array(length).fill(0);
    compatible.forEach(item=>item.forEach((value,index)=>{result[index]+=value}));
    return result.map(value=>value/compatible.length);
  }
  function allTemplates(enrollment){
    const samples=Array.isArray(enrollment?.samples)?enrollment.samples:[];
    const centroid=Array.isArray(enrollment?.centroid)?[enrollment.centroid]:[];
    return samples.concat(centroid).map(vector).filter(item=>item.length);
  }
  function matchEmbedding(query,enrollments,options={}){
    const similarity=options.similarity||cosineSimilarity;
    const threshold=finite(options.threshold,DEFAULTS.similarityThreshold);
    const minMargin=finite(options.minMargin,DEFAULTS.minMargin);
    const ranked=(enrollments||[]).map(enrollment=>{
      const scores=allTemplates(enrollment).map(template=>clamp(similarity(query,template)));
      return {enrollment,similarity:scores.length?Math.max(...scores):0};
    }).sort((a,b)=>b.similarity-a.similarity);
    const best=ranked[0]||null,runnerUp=ranked[1]||null,margin=best?best.similarity-(runnerUp?.similarity||0):0;
    const recognized=!!best&&best.similarity>=threshold&&(!runnerUp||margin>=minMargin);
    return {
      recognized,
      studentKey:recognized?clean(best.enrollment.studentKey):'',
      studentName:recognized?clean(best.enrollment.studentName):'',
      className:recognized?clean(best.enrollment.className):'',
      similarity:best?.similarity||0,
      confidence:Math.round((best?.similarity||0)*1000)/10,
      margin:Math.round(margin*1000)/1000,
      reason:!best?'NO_ENROLLMENT':best.similarity<threshold?'BELOW_THRESHOLD':runnerUp&&margin<minMargin?'AMBIGUOUS':'MATCH',
      candidate:best?{studentKey:clean(best.enrollment.studentKey),studentName:clean(best.enrollment.studentName)}:null
    };
  }

  function pad(value){return String(value).padStart(2,'0')}
  function localDateKey(date=new Date()){return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`}
  function localTime(date=new Date()){return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`}
  function timeSeconds(value){const parts=clean(value).split(':').map(Number);return (parts[0]||0)*3600+(parts[1]||0)*60+(parts[2]||0)}
  function attendanceStatus(scanTime,cutoff){return timeSeconds(scanTime)<=timeSeconds(cutoff)?'HADIR':'TERLAMBAT'}
  function createSession(input={}){
    const now=input.now instanceof Date?input.now:new Date(input.now||Date.now());
    const programId=clean(input.programId)||'shalat-subuh',date=clean(input.date)||localDateKey(now);
    return {
      schemaVersion:VERSION,
      sessionId:clean(input.sessionId)||`${programId}:${date}:${now.getTime().toString(36)}`,
      programId,
      programName:clean(input.programName)||'Shalat Subuh',
      date,
      cutoff:clean(input.cutoff)||'04:45:00',
      createdAt:now.toISOString(),
      checkIns:{},
      events:[]
    };
  }
  function checkIn(session,match,input={}){
    if(!session||!session.sessionId)throw new Error('Sesi absensi tidak valid.');
    if(!match?.recognized||!match.studentKey)return {created:false,reason:'UNKNOWN',record:null};
    const studentKey=clean(match.studentKey),existing=session.checkIns?.[studentKey];
    const date=input.now instanceof Date?input.now:new Date(input.now||Date.now()),scanTime=clean(input.scanTime)||localTime(date);
    if(existing){
      existing.lastSeen=date.toISOString();existing.seenCount=finite(existing.seenCount,1)+1;
      return {created:false,reason:'DUPLICATE',record:existing};
    }
    const record={
      sessionId:session.sessionId,
      programId:session.programId,
      studentKey,
      studentName:clean(match.studentName),
      className:clean(match.className),
      scanTime,
      scanTimestamp:date.toISOString(),
      status:attendanceStatus(scanTime,session.cutoff),
      confidence:finite(match.confidence),
      similarity:finite(match.similarity),
      recognitionMethod:clean(input.recognitionMethod)||'human-faceres-local',
      liveness:input.liveness||null,
      device:{userAgent:clean(input.userAgent),camera:clean(input.camera)},
      firstSeen:date.toISOString(),lastSeen:date.toISOString(),seenCount:1
    };
    session.checkIns=session.checkIns||{};session.checkIns[studentKey]=record;session.events=session.events||[];session.events.push({type:'CHECK_IN',studentKey,at:date.toISOString()});
    return {created:true,reason:'CREATED',record};
  }

  function createLivenessTracker(options={}){
    const config={...DEFAULTS,...options};
    const state={frames:0,yaws:[],real:[],live:[],startedAt:Date.now()};
    return {
      reset(){state.frames=0;state.yaws=[];state.real=[];state.live=[];state.startedAt=Date.now()},
      add(face={}){
        state.frames+=1;
        const yaw=Number(face?.rotation?.angle?.yaw);if(Number.isFinite(yaw))state.yaws.push(yaw);
        const real=Number(face.real);if(Number.isFinite(real))state.real.push(real);
        const live=Number(face.live);if(Number.isFinite(live))state.live.push(live);
        return this.result();
      },
      result(){
        const yawRange=state.yaws.length?Math.max(...state.yaws)-Math.min(...state.yaws):0;
        const avg=values=>values.length?values.reduce((sum,value)=>sum+value,0)/values.length:null;
        const real=avg(state.real),live=avg(state.live),enough=state.frames>=config.livenessFrames;
        const passed=enough&&yawRange>=config.yawMovement&&real!==null&&real>=config.minReal&&live!==null&&live>=config.minLive;
        return {passed,frames:state.frames,yawRange,real,live,reason:!enough?'NEED_MORE_FRAMES':yawRange<config.yawMovement?'MOVE_HEAD':real===null||live===null?'MODEL_UNAVAILABLE':real<config.minReal?'SPOOF_RISK':live<config.minLive?'LIVENESS_LOW':'PASSED',elapsedMs:Date.now()-state.startedAt};
      }
    };
  }

  return {VERSION,DEFAULTS,finite,clean,cosineSimilarity,meanEmbedding,matchEmbedding,localDateKey,localTime,timeSeconds,attendanceStatus,createSession,checkIn,createLivenessTracker};
});
