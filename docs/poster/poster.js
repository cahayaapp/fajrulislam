'use strict';
const gallery=document.querySelector('#gallery'),topic=document.querySelector('#topic'),status=document.querySelector('#status'),dialog=document.querySelector('#preview');
let posters=[],selected=null,previousFocus=null;
async function downloadPNG(p,button){
 const old=button.textContent;button.disabled=true;button.textContent='Menyiapkan PNG…';status.textContent='Menyiapkan '+p.title+'…';
 let sourceURL,downloadURL;
 try{
  const response=await fetch(p.file);if(!response.ok)throw new Error('File poster belum tersedia.');
  const blob=new Blob([await response.text()],{type:'image/svg+xml;charset=utf-8'});sourceURL=URL.createObjectURL(blob);
  const img=new Image();img.src=sourceURL;await img.decode();
  const canvas=document.createElement('canvas');canvas.width=2160;canvas.height=2700;
  canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
  const png=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Gagal membuat PNG.')),'image/png'));
  downloadURL=URL.createObjectURL(png);const a=document.createElement('a');a.href=downloadURL;a.download='PSB-Cahaya-'+p.id+'.png';document.body.append(a);a.click();a.remove();status.textContent='PNG '+p.title+' siap diunduh.';
 }catch(error){status.textContent='Unduhan PNG belum berhasil. Silakan coba lagi atau gunakan Unduh SVG.';console.error(error);}
 finally{if(sourceURL)URL.revokeObjectURL(sourceURL);if(downloadURL)setTimeout(()=>URL.revokeObjectURL(downloadURL),60000);button.disabled=false;button.textContent=old;}
}
function preview(p){selected=p;previousFocus=document.activeElement;document.querySelector('#preview-title').textContent=p.title;const image=document.querySelector('#preview-image');image.src=p.file;image.alt=p.title;document.querySelector('#preview-svg').href=p.file;dialog.showModal();document.querySelector('#close').focus();}
function render(){
 gallery.replaceChildren();const list=posters.filter(p=>topic.value==='all'||p.id===topic.value);
 document.querySelector('#count').textContent=list.length+' poster';
 for(const p of list){const card=document.createElement('article');card.className='card';const cover=document.createElement('button');cover.className='cover';cover.setAttribute('aria-label','Perbesar poster '+p.title);const img=document.createElement('img');img.src=p.file;img.alt=p.title;img.loading='lazy';img.width=1080;img.height=1350;cover.append(img);cover.addEventListener('click',()=>preview(p));const body=document.createElement('div');body.className='card-body';const h=document.createElement('h2');h.textContent=p.title;const actions=document.createElement('div');actions.className='actions';const png=document.createElement('button');png.className='primary';png.textContent='Unduh PNG';png.addEventListener('click',()=>downloadPNG(p,png));const svg=document.createElement('a');svg.href=p.file;svg.download='PSB-Cahaya-'+p.id+'.svg';svg.textContent='Unduh SVG';actions.append(png,svg);body.append(h,actions);card.append(cover,body);gallery.append(card);}
}
document.querySelector('#close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>previousFocus?.focus());document.querySelector('#preview-download').addEventListener('click',e=>selected&&downloadPNG(selected,e.currentTarget));topic.addEventListener('change',render);
fetch('catalog.json').then(r=>{if(!r.ok)throw new Error();return r.json()}).then(data=>{posters=data;for(const p of posters){const o=document.createElement('option');o.value=p.id;o.textContent=p.title;topic.append(o)}render()}).catch(()=>{status.textContent='Koleksi poster belum dapat dimuat. Silakan muat ulang halaman.'});
