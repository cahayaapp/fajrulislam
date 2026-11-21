from pathlib import Path
from html import escape
import base64,textwrap,json
out=Path('poster/assets'); catalog=[]
def image_data(name):
 return 'data:image/webp;base64,'+base64.b64encode(Path('psb/images/'+name+'.webp').read_bytes()).decode()
logo=image_data('logo-pesantren')
def text(x,y,t,size=28,color='#173f36',weight='400',family='Arial',italic=False):
 return f'<text x="{x}" y="{y}" fill="{color}" font-family="{family}" font-size="{size}" font-weight="{weight}"'+(' font-style="italic"' if italic else '')+'>'+escape(t)+'</text>'
def para(x,y,t,width=900,size=26,color='#435d54',weight='400',line=None):
 line=line or size*1.38
 # Conservative wrapping so downloadable files use consistent geometry.
 chars=max(8,int(width/(size*.54)))
 lines=textwrap.wrap(t,chars,break_long_words=False)
 return ''.join(text(x,y+i*line,l,size,color,weight) for i,l in enumerate(lines)),y+len(lines)*line

def box(x,y,w,h,fill='#fffdf5',radius=26,stroke='#e0d4b4'):
 return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke}"/>'
def photo(name,x,y,w,h,pos='xMidYMid'):
 id='p'+str(x)+str(y)
 return f'<defs><clipPath id="{id}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="24"/></clipPath></defs><image href="{image_data(name)}" x="{x}" y="{y}" width="{w}" height="{h}" preserveAspectRatio="{pos} slice" clip-path="url(#{id})"/>'
def start(label,headline,sub=''):
 s=f'''<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><defs><linearGradient id="green" x2="1" y2="1"><stop stop-color="#08755c"/><stop offset="1" stop-color="#003e34"/></linearGradient><linearGradient id="gold"><stop stop-color="#f8e4aa"/><stop offset="1" stop-color="#bc8d32"/></linearGradient></defs><rect width="1080" height="1350" fill="#faf6eb"/><path d="M810 0H1080V440Q880 280 810 0" fill="#e9eddc"/><circle cx="1100" cy="620" r="390" fill="none" stroke="#dcc58f" stroke-opacity=".35"/><rect x="22" y="22" width="1036" height="1306" rx="38" fill="none" stroke="#d1b36d" stroke-width="2"/><rect width="1080" height="140" fill="#fffdf7"/><image href="{logo}" x="64" y="35" width="370" height="75" preserveAspectRatio="xMinYMid meet"/>{text(752,65,'PSB 2027/2028',22,'#075548','700')}{text(752,97,'BELITUNG',18,'#96702d','700')}<path d="M64 140H1016" stroke="#d9bf81"/>'''
 s+=text(64,190,label.upper(),21,'#a2782b','700')
 t,y=para(64,254,headline,950,52,'#073f34','700',58);s+=t
 if sub:
  t,y=para(64,y+20,sub,940,24);s+=t;y+=16
 return s,y+25

def end(slug,title,s):
 s+='<path d="M0 1230Q520 1190 1080 1230V1350H0Z" fill="url(#green)"/><path d="M0 1230Q520 1190 1080 1230" fill="none" stroke="url(#gold)" stroke-width="5"/>'
 s+=text(64,1284,'KENALI PESANTREN • MULAI PENDAFTARAN',17,'#f5d990','700')+text(64,1320,'cahayaapp.com/psb',30,'white','700')+text(744,1284,'INFORMASI / WHATSAPP',17,'#f5d990','700')+text(744,1320,'0818-1818-9322',25,'white','700')+'</svg>'
 (out/(slug+'.svg')).write_text(s)
 catalog.append({'id':slug,'title':title,'file':'assets/'+slug+'.svg'})

def cards(s,items,y=390,cols=2,h=175):
 gap=20;w=(952-gap*(cols-1))/cols
 for i,(heading,body) in enumerate(items):
  x=64+(i%cols)*(w+gap);yy=y+(i//cols)*(h+gap)
  s+=box(x,yy,w,h)
  t,cy=para(x+24,yy+35,heading,w-48,25,'#075548','700',29);s+=t
  t,_=para(x+24,cy+8,body,w-48,22,line=28);s+=t
 return s

# Two complete testimonial posters.
quotes=[('testimoni-ahmad-riyadi','testimoni-wali-ahmad-riyadi-adiba','Tumbuh bersama. Terasa perubahannya.','Ahmad Riyadi dan Adiba','Memilih mondok di Fajrul Islam Belitung adalah salah satu keputusan terbaik untuk pendidikan putra dan putri kami. Kurikulumnya seimbang antara tahfiz, kajian kitab, dan pelajaran umum dengan menggunakan Kurikulum Cahaya. Perubahan adab, kedisiplinan, dan empati terhadap sesama bertumbuh seiring perjalanan putra dan putri kami di pondok.'),('testimoni-najmihadi','testimoni-wali-muhammad-syauqi','Lebih mandiri. Lebih baik adabnya.','Najmihadi Syauqii Tamaam','Saya bersyukur telah memilih Pondok Pesantren Fajrul Islam untuk anak saya, karena keterbatasan ilmu saya dalam menanamkan pemahaman agama Islam yang utuh kepadanya. Harapan saya, di pondok ia mendapat pendidikan dan pengalaman untuk tumbuh menjadi laki-laki yang mandiri dan bertanggung jawab di masa depan. Kini, ananda lebih disiplin dalam waktu shalat, lebih lembut tutur katanya, serta lebih baik adab dan sopan santunnya. Terima kasih kepada Abah, seluruh pengajar, dan pengurus yang telah ikhlas mencurahkan ilmu, pikiran, dan tenaga untuk anak-anak saleh. Semoga Allah membalas dengan pahala yang berlipat ganda.')]
for slug,img,headline,name,q in quotes:
 s,y=start('Cerita nyata keluarga Cahaya',headline)
 s+=photo(img,64,370,350,650)
 s+=box(438,370,578,800)
 t,yy=para(468,420,'“'+q+'”',518,25,line=35);s+=t
 t,yy=para(468,yy+32,'Walisantri '+name,518,24,'#075548','700');s+=t
 end(slug,'Testimoni · '+name,s)

s,y=start('Alumni Cahaya','Melangkah lebih jauh.','Perjalanan belajar berlanjut ke perguruan tinggi di dalam dan luar negeri.')
alumni=[('Haidar dan Hudzaifah','Universitas Al-Azhar Mesir'),('Muhammad Zahid','Universitas Pendidikan Indonesia, Bandung'),('M Zhidan AM','Universitas Muhammadiyah Yogyakarta'),('Medli Saputra','Universitas Bangka Belitung'),('Marel','Universitas Negeri Semarang'),('Alzam Abdullah','Universitas Ari Ginanjar'),('Marfel Saputra','UIN Sunan Gunung Djati, Bandung'),('Alvin Dwianto','Universitas Muhammadiyah Bandung')]
for i,(name,uni) in enumerate(alumni):
 x=64+(i%4)*243;yy=390+(i//4)*370
 s+=box(x,yy,223,350)+photo('alumni-potret-terbaru' if i==0 else 'alumni-0'+str(i),x,yy,223,220)
 t,cy=para(x+14,yy+250,name,195,21,'#075548','700',25);s+=t
 t,_=para(x+14,cy+6,uni,195,18,line=23);s+=t
end('alumni','Sebaran alumni',s)

s,y=start('Mengenal pesantren','Pendidikan untuk manusia seutuhnya.')
s+=photo('pesantren',64,380,952,410)
t,yy=para(64,845,'Pesantren Cahaya Fajrul Islam hadir di Kabupaten Belitung untuk mendampingi tumbuhnya pribadi yang mencintai Allah, berakhlak mulia, berhati bersih, berakal cerdas, serta memiliki tubuh yang sehat dan berdaya.',940,30,line=41);s+=t
t,_=para(64,yy+28,'Ilmu, karakter, dan kehidupan sehari-hari berjalan bersama. Inilah arah pendidikan yang kami sebut karakter CAHAYA.',940,27,line=37);s+=t
end('mengenal-pesantren','Mengenal pesantren',s)

s,y=start('Pengasuh pesantren','Syekh Multazam Zakaria','Akrab disapa “Abah Multazam”.')
s+=photo('pengasuh',64,390,325,530,'xMidYMin')
t,yy=para(420,418,'Pesantren diasuh langsung oleh Syekh Multazam Zakaria, Syekh Mursyid silsilah ke-39 dalam Thariqah Naqsyabandiyah Khalidiyah di bawah bimbingan Syekh Zainal Abidin.',570,25,line=35);s+=t
t,yy=para(420,yy+22,'Silsilah berlanjut melalui Syekh Karminanto, Buya Dr. Syekh Musytari, dan Prof. Dr. Syekh Jalaluddin (PPTI 1920), dari jalur Abi Jabal Qubais, Mekah.',570,24,line=33);s+=t
s+=text(64,969,'PENDIDIKAN & BIDANG KEAHLIAN',22,'#a2782b','700')
t,_=para(64,1010,'Pendidikan pesantren hingga doktoral (S3), sanad Al-Qur’an, hadits, dan ilmu keislaman. Memiliki sertifikat kompetensi dalam self development, parenting, transforming behavior, dan pengelolaan lembaga wakaf.',940,26,line=36);s+=t
end('pengasuh','Pengasuh pesantren',s)

s,y=start('Kurikulum keilmuan','Berakar pada iman. Terbuka pada pengetahuan.')
s=cards(s,[('Tahfiz Al-Qur’an','Menguatkan kedekatan dengan Al-Qur’an melalui pendidikan tahfiz.'),('Kitab Kuning','Mendalami khazanah keilmuan Islam sebagai fondasi pemahaman agama.'),('Kurikulum Nasional','Mengembangkan keilmuan untuk melanjutkan pendidikan dan menghadapi kehidupan.')],390,1,170)
s+=photo('kurikulum-diskusi',64,980,466,205)+photo('kurikulum-kelas',550,980,466,205)
end('kurikulum','Kurikulum keilmuan',s)

s,y=start('Program penanaman karakter','Menjadi pribadi yang bercahaya.')
for i,(letter,name) in enumerate([('C','Cinta Allah'),('A','Akhlak Mulia'),('H','Hati Bersih'),('A','Akal Cerdas'),('YA','Fisik Berdaya')]):
 x=64+i*194;s+=box(x,370,176,128,'#075548')+text(x+60,425,letter,44,'#f6dc9c','700')+text(x+12,470,name,21,'white','700')
items=[('Mentoring & Coaching','Refleksi pekanan, apresiasi, evaluasi, target perbaikan, dan jurnal harian.'),('Usrah','Persaudaraan, kerja sama, kepemimpinan, dan persahabatan.'),('Konseling','Kesadaran dan perbaikan berkelanjutan melalui pendampingan berbasis data.'),('Pembiasaan 24 Jam','Pendampingan terstruktur untuk disiplin dan kebiasaan baik.'),('Apresiasi Rutin','Penghargaan atas prestasi keilmuan dan karakter santri.'),('Leadership & Brotherhood Camp','Menempa mental, fisik, keakraban, dan kepemimpinan.'),('Rihlah & Belajar di Luar','Rekreasi, study tour, dan kunjungan pembelajaran.'),('Kunjungan Rutin','Tasmi’, santri mengajar, makan bersama, dzikir, dan pengajian keluarga.')]
s=cards(s,items,520,2,153);end('karakter','Program penanaman karakter',s)

s,y=start('Program minat bakat','Temukan minat. Kembangkan kemampuan.')
s+=photo('digital-jurnalistik-editing',64,380,440,260)
s+=text(535,419,'Digital dan',31,'#075548','700')+text(535,459,'Jurnalistik Club',31,'#075548','700')
t,_=para(535,505,'Riset, menulis tematik, desain grafis, video editing, hingga coding.',450,26,line=36);s+=t
s=cards(s,[('Futsal & Tenis Meja','Mengembangkan kemampuan dan sportivitas.'),('Running & Archery','Kebugaran, daya tahan, dan fokus.'),('Hadrah Club','Olah vokal dan alat musik tradisional rebana.'),('Santri Pengusaha','Pengembangan minat usaha, terutama kelas 11–12.'),('PBB','Melatih kedisiplinan dan cinta tanah air.'),('Bela Diri','Bekal pertahanan diri dan kebugaran jasmani.')],670,2,150)
end('minat-bakat','Program minat bakat',s)

s,y=start('Digitalisasi pesantren','Dari pesantren, terhubung ke rumah.','CAHAYA App membantu orang tua mengikuti perkembangan ananda.')
items=[('Presensi Belajar & Program','Pantau kehadiran ananda dalam kegiatan belajar dan setiap program.'),('Mentoring Pekanan','Ikuti hasil mentoring, capaian, serta target perbaikan dan peningkatan.'),('Tahfiz Al-Qur’an','Pantau perkembangan tahfiz ananda dari rumah.'),('Transaksi Keuangan','Pantau transaksi, top up saldo, dan riwayat belanja melalui aplikasi yang disediakan.')]
s=cards(s,items,430,1,160)
s+=text(64,1185,'Dan beragam fitur lainnya untuk mendampingi keluarga.',25,'#075548','700')
end('digitalisasi','Digitalisasi · CAHAYA App',s)

s,y=start('Jenjang pendidikan','Satu arah pendidikan. Dua tahap perjalanan.','Pendidikan untuk santri putra dan putri.')
s+=photo('ruang-belajar',64,410,952,280)
s=cards(s,[('SMP / Wustha','Jenjang awal pembentukan karakter dan penguatan dasar keilmuan Islam.'),('SMA / Ulya','Memperdalam ilmu, memperluas wawasan, dan memantapkan kesiapan masa depan.')],720,2,270)
t,_=para(64,1055,'Lembaga pendidikan resmi di bawah naungan Kementerian Pendidikan dan Kementerian Agama Republik Indonesia.',940,27,line=38);s+=t
end('jenjang','Jenjang pendidikan',s)

s,y=start('Jadwal PSB 2027/2028','Catat waktunya. Siapkan langkahnya.')
for i,(wave,reg,test,pay) in enumerate([('Gelombang I','25 November–31 Desember 2026','Januari 2027','Januari–Februari 2027'),('Gelombang II','1 Januari–28 Februari 2027','Maret 2027','1 April–31 Mei 2027'),('Gelombang III','1 Maret–30 April 2027','Mei 2027','16 Mei–30 Juni 2027')]):
 yy=365+i*275;s+=box(64,yy,952,250)+text(92,yy+44,wave,32,'#075548','700')+text(92,yy+92,'Pendaftaran: '+reg,27)+text(92,yy+138,'Tes, pengumuman & daftar ulang: '+test,25)+text(92,yy+184,'Pembayaran: '+pay,25)
end('jadwal','Jadwal penerimaan santri baru',s)

s,y=start('Biaya PSB 2027/2028','Rencanakan pendidikan ananda.','Biaya pendaftaran & psikotes: Rp 300.000 (terpisah dari biaya masuk).')
fees=[('Daftar ulang','1.000.000'),('Infaq pembangunan','4.000.000'),('Kasur & bantal','825.000'),('Perawatan fasilitas','650.000'),('Seragam 3 pcs','800.000'),('Ranjang + lemari','1.250.000'),('Sampul rapot','100.000'),('Kitab satu tahun','250.000')]
for i,(n,v) in enumerate(fees):
 yy=420+i*51;s+=box(64,yy-32,952,48,'#fffdf7' if i%2==0 else '#eaf0df',8)+text(90,yy,n,26)+text(775,yy,'Rp '+v,26)
s+=box(64,838,952,70,'#075548')+text(90,884,'TOTAL BIAYA MASUK',28,'white','700')+text(750,884,'Rp 8.875.000',29,'#ffe5a2','700')
s=cards(s,[('Gelombang I','Rp 7.875.000'),('Gelombang II','Rp 8.375.000'),('Gelombang III','Rp 8.875.000')],935,3,125)
t,_=para(64,1110,'Pembayaran biaya masuk dapat dilakukan dalam 3 kali cicilan/angsuran.',940,28,line=39);s+=t
end('biaya','Biaya pendaftaran dan biaya masuk',s)

s,y=start('Persiapan calon santri','Syarat & ketentuan.')
terms=['Niat yang kuat dan ikhlas mondok karena Allah, atas kemauan calon santri sendiri dan ridho orang tua/wali.','Sehat jasmani/fisik dan rohani.','Bersedia mengikuti rangkaian tes seleksi masuk pesantren.','Bersedia tinggal di asrama dan menaati seluruh peraturan pesantren.','Sanggup mengikuti seluruh kegiatan pendidikan dan kepesantrenan.','Minimal lulus SD/MI.','Santri pindahan mendapat restu dan izin pengasuh pesantren/madrasah sebelumnya, disertai surat keterangan pindah.','Santri pindahan dari sekolah formal minimal jenjang SMP/SMA.','Membayar biaya pendaftaran dan psikotes Rp 300.000.','Pembayaran ke BSI 7135472179 a/n YAYASAN INSAN BESTARI SEJAHTERA. Konfirmasi bukti transfer ke WA 0818-1818-9322.']
y=345
for i,t in enumerate(terms):
 s+=text(64,y,str(i+1).zfill(2),25,'#a2782b','700');tx,yy=para(118,y,t,885,25,line=33);s+=tx;y=yy+19
end('syarat','Syarat dan ketentuan',s)

s,y=start('Langkah pendaftaran','Mulai perjalanan bersama Cahaya.','Pendaftaran dilakukan secara online melalui portal calon wali santri.')
s=cards(s,[('1. Buat akun calon wali','Pilih email atau nomor HP sebagai identitas akun.'),('2. Isi data & asesmen','Lengkapi formulir pendaftaran dan asesmen calon wali serta santri.'),('3. Tes & wawancara','Pantau pengumuman jadwal melalui akun calon wali.'),('4. Lihat hasil','Hasil seleksi tersedia di akun setelah diumumkan pengurus.')],415,1,170)
end('pendaftaran','Alur pendaftaran',s)
Path('poster/catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2))
print(len(catalog),'posters generated')
