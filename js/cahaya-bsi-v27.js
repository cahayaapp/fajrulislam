
(function(){
  function rel(prefix){ return prefix; }
  function enhanceTables(){
    document.querySelectorAll('table').forEach(function(table){
      if(table.closest('.no-stack-table')) return;
      table.classList.add('c27-stackable');
      var headers=[].map.call(table.querySelectorAll('thead th'), function(th){ return (th.innerText||th.textContent||'').trim(); });
      if(!headers.length){
        var first=table.querySelector('tr');
        if(first){ headers=[].map.call(first.children,function(cell){ return (cell.innerText||cell.textContent||'').trim(); }); }
      }
      table.querySelectorAll('tbody tr').forEach(function(tr){
        [].forEach.call(tr.children,function(td,i){ if(!td.getAttribute('data-label')) td.setAttribute('data-label', headers[i]||('Kolom '+(i+1))); });
      });
    });
  }
  function fixOverflow(){
    document.documentElement.style.overflowX='hidden'; document.body.style.overflowX='hidden';
    document.querySelectorAll('pre,code,[style*="overflow-x"],.table-responsive,.overflow-auto').forEach(function(el){ if(!el.classList.contains('allow-x')) el.style.maxWidth='100%'; });
  }
  function badgeify(){
    document.querySelectorAll('.menu-grid > *, .shortcut-grid > *, .quick-grid > *, .feature-grid > *, .apps-grid > *, .dashboard-grid > *').forEach(function(card){
      card.classList.add('module-card');
    });
  }
  function init(){
    document.documentElement.classList.add('cahaya-bsi-v27');
    document.body.classList.add('cahaya-bsi-v27');
    enhanceTables();fixOverflow();badgeify();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
