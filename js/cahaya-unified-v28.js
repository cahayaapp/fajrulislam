(function(){
  'use strict';
  function stackTables(){
    document.querySelectorAll('table').forEach(function(table){
      if(table.classList.contains('no-mobile-stack') || table.closest('.no-mobile-stack')) return;
      table.classList.add('c28-stackable');
      var heads=Array.prototype.map.call(table.querySelectorAll('thead th'),function(th){return (th.textContent||'').trim();});
      if(!heads.length){
        var first=table.querySelector('tr');
        if(first) heads=Array.prototype.map.call(first.children,function(c){return (c.textContent||'').trim();});
      }
      table.querySelectorAll('tbody tr').forEach(function(tr){
        Array.prototype.forEach.call(tr.children,function(td,i){
          if(!td.hasAttribute('data-label')) td.setAttribute('data-label',heads[i]||('Kolom '+(i+1)));
        });
      });
    });
  }
  function guardOverflow(){
    document.documentElement.style.maxWidth='100%'; document.documentElement.style.overflowX='hidden';
    document.body.style.maxWidth='100vw'; document.body.style.overflowX='hidden';
    document.querySelectorAll('img,svg,canvas,video').forEach(function(el){el.style.maxWidth='100%';});
  }
  function markModules(){
    document.querySelectorAll('.h24-menu,.menu-grid>* , .shortcut-grid>* , .quick-grid>* , .feature-grid>* , .apps-grid>* , .dashboard-grid>*').forEach(function(el){el.classList.add('module-card');});
  }
  function init(){
    document.body.classList.add('cahaya-v28');
    document.documentElement.classList.add('cahaya-v28-root');
    stackTables(); guardOverflow(); markModules();
    var observer=new MutationObserver(function(muts){
      var needs=false; for(var i=0;i<muts.length;i++){ if(muts[i].addedNodes&&muts[i].addedNodes.length){needs=true;break;} }
      if(needs){ window.requestAnimationFrame(function(){stackTables();markModules();}); }
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
