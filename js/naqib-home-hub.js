(()=>{'use strict';
const P=window.parent!==window?window.parent:window,$=id=>document.getElementById(id);
let USER=profile();function profile(){try{return JSON.parse(localStorage.getItem('cahayaCurrentUser')||'{}')||{}}catch{return{}}}
function openMenu(id){try{if(typeof P.openAuthorizedMenu==='function'){P.openAuthorizedMenu(id);return}}catch(e){console.warn(e)}toast('Fitur dibuka melalui portal utama CAHAYA.')}window.openMenu=openMenu;
window.openReportPicker=()=>openMenu('menu-jurnal-piket');
function actualName(u={}){const vals=[u.label,u.nama,u.namaTampilan,u.displayName,u.name,u.username,u.email&&String(u.email).split('@')[0]].filter(Boolean);return String(vals.find(v=>!/^admin(?: cahaya)?$/i.test(String(v).trim()))||'Naqib').trim()}
function identity(data){USER={...USER,...(data||{})};const name=actualName(USER),a=$('avatarBtn');$('userName').textContent=name;a.textContent=name.charAt(0).toUpperCase();a.setAttribute('aria-label','Profil '+name);const photo=USER.fotoProfil||USER.photoURL||USER.avatar;if(photo){const image=new Image();image.src=photo;image.alt='Profil '+name;image.onerror=()=>{a.textContent=name.charAt(0).toUpperCase()};a.replaceChildren(image)}}
const months=['Muharam','Safar','Rabiul Awal','Rabiul Akhir','Jumadil Awal','Jumadil Akhir','Rajab','Syakban','Ramadan','Syawal','Zulkaidah','Zulhijah'];
function hijri(d){try{return new Intl.DateTimeFormat('id-ID-u-ca-islamic',{timeZone:'Asia/Jakarta',day:'numeric',month:'long',year:'numeric'}).format(d).replace('H','').trim()+' H'}catch{return''}}
const now=new Date();$('dateM').textContent=new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',day:'numeric',month:'long',year:'numeric'}).format(now);$('dateH').textContent=hijri(now);
const icon=path=>`<svg viewBox="0 0 24 24"><path d="${path}"/></svg>`,menus=[
['Asesmen CAHAYA Santri','Nilai perkembangan lima dimensi santri',icon('m12 3 7 7-7 11L5 10z'),"openMenu('menu-asesmen-santri')"],
['Self Asesmen Naqib','Refleksi dan fokus perbaikan pekanan',icon('M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M18 8v6M15 11h6'),"openMenu('menu-asesmen-naqib')"],
['Lapor Kasus / Pelanggaran','Laporkan kejadian untuk ditindaklanjuti Konselor',icon('M12 3 2 21h20zM12 9v5M12 18h.01'),"openMenu('menu-laporan-murojaah')"],
['Skor Kedisiplinan','Pantau skor santri dan usrah',icon('M4 20V10M10 20V4M16 20v-7M22 20V7'),"openMenu('menu-skor-usrah')"],
['Riwayat Laporan','Lihat laporan pelaksanaan sebelumnya',icon('M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2'),"openMenu('menu-riwayat-laporan')"],
['Panduan Kerja','Tugas, standar, SOP, dan batas kewenangan',icon('M3 5a4 4 0 0 1 4-2h5v18H7a4 4 0 0 0-4 2zM21 5a4 4 0 0 0-4-2h-5v18h5a4 4 0 0 1 4 2z'),"openMenu('menu-panduan-kerja')"]
];
$('menuGrid').innerHTML=menus.map(([title,desc,icon,action,disabled])=>'<button type="button" class="menu-card'+(disabled?' disabled':'')+'" '+(action?'onclick="'+action+'"':'aria-disabled="true"')+'><span class="menu-icon">'+icon+'</span><span class="menu-copy"><b>'+title+'</b><small>'+desc+'</small></span><span class="menu-arrow">'+(disabled?'':'↗')+'</span>'+(disabled?'<span class="soon">BELUM TERSEDIA</span>':'')+'</button>').join('');
const guide=[
['Peran Saya','Naqib mendampingi kehidupan harian santri dan memastikan program dijalankan dengan tertib, khidmat, tepat waktu, bersih, dan melibatkan santri.'],
['Tugas Utama','Mendampingi program, mencatat absensi, melaporkan pelaksanaan, mengisi Asesmen CAHAYA, mencatat inisiatif positif santri, serta melaporkan pelanggaran.'],
['Alur Kerja Harian','Buka Program Santri → dampingi kegiatan → isi Absensi Program → catat kondisi pada Laporan Pelaksanaan → laporkan kejadian bila diperlukan.'],
['Standar Kerja','Catatan harus faktual, tepat waktu, sesuai program dan santri yang benar. Inisiatif positif mengikuti kategori serta poin yang sudah dikonfigurasi sistem.'],
['Batas Kewenangan','Naqib tidak melakukan konseling formal, tabayyun, penetapan hukuman/konsekuensi, pemberian poin pelanggaran, penutupan kasus, audit formal, atau verifikasi Manager/Supervisor.','boundary'],
['Jika Ada Masalah','Jaga keselamatan dan ketertiban, catat fakta, lalu gunakan Lapor Kasus/Pelanggaran. Penanganan selanjutnya menjadi kewenangan Konselor atau pejabat yang berwenang.'],
['Panduan Fitur','Program untuk melihat kegiatan; Absensi untuk kehadiran; Laporan untuk kondisi operasional; Catat Inisiatif untuk perilaku positif; Asesmen untuk lima dimensi CAHAYA.'],
['FAQ','Inisiatif positif boleh dicatat sesuai konfigurasi yang ada. Pelanggaran hanya dilaporkan—Naqib tidak menangani atau memutuskan konsekuensi.']
];
window.openGuide=()=>{$('guideBody').innerHTML=guide.map(([t,d,c])=>'<article class="guide-item '+(c||'')+'"><b>'+t+'</b><p>'+d+'</p></article>').join('');$('guideModal').classList.add('show');$('guideModal').setAttribute('aria-hidden','false')};
window.closeGuide=()=>{$('guideModal').classList.remove('show');$('guideModal').setAttribute('aria-hidden','true')};
window.openRoleSelector=()=>{if(typeof P.openCahayaGlobalRoleModal==='function')P.openCahayaGlobalRoleModal();else toast('Pemilihan role tersedia melalui portal utama.')};
let tt;function toast(message){const t=$('routeToast');t.textContent=message;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),2600)}
function suspend(){closeGuide();clearTimeout(tt);$('routeToast').classList.remove('show')}window.addEventListener('cahaya:suspend',suspend);
window.addEventListener('message',e=>{if(e.source!==P||e.origin!==location.origin)return;if(e.data?.type==='CAHAYA_PROFILE_SYNC')identity(e.data.profile);if(e.data?.type==='CAHAYA_PAGE_SUSPEND')suspend()});
window.addEventListener('cahaya:resume',()=>identity(profile()));identity();if(P!==window)P.postMessage({type:'CAHAYA_PROFILE_REQUEST'},location.origin);
})();
