(function(){
  'use strict';
  const MOBILE = () => window.matchMedia('(max-width:900px)').matches;
  const SKIP_TABLE = /(calendar|kalender|schedule|jadwal|matrix|heatmap|print|invoice|receipt|struk)/i;

  function ensureViewport(){
    if(document.querySelector('meta[name="viewport"]')) return;
    const m=document.createElement('meta');
    m.name='viewport';
    m.content='width=device-width, initial-scale=1.0, viewport-fit=cover';
    document.head.appendChild(m);
  }

  function markShell(){
    if(document.querySelector('.sidebar, #mainSidebar, iframe#contentFrame, .wali-sidebar, .portal-sidebar')){
      document.body.classList.add('cahaya-shell-page');
    }
  }

  function tableHeaders(table){
    const firstHeaderRow=table.querySelector('thead tr') || table.querySelector('tr');
    if(!firstHeaderRow) return [];
    return [...firstHeaderRow.children].filter(c=>/^(TH|TD)$/.test(c.tagName)).map(c=>String(c.textContent||'').trim().replace(/\s+/g,' '));
  }

  function stackTables(){
    if(!MOBILE()) return;
    document.querySelectorAll('table').forEach(table=>{
      const signature=`${table.id||''} ${table.className||''}`;
      if(SKIP_TABLE.test(signature) || table.closest('[data-cahaya-no-stack], .calendar, .kalender, .schedule-calendar, .print-preview')) return;
      const headers=tableHeaders(table);
      const rows=[...table.querySelectorAll('tbody tr')];
      const columnCount=Math.max(headers.length, ...rows.slice(0,3).map(r=>r.children.length), 0);
      if(columnCount < 3) return;
      table.classList.add('cahaya-stack-table');
      rows.forEach(row=>{
        [...row.children].forEach((cell,index)=>{
          if(!cell.hasAttribute('data-cahaya-label')) cell.setAttribute('data-cahaya-label', headers[index] || `Kolom ${index+1}`);
        });
      });
      table.closest('.table-wrap,.table-responsive,.tablewrap,.fin-table-wrap')?.classList.add('cahaya-horizontal-safe');
    });
  }

  function repairFixedWidths(){
    if(!MOBILE()) return;
    const vw=Math.max(document.documentElement.clientWidth, window.innerWidth||0);
    const candidates=document.querySelectorAll('main,section,article,div,form,fieldset,nav,header,footer');
    candidates.forEach(el=>{
      if(el.closest('.cahaya-stack-table')) return;
      const cs=getComputedStyle(el);
      const min=parseFloat(cs.minWidth)||0;
      if(min > vw-12) el.classList.add('cahaya-fluid-fix');
      const isFlex=cs.display.includes('flex');
      const isGrid=cs.display.includes('grid');
      if(el.scrollWidth > vw+20){
        if(isFlex) el.classList.add('cahaya-wrap-fix');
        else if(isGrid) el.classList.add('cahaya-grid-fix');
        else if(!/^(BODY|HTML)$/.test(el.tagName)) el.classList.add('cahaya-fluid-fix');
      }
    });
  }

  function normalizeControls(){
    document.querySelectorAll('input,select,textarea,button,a').forEach(el=>{
      if(el.tagName==='BUTTON' || el.tagName==='A') el.setAttribute('data-cahaya-touch','true');
    });
  }

  function run(){
    ensureViewport();
    if(!document.body) return;
    document.documentElement.classList.add('cahaya-v24');
    markShell();
    normalizeControls();
    stackTables();
    requestAnimationFrame(()=>requestAnimationFrame(repairFixedWidths));
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run,{once:true});
  else run();
  window.addEventListener('load',()=>{stackTables();repairFixedWidths();},{once:true});
  let timer;
  window.addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(()=>{stackTables();repairFixedWidths();},130)},{passive:true});
  try{
    const obs=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{stackTables();repairFixedWidths();},100)});
    if(document.documentElement) obs.observe(document.documentElement,{subtree:true,childList:true});
  }catch(_){ }
})();
