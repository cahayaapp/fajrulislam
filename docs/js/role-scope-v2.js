(function(root,factory){const cjs=typeof module==='object'&&module.exports;const api=factory(cjs?require('./role-system-v2.js'):root.CahayaRoleSystemV2);if(cjs)module.exports=api;if(root)root.CahayaRoleScopeV2=api})(typeof window!=='undefined'?window:globalThis,function(R){
  'use strict';
  // Exact existing master_usrah keys and unit boundary from naqib/absensi.html.
  // Never derive a person's assignment from their name or username.
  const USRAH_UNITS=Object.freeze({'Usrah 1':'PUTRA','Usrah 2':'PUTRA','Usrah 3':'PUTRA','Usrah 4':'PUTRA','Usrah 5':'PUTRA','Usrah 6':'PUTRA','Usrah 7':'PUTRI','Usrah 8':'PUTRI'});
  const USRAH_IDS=Object.freeze(Object.fromEntries(Object.keys(USRAH_UNITS).map(k=>['USRAH_'+k.slice(6),k])));
  // No new rank privileges; future differences belong here, not in role IDs.
  const COUNSELOR_LEVEL_ACTIONS=Object.freeze({PEMULA:Object.freeze(['case.read','case.handle','case.escalate','case.complete']),MADYA:Object.freeze(['case.read','case.handle','case.complete'])});
  // Existing queue split, now checked at action time too. No SP/delete grants.
  function counselorCaseAllowed(level,item){
    const category=String(item.normalizedCode||item.category||'').toLowerCase();
    const basic=['kedisiplin','kebersihan','kerapian','bolos','terlambat','ketertiban'].some(v=>category.includes(v));
    // New report-only routing is not itself an escalation signal.
    const escalated=item.route==='KONSELOR'&&item.raw?.statusPenanganan!=='Menunggu Konselor';
    const advanced=!!item.repeated||escalated||['etika','moral','kritis','berat','sedang'].some(v=>category.includes(v));
    return level==='PEMULA'?basic&&!advanced:level==='MADYA'&&advanced;
  }
  const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v)}return v};
  const signature=s=>JSON.stringify([s?.mode,s?.userKey,s?.activeRole,s?.activeAssignment]);
  function usrahKey(value){return USRAH_IDS[value]||(Object.hasOwn(USRAH_UNITS,value)?value:'')}
  function create(session,getSession=()=>session){
    if(session?.mode!=='canonical')return null;
    const stamp=signature(session),a=session.activeAssignment,role=session.activeRole;
    function assertCurrent(){if(signature(getSession())!==stamp)throw new Error('ROLE_CONTEXT_EXPIRED');if(R.validateAssignment(role,a).length)throw new Error('INCOMPLETE_ASSIGNMENT')}
    function can(permission,resource){assertCurrent();if(role==='KONSELOR'&&permission.startsWith('case.')&&!COUNSELOR_LEVEL_ACTIONS[a.level]?.includes(permission))return false;return R.authorize(session,permission,resource)}
    function select(permission,records,describe){assertCurrent();if(typeof describe!=='function')throw new TypeError('Resource descriptor required');return records.filter(r=>can(permission,describe(r)))}
    function requireResource(permission,resource){if(!can(permission,resource))throw new Error('OUTSIDE_ACTIVE_ASSIGNMENT')}
    function usrahKeys(){
      assertCurrent();
      if(a.usrahIds.some(id=>!usrahKey(id)))throw new Error('USRAH_SOURCE_KEY_UNRESOLVED');
      let keys=role==='MENTOR_USRAH'?a.usrahIds.map(usrahKey).filter(Boolean):['NAQIB','NAQIBAH','KONSELOR'].includes(role)?Object.keys(USRAH_UNITS):[];
      if(a.usrahIds.length)keys=keys.filter(k=>a.usrahIds.some(id=>usrahKey(id)===k));
      return keys.filter(k=>!a.unit||a.unit==='ALL'||USRAH_UNITS[k]===a.unit);
    }
    function allowsUsrah(key){return usrahKeys().includes(key)}
    async function loadUsrah(read){
      const entries=await Promise.all(usrahKeys().map(async key=>[key,await read('cahaya_app/master_usrah/'+key)]));
      assertCurrent();return Object.fromEntries(entries.filter(([,v])=>v!=null));
    }
    function roster(master){
      assertCurrent();
      const rows=[];
      function names(value){
        if(typeof value==='string')return [value.trim()].filter(Boolean);
        if(!value||typeof value!=='object')return [];
        const name=value.nama||value.namaSantri||value.label;
        return typeof name==='string'?[name.trim()].filter(Boolean):Object.values(value).flatMap(names);
      }
      for(const key of usrahKeys())for(const name of names(master[key]))rows.push({name,usrah:key,unit:USRAH_UNITS[key]});
      // Exact trimmed names preserve legacy identity; do not merge punctuation or aliases.
      function requireStudent(name,usrah){
        assertCurrent();
        const matches=rows.filter(r=>r.name===String(name||'').trim()&&(!usrah||r.usrah===usrah));
        if(!matches.length)throw new Error('STUDENT_OUTSIDE_ACTIVE_ASSIGNMENT');
        return matches[0];
      }
      return freeze({rows,requireStudent});
    }
    return freeze({activeRole:role,assignment:a,unit:a.unit,programDomain:a.programDomain,
      allowedRoles:[...(role==='MANAJER'?a.managedRoles:role==='SUPERVISOR'?a.supervisedRoles:[])],
      usrahIds:[...a.usrahIds],childName:Object.values(R.existingWaliChildLink(a))[0]||'',
      assertCurrent,can,select,requireResource,usrahKeys,allowsUsrah,loadUsrah,roster,
      // Source metadata is required. Subject names do not confer a domain.
      education:(records,describe)=>select(['MANAJER','SUPERVISOR'].includes(role)?'operations.read':'education.read',records,describe)
    });
  }
  return Object.freeze({create,signature,usrahKey,USRAH_UNITS,COUNSELOR_LEVEL_ACTIONS,counselorCaseAllowed});
});
