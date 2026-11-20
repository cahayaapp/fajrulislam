// Same-origin landing content stays mounted while portal subtabs change.
if(new URLSearchParams(location.search).get('portal')==='1'&&window.parent!==window){
 document.documentElement.classList.add('portal-embed');
 const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='portal-content.css?v=1';document.head.append(sheet);
 const style=document.createElement('style');style.textContent=`.portal-embed body{min-height:0}.portal-embed body>header,.portal-embed body>footer,.portal-embed .enrollment-faq{display:none!important}.portal-embed main>[hidden]{display:none!important}.portal-embed main{padding:0!important}.portal-embed main>section,.portal-embed .welcome-founder{margin:0!important}.portal-embed .testimonial-opening{min-height:0!important;padding-bottom:40px!important}.portal-embed .welcome-founder{padding-top:20px!important}.portal-embed .reveal{opacity:1!important;transform:none!important}`;document.head.append(style);
 const main=document.querySelector('main');
 const groups=new Map([...main.children].map(el=>[el.classList.contains('testimonial-opening')?'testimoni':el.classList.contains('welcome-founder')?'pengasuh':el.id,el]));
 function select(id){if(!groups.has(id))return;for(const el of main.children)el.hidden=el!==groups.get(id);window.scrollTo(0,0);measure()}
 let previous=0;function measure(){const height=Math.ceil(main.getBoundingClientRect().height)+24;if(height!==previous){previous=height;parent.postMessage({type:'psb-height',height},location.origin)}}
 window.addEventListener('message',e=>{if(e.source===parent&&e.origin===location.origin&&e.data?.type==='psb-section')select(e.data.id)});
 document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;const url=new URL(a.href);if(url.origin!==location.origin)return;e.preventDefault();if(url.pathname.endsWith('akun.html'))parent.postMessage({type:'psb-register'},location.origin);else if(url.hash){const el=document.querySelector(url.hash);const group=[...groups].find(([,node])=>node===el||node.contains(el));if(group)parent.postMessage({type:'psb-select',id:group[0]},location.origin)}},true);
 new ResizeObserver(measure).observe(main);select('testimoni');parent.postMessage({type:'psb-ready'},location.origin);
}
