(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CahayaSetoranCertificate=api})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const assetBase=typeof document!=='undefined'?new URL('../assets/logo-pesantren.png',document.currentScript?.src||document.baseURI).href:'';
let logoPromise;
function logo(){if(!logoPromise)logoPromise=new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>{logoPromise=null;reject(Error('Logo pesantren belum termuat. Periksa koneksi lalu coba lagi.'))};img.src=assetBase});return logoPromise}
const arabicNumber=value=>new Intl.NumberFormat('ar',{useGrouping:false,maximumFractionDigits:2}).format(value);
function arabicDate(date){return new Intl.DateTimeFormat('ar-u-ca-gregory',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Jakarta'}).format(new Date(date+'T12:00:00Z'))}

function students(classes){const out=[];Object.entries(classes||{}).filter(([kelas])=>!/^PKBM/i.test(kelas)).forEach(([kelas,list])=>{Object.entries(list||{}).forEach(([id,item])=>{const nama=typeof item==='string'?item:item?.namaSantri||item?.nama||item?.name; if(!nama)return;out.push({key:JSON.stringify([kelas,typeof item==='object'?(item.studentId||item.id||id):nama]),nama:String(nama).trim(),kelas,studentId:typeof item==='object'?String(item.studentId||item.id||id):''})})});return out.sort((a,b)=>a.nama.localeCompare(b.nama,'id')||a.kelas.localeCompare(b.kelas,'id'))}
function validate(input,roster){const student=roster.find(x=>x.key===input.studentKey);if(!student)throw Error('Pilih santri yang terdaftar di database.');const juz=Number(input.jumlahJuz),nilai=Number(input.nilai);if(!String(input.jumlahJuz).trim()||!Number.isInteger(juz)||juz<1||juz>30)throw Error('Jumlah juz harus bilangan bulat 1–30.');if(!String(input.nilai).trim()||!Number.isFinite(nilai)||nilai<0||nilai>100)throw Error('Nilai harus antara 0–100.');const date=String(input.tanggal||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw Error('Tanggal setoran tidak valid.');return{...student,jumlahJuz:juz,nilai,tanggal:date}}
function dateLabel(date){return new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Jakarta'}).format(new Date(date+'T12:00:00Z'))}
async function canvas(record){const emblem=await logo();await document.fonts?.ready;const c=document.createElement('canvas');c.width=2970;c.height=2100;const x=c.getContext('2d');x.scale(3,3);const w=990,h=700;x.fillStyle='#fffcf4';x.fillRect(0,0,w,h);x.fillStyle='#082e43';x.fillRect(0,0,30,h);x.fillRect(w-30,0,30,h);x.fillRect(0,0,w,24);x.fillRect(0,h-24,w,24);x.strokeStyle='#ba9250';x.lineWidth=2;x.strokeRect(46,40,w-92,h-80);x.lineWidth=.5;x.strokeRect(52,46,w-104,h-92);for(const [px,py] of [[58,52],[w-58,52],[58,h-52],[w-58,h-52]]){x.save();x.translate(px,py);x.rotate(Math.PI/4);x.fillStyle='#ba9250';x.fillRect(-7,-7,14,14);x.restore()}
const text=(v,y,size=18,color='#173e51',font='Georgia',direction='ltr')=>{x.fillStyle=color;x.textAlign='center';x.direction=direction;let n=size;do{x.font=`${n}px ${font}`;if(x.measureText(String(v)).width<=820)break;n--}while(n>10);x.fillText(String(v),w/2,y)};
const ar=(v,y,size=21,color='#173e51')=>text(v,y,size,color,'Arial, sans-serif','rtl');
// Preserve the supplied horizontal logo's aspect ratio.
const logoWidth=320,logoHeight=logoWidth*emblem.naturalHeight/emblem.naturalWidth;
x.drawImage(emblem,80,74,logoWidth,logoHeight);
x.save();x.textAlign='right';x.direction='ltr';x.font='bold 14px Arial, sans-serif';
['MENCETAK','MANUSIA','SEUTUHNYA'].forEach((line,i)=>{x.fillStyle=i===0?'#173e51':'#a17a34';x.fillText(line,902,96+i*19)});
x.restore();

ar('شهادة تقدير',200,32,'#94743e');
text('SERTIFIKAT PENGHARGAAN',234,31);
text(`No. ${record.nomor}`,257,11,'#637681','Arial');
ar('تُمنح هذه الشهادة إلى',293,19,'#637681');
text('Diberikan kepada',314,13,'#637681','Arial');
text(record.nama,356,36,'#082e43');
x.beginPath();x.moveTo(270,371);x.lineTo(720,371);x.stroke();
ar('تقديرًا لإتمام تسميع حفظ القرآن الكريم في جلسة واحدة',403,22);
text('Atas pencapaian setoran hafalan Al-Qur’an dalam sekali duduk',427,16);
ar(`عدد الأجزاء: ${arabicNumber(record.jumlahJuz)}`,464,26,'#a17a34');
text(`${record.jumlahJuz} JUZ`,489,18,'#a17a34','Arial');
ar(`التاريخ: ${arabicDate(record.tanggal)}    •    الدرجة: ${arabicNumber(record.nilai)} من ${arabicNumber(100)}`,524,18);
text(`Tanggal ${dateLabel(record.tanggal)}    •    Nilai ${record.nilai} / 100`,549,14,'#173e51','Arial');
ar('مُتَلَقِّي التسميع',594,20,'#637681');
text('Penerima Setoran',615,13,'#637681','Arial');
text(record.guruNama,642,20);
return c}
// Single-page A4 landscape PDF containing the high-resolution certificate artwork.
async function pdf(record){const c=await canvas(record),jpg=await new Promise(resolve=>c.toBlob(resolve,'image/jpeg',.96));if(!jpg)throw Error('Gagal menyiapkan gambar sertifikat.');const bytes=new Uint8Array(await jpg.arrayBuffer()),enc=new TextEncoder(),parts=[],offsets=[0];let length=0;function add(s){const b=typeof s==='string'?enc.encode(s):s;parts.push(b);length+=b.length}function obj(id,s){offsets[id]=length;add(`${id} 0 obj\n${s}\nendobj\n`)}add('%PDF-1.4\n');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');obj(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 841.89 595.28] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');offsets[4]=length;add(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${c.width} /Height ${c.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`);add(bytes);add('\nendstream\nendobj\n');const commands='q 841.89 0 0 595.28 0 0 cm /Im0 Do Q';obj(5,`<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`);const start=length;add('xref\n0 6\n0000000000 65535 f \n');for(let i=1;i<6;i++)add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');add(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`);return new Blob(parts,{type:'application/pdf'})}
return{students,validate,dateLabel,canvas,pdf};
});
