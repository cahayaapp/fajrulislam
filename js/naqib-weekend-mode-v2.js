(function(root,factory){const api=factory(root?.CahayaWeeklyKpiV2);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CahayaNaqibWeekendModeV2=api})(typeof window!=='undefined'?window:globalThis,function(K){
  'use strict';
  const PERSONNEL=Object.freeze([
    Object.freeze({personKey:'khaizuran',displayName:'Ade Khaizuran Utsman',aliases:Object.freeze(['Ade Khaizuran Utsman','Ade Khaizuran','Khaizuran','Yong'])}),
    Object.freeze({personKey:'favian',displayName:'Favian Arif Fadillah',aliases:Object.freeze(['Favian Arif Fadillah','Favian'])}),
    Object.freeze({personKey:'kamal',displayName:'Kamal Izudin Ahmad Mundhofi',aliases:Object.freeze(['Kamal Izudin Ahmad Mundhofi','Kamal'])})
  ]);
  const DAYS=['senin','selasa','rabu','kamis','jumat','sabtu','ahad'];
  const norm=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  function profile(value){const inputs=(Array.isArray(value)?value:[value]).map(norm).filter(Boolean);return PERSONNEL.find(person=>person.aliases.some(alias=>inputs.some(input=>{const candidate=norm(alias);return input===candidate||input.includes(candidate)||candidate.includes(input)})))||null}
  function personKey(value){return profile(value)?.personKey||norm(Array.isArray(value)?value.find(Boolean):value).replace(/\s+/g,'')}
  function displayName(value){return profile(value)?.displayName||String(Array.isArray(value)?value.find(Boolean)||'':value||'').trim()}
  function earned(reward){return Boolean(reward?.rewardEligible&&['EARNED','USED'].includes(String(reward.status||'EARNED').toUpperCase()))}
  function activeReward(reward,value=new Date()){if(!earned(reward)||!reward.rewardStart||!reward.rewardEnd)return false;const time=new Date(value).getTime();return time>=new Date(reward.rewardStart).getTime()&&time<new Date(reward.rewardEnd).getTime()}
  function apply(programs,{reward=null,at=new Date(),person=null}={}){
    if(!activeReward(reward,at))return{programs:[...(programs||[])],weekendMode:false,rewardActive:false,message:''};
    return{programs:[],weekendMode:true,rewardActive:true,personKey:personKey(person||reward.personKey),message:'Weekend Mode aktif • Hak Libur Pilihan sedang digunakan. Tugas rutin, PIC, piket, on call, backup, mentoring, dan pengawasan reguler dinonaktifkan.'};
  }
  function minutes(value){const match=String(value||'').match(/(\d{1,2})[:.](\d{2})/);return match?Number(match[1])*60+Number(match[2]):null}
  function normalized(raw={}){const source=raw?.putra?.jadwal?raw.putra:raw;return{blok:source?.blok||{},jadwal:source?.jadwal||{}}}
  function conflictRows(raw,rewards={},week){
    const schedule=normalized(raw),start=5*1440+13*60,end=6*1440+11*60,rows=[];
    ['sabtu','ahad'].forEach(day=>Object.entries(schedule.jadwal?.[day]||{}).forEach(([blockId,name])=>{
      const block=schedule.blok?.[blockId]||{},from=minutes(block.mulai),to=minutes(block.selesai);if(from==null||to==null)return;
      const dayIndex=DAYS.indexOf(day),blockStart=dayIndex*1440+from,blockEnd=dayIndex*1440+(to<=from?to+1440:to),overlap=Math.max(blockStart,start)<Math.min(blockEnd,end),key=personKey(name),reward=rewards[key]?.reward||rewards[key]||null;
      if(overlap&&earned(reward))rows.push({personKey:key,personName:displayName(name),scheduledName:name,day,blockId,blockLabel:block.label||blockId,start:block.mulai,end:block.selesai,weekKey:week?.weekKey||reward?.weekKey||'',flag:'Bentrok dengan Hak Libur'});
    }));return rows;
  }
  function coverage(raw,rewards={},week){
    const people=PERSONNEL.map(person=>{const reward=rewards[person.personKey]?.reward||rewards[person.personKey]||null;return{...person,reward,rewardEligible:earned(reward),availability:earned(reward)?'HAK_LIBUR':'TERSEDIA_TANPA_PENUGASAN_OTOMATIS'}}),conflicts=conflictRows(raw,rewards,week),rewarded=people.filter(row=>row.rewardEligible),available=people.filter(row=>!row.rewardEligible),needs=[];
    if(conflicts.length)needs.push(`${conflicts.length} blok bentrok memerlukan keputusan coverage Manajer.`);
    if(rewarded.length===PERSONNEL.length)needs.push('Semua Naqib Putra mendapat Hak Libur; penanggung jawab dewasa/institusi wajib ditetapkan.');
    if(!needs.length&&rewarded.length)needs.push('Pastikan penanggung jawab dewasa untuk kebutuhan darurat; tidak ada pemindahan piket otomatis.');
    return{weekKey:week?.weekKey||'',rewarded,available,conflicts,needs,status:conflicts.length||rewarded.length===PERSONNEL.length?'BELUM_TERPENUHI':'AMAN_DENGAN_VERIFIKASI',autoReassign:false,studentAuthority:'REPORT_ONLY'};
  }
  return Object.freeze({PERSONNEL,DAYS,norm,profile,personKey,displayName,earned,activeReward,apply,conflictRows,coverage});
});
