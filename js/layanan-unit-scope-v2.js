/* Keep legacy guest/deposit forms within the active Layanan unit. */
(() => {
  'use strict';
  let profile={};try{profile=JSON.parse(localStorage.getItem('cahayaCurrentUser')||'{}')||{}}catch{}
  const context=window.cahayaRoleContext;
  const session=window.CahayaRoleSystemV2?.resolveSession(profile,localStorage);
  const role=context?.activeRole||session?.activeRole||profile.activeRoleV2;
  if(Number(profile.roleSystemVersion)!==2||role!=='LAYANAN_KEBERSIHAN')return;
  const assignment=context?.activeAssignment||session?.activeAssignment||profile.assignments?.LAYANAN_KEBERSIHAN||profile.activeAssignment;
  const unit=String(assignment?.unit||'').toLowerCase();
  if(!['putra','putri'].includes(unit))return;
  const lock=select=>{
    if(!select)return;
    select.value=unit;
    for(const option of select.options)option.disabled=option.value!==unit;
    select.dispatchEvent(new Event('change',{bubbles:true}));
  };
  document.addEventListener('DOMContentLoaded',()=>{
    const input=document.getElementById('unit'),filter=document.getElementById('unitFilter');
    lock(input);lock(filter);
    input?.addEventListener('change',()=>{if(input.value!==unit)lock(input)});
    filter?.addEventListener('change',()=>{if(filter.value!==unit)lock(filter)});
    document.querySelector('form')?.addEventListener('reset',()=>setTimeout(()=>lock(input),0));
    document.querySelector('form')?.addEventListener('submit',event=>{
      context?.assertCurrent?.();
      if(input?.value!==unit){event.preventDefault();event.stopImmediatePropagation();lock(input);alert('Unit layanan tidak sesuai penugasan aktif.');}
    },true);
  });
})();
