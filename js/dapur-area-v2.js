/* Shared session-only area selection for Dapur operational pages. */
(function(root,factory){const api=factory(root.CahayaRoleSystemV2,root);if(typeof module==='object'&&module.exports)module.exports=api;root.CahayaDapurAreaV2=api})(typeof window!=='undefined'?window:globalThis,function(R,root){'use strict';
  function profile(){try{return JSON.parse(root.localStorage.getItem('cahayaCurrentUser')||'{}')||{}}catch{return{}}}
  function session(){return R?.resolveSession(profile(),root.localStorage)}
  function fixed(){const s=session(),role=s?.activeRole,unit=s?.activeAssignment?.unit;if(['PUTRA','PUTRI'].includes(unit)&&(role==='DAPUR'||role==='SUPERVISOR'&&s.activeAssignment?.supervisedRoles?.includes('DAPUR')))return unit.toLowerCase();return''}
  function storageKey(){const u=profile();return`cahayaDapurAreaV2:${u.uid||u.username||'anon'}`}
  function get(){const assigned=fixed();if(assigned)return assigned;const saved=root.sessionStorage?.getItem(storageKey());return ['putra','putri'].includes(saved)?saved:''}
  function set(area){area=String(area||'').toLowerCase();if(!['putra','putri'].includes(area)||fixed()&&fixed()!==area)throw Error('Area di luar penugasan Dapur.');root.sessionStorage?.setItem(storageKey(),area);return area}
  function areaOf(record){const raw=String(record?.area||record?.unit||record?.scopeKey||'').toLowerCase();return['putra','putri'].includes(raw)?raw:''}
  function label(area){return area==='putra'?'Putra':area==='putri'?'Putri':'Area belum ditentukan'}
  return Object.freeze({get,set,fixed,areaOf,label});
});
