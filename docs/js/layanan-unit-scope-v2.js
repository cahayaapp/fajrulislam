/* Keep legacy guest/deposit forms within the active Layanan unit. */
(() => {
  'use strict';
  const context=window.cahayaRoleContext;
  if(context?.activeRole!=='LAYANAN_KEBERSIHAN')return;
  const unit=String(context.activeAssignment?.unit||'').toLowerCase();
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
      context.assertCurrent();
      if(input?.value!==unit){event.preventDefault();event.stopImmediatePropagation();lock(input);alert('Unit layanan tidak sesuai penugasan aktif.');}
    },true);
  });
})();
