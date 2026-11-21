// Shared, progressive motion: content stays visible if animation is unavailable.
(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const mobile=matchMedia('(max-width: 760px)');
 const selector='.testimonial-intro,.testimonial-hero,.section-heading,.founder-photo,.founder>div,.large-copy,.digital-intro,.talent-intro,.schedule-heading,.learning-grid>*,.character-grid>*,.character-program,.talent-grid>*,.talent-feature,.alumni-card,.digital-feature,.level-cards>*,.fee-card,.fee-promo,.fees-heading,.admission-terms-list>li,.steps>li,.portal-heading,.tabs>[data-tab],.information-heading,.auth-shell';
 const active=new Set();
 const initial='.testimonial-intro,.testimonial-hero,.portal-heading,.tabs>[data-tab],.auth-shell';
 const directions=new WeakMap();
 document.querySelectorAll(selector).forEach((el,i)=>directions.set(el,i%4));
 function enter(el,delay=0){
  if(reduced.matches||!el.getClientRects().length||!el.animate)return;
  const distance=mobile.matches?18:32;
  const from=[`-${distance}px 0`,`${distance}px 0`,`0 ${distance}px`,`0 -${distance/2}px`][directions.get(el)??2];
  const animation=el.animate([{opacity:0,translate:from},{opacity:1,translate:'0 0'}],{duration:mobile.matches?1000:1250,delay,fill:'backwards',easing:'cubic-bezier(.22,.61,.36,1)'});
  active.add(animation);animation.onfinish=animation.oncancel=()=>active.delete(animation);
 }
 const seen=new WeakSet();
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
   let stagger=0;
   for(const {target,isIntersecting} of entries){
    target.classList.toggle('motion-inview',isIntersecting);
    if(isIntersecting&&!seen.has(target)){seen.add(target);if(!target.matches(initial))enter(target,Math.min(stagger++*110,330))}
   }
  },{threshold:.08});
  document.querySelectorAll(selector).forEach(el=>observer.observe(el));
 }
 // Animate newly selected portal panels and gallery dialogs without reloading.
 const changed=new MutationObserver(entries=>{
  for(const {target,attributeName} of entries){
   if(attributeName==='hidden'&&!target.hidden)enter(target);
   if(attributeName==='open'&&target.open)enter(target);
  }
 });
 document.querySelectorAll('[data-panel],main>section,main>.testimonial-opening,main>.welcome-founder,dialog').forEach(el=>changed.observe(el,{attributes:true,attributeFilter:['hidden','open']}));
 document.addEventListener('click',e=>{
  const control=e.target.closest('button,a.button,.testimonial-next a');
  if(control&&!control.disabled&&!reduced.matches&&control.animate){
   control.animate([{scale:'1'},{scale:'.97'},{scale:'1'}],{duration:260,easing:'ease-out'});
  }
 });
 function sync(){
  document.documentElement.classList.toggle('motion-paused',document.hidden||reduced.matches);
  if(reduced.matches){for(const animation of active)animation.cancel()}
 }
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);sync();
})();
