(function(){
  'use strict';
  function init(){
    document.documentElement.classList.add('cahaya-beyond-v29-root');
    if(document.body) document.body.classList.add('cahaya-beyond-v29');
    // Visual marker only; V28 handles stackable tables and overflow guards.
    document.querySelectorAll('.h24-menu,.menu-grid>* , .shortcut-grid>* , .quick-grid>* , .feature-grid>* , .apps-grid>* , .dashboard-grid>*').forEach(function(el){el.classList.add('b29-shortcut');});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
