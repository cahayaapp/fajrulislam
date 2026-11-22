const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#nav');
function closeMenu() {
  nav.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
}
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});
nav.addEventListener('click', event => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('open')) {
    closeMenu();
    toggle.focus();
  }
});
window.matchMedia('(min-width: 801px)').addEventListener('change', closeMenu);

const photoDialog = document.querySelector('.photo-dialog');
let photoTrigger;
document.querySelectorAll('[data-photo]').forEach(button => {
  button.addEventListener('click', () => {
    photoTrigger = button;
    const image = button.querySelector('img');
    photoDialog.querySelector('img').src = button.dataset.photo;
    photoDialog.querySelector('img').alt = image.alt;
    photoDialog.querySelector('p').textContent = image.alt;
    photoDialog.showModal();
  });
});
photoDialog.querySelector('.close-photo').addEventListener('click', () => photoDialog.close());
photoDialog.addEventListener('click', event => {
  if (event.target === photoDialog) photoDialog.close();
});
photoDialog.addEventListener('close', () => photoTrigger?.focus());

const characterPrograms = [{"id": "mentoring", "title": "Mentoring dan Coaching Personal", "subtitle": "Pendampingan personal setiap pekan", "paragraphs": ["Setiap santri mengikuti mentoring dan coaching secara one-on-one bersama mentor masing-masing setiap pekan. Kegiatannya meliputi self asesmen perkembangan karakter CAHAYA, apresiasi dan evaluasi capaian, pemecahan kendala, serta perumusan target dan strategi peningkatan serta perbaikan pekanan.", "Progres capaian target perbaikan pekanan dituliskan santri dalam buku jurnal masing-masing dan diperiksa setiap hari oleh ketua usrah masing-masing."], "photos": [{"src": "images/mentoring-coaching.png", "alt": "Pendampingan personal santri bersama mentor dalam program Mentoring dan Coaching"}]}, {"id": "usrah", "title": "Usrah", "subtitle": "Persaudaraan dan pembinaan", "paragraphs": ["Kelompok persaudaraan dan pembinaan yang melatih santri hidup bersosial, bekerja sama, memimpin, dan membangun persahabatan."], "photos": [{"src": "images/usrah.png", "alt": "Kebersamaan santri dalam program Usrah Pesantren Cahaya Fajrul Islam"}]}, {"id": "konseling", "title": "Konseling", "subtitle": "Kesadaran dan perbaikan berkelanjutan", "paragraphs": ["Penanganan pelanggaran santri dilakukan berdasarkan data dan bukti yang akurat melalui proses konseling terstandar. Dengan pendekatan ini, penanganan pelanggaran diharapkan tidak hanya melahirkan hukuman, tetapi juga kesadaran, perbaikan, dan pertumbuhan berkelanjutan."], "photos": []}, {"id": "pembiasaan", "title": "Pembiasaan 24 Jam", "subtitle": "Kebiasaan baik dalam keseharian", "paragraphs": ["Pembiasaan dan pendampingan berlangsung 24 jam, dengan program serta tim pelaksana yang terjadwal dan terstruktur. Pengulangan demi pengulangan diharapkan menumbuhkan kedisiplinan dan kebiasaan-kebiasaan baik."], "photos": []}, {"id": "apresiasi", "title": "Apresiasi Rutin", "subtitle": "Menguatkan capaian kebaikan", "paragraphs": ["Untuk menguatkan capaian kebaikan santri, Pesantren Cahaya Fajrul Islam secara rutin memberikan penghargaan kepada santri yang berprestasi, baik dalam keilmuan maupun karakter."], "photos": []}, {"id": "leadership-camp", "title": "Santri Leadership & Brotherhood Camp", "subtitle": "Mental, fisik, dan kepemimpinan", "paragraphs": ["Program ini menempa kekuatan mental sekaligus fisik santri, membangun keakraban dan persahabatan, serta melatih keterampilan dasar kepemimpinan."], "photos": [{"src": "images/camp-pembinaan.webp", "alt": "Sesi pembinaan dalam Santri Leadership dan Brotherhood Camp"}, {"src": "images/camp-09685.webp", "alt": "Kebersamaan santri putra di Leadership & Brotherhood Camp"}, {"src": "images/camp-09689.webp", "alt": "Kebersamaan santri putri di Leadership & Brotherhood Camp"}, {"src": "images/camp-09472.webp", "alt": "Keakraban santri saat kegiatan camp"}, {"src": "images/camp-09446.webp", "alt": "Kegiatan bersama santri di sungai"}, {"src": "images/camp-09526.webp", "alt": "Kegiatan kelompok di area perkemahan"}, {"src": "images/camp-09351.webp", "alt": "Kebersamaan santri di depan tenda"}, {"src": "images/camp-09190.webp", "alt": "Momen kebersamaan peserta di sungai"}, {"src": "images/camp-09189.webp", "alt": "Potret peserta saat kegiatan sungai"}, {"src": "images/camp-09430.webp", "alt": "Santri mengikuti kegiatan barisan"}, {"src": "images/camp-09168.webp", "alt": "Santri putri mengikuti kegiatan di sungai"}, {"src": "images/camp-09042.webp", "alt": "Semangat santri dalam kegiatan camp"}]}, {"id": "rihlah", "title": "Rihlah dan Pembelajaran Luar Pesantren", "subtitle": "Menyegarkan jiwa, memperluas pengalaman", "paragraphs": ["Untuk menyegarkan jiwa di tengah padatnya jadwal program, pesantren menyiapkan rihlah atau rekreasi serta pembelajaran di luar pondok, seperti kunjungan industri, study tour, dan kegiatan lainnya."], "photos": [{"src": "images/rihlah-tiga-negara.webp", "alt": "Dokumentasi Rihlah 3 Negara: Singapura, Malaysia, dan Thailand"}]}, {"id": "kunjungan", "title": "Kunjungan Rutin", "subtitle": "Orang tua ikut mendampingi pertumbuhan", "paragraphs": ["Peran aktif orang tua menjadi bagian dari penanaman karakter. Setiap bulan, pesantren menyiapkan kunjungan terstruktur: Tasmi’ Al-Qur’an saat orang tua menyimak hafalan ananda; santri mengajar dengan orang tua sebagai murid untuk membagikan ilmu baru yang dipelajari selama sebulan; makan bersama dalam suasana kekeluargaan; serta dzikir dan pengajian bersama.", "Kegiatan ini diharapkan menyelaraskan langkah orang tua, anak, dan pesantren, agar karakter yang terbentuk tetap bertahan ketika santri kembali ke rumah."], "photos": []}];
characterPrograms.push(...[{"id": "talent-0", "title": "Digital dan Jurnalistik Club", "paragraphs": ["Santri belajar menjadi jurnalis remaja sekaligus mengasah kemampuan digital: mulai dari riset dan penulisan tematik hingga mengolahnya menjadi produk jurnalistik digital melalui desain grafis, video editing, dan coding."], "photos": [{"src": "images/digital-jurnalistik-editing.webp", "alt": "Belajar mengolah video bersama"}, {"src": "images/digital-jurnalistik-rekaman.webp", "alt": "Praktik produksi konten dan rekaman"}, {"src": "images/digital-jurnalistik-kelas.webp", "alt": "Belajar dan berdiskusi dengan perangkat digital"}, {"src": "images/digital-jurnalistik-karya.webp", "alt": "Karya jurnalistik dan desain santri"}, {"src": "images/digital-jurnalistik-praktik.webp", "alt": "Mengasah keterampilan melalui praktik langsung"}], "family": "Program Minat Bakat"}, {"id": "talent-1", "title": "Futsal Club", "paragraphs": ["Sarana pengembangan diri bagi santri yang menyukai olahraga, terutama permainan sepak bola atau futsal."], "photos": [{"src": "images/futsal-club.png", "alt": "Santri bermain futsal bersama Futsal Club Pesantren Cahaya Fajrul Islam"}], "family": "Program Minat Bakat"}, {"id": "talent-2", "title": "Tenis Meja", "paragraphs": ["Sarana pengembangan diri bagi santri yang menyukai olahraga tenis meja."], "photos": [{"src": "images/tenis-meja.png?v=2", "alt": "Kegiatan Tenis Meja Pesantren Cahaya Fajrul Islam"}], "family": "Program Minat Bakat"}, {"id": "talent-3", "title": "Running Club", "paragraphs": ["Sarana pengembangan diri bagi santri yang menyukai olahraga lari."], "photos": [{"src": "images/running-club.png", "alt": "Anggota Running Club Pesantren Cahaya Fajrul Islam"}], "family": "Program Minat Bakat"}, {"id": "talent-4", "title": "Hadrah Club", "paragraphs": ["Sarana pengembangan diri bagi santri yang menyukai olah vokal dan alat musik tradisional, seperti rebana."], "photos": [{"src": "images/hadrah.png", "alt": "Kegiatan Hadrah Club Pesantren Cahaya Fajrul Islam"}], "family": "Program Minat Bakat"}, {"id": "talent-5", "title": "Santri Pengusaha (Bisnis)", "paragraphs": ["Sarana pengembangan diri bagi santri yang memiliki minat dalam bidang usaha, terutama santri kelas 11–12."], "photos": [{"src": "images/santri-pengusaha.png", "alt": "Kegiatan Santri Pengusaha (Bisnis) Pesantren Cahaya Fajrul Islam"}], "family": "Program Minat Bakat"}, {"id": "talent-6", "title": "Archery Club", "paragraphs": ["Sarana pengembangan diri bagi santri yang menyukai olahraga panahan, sekaligus untuk meningkatkan kemampuan fokus."], "photos": [{"src": "images/archery.png", "alt": "Kegiatan Archery Club Pesantren Cahaya Fajrul Islam"}], "family": "Program Minat Bakat"}, {"id": "talent-7", "title": "PBB", "paragraphs": ["Melatih kedisiplinan dan cinta tanah air melalui kegiatan peraturan baris-berbaris."], "photos": [{"src": "images/pbb.png?v=2", "alt": "Kegiatan PBB Pesantren Cahaya Fajrul Islam"}], "family": "Program Minat Bakat"}, {"id": "talent-8", "title": "Bela Diri", "paragraphs": ["Membekali santri dengan kemampuan bela diri saat dibutuhkan sekaligus menjaga kebugaran jasmani."], "photos": [{"src": "images/bela-diri.png", "alt": "Kegiatan Bela Diri Pesantren Cahaya Fajrul Islam"}], "family": "Program Minat Bakat"}]);
characterPrograms.push(...[{"id": "level-0", "title": "SMP / Wustha", "family": "Jenjang Pendidikan", "paragraphs": ["Jenjang awal pembentukan karakter dan penguatan dasar keilmuan Islam bagi santri."], "photos": [{"src": "images/belajar-bersama.webp", "alt": "Suasana pembelajaran di Pesantren Cahaya Fajrul Islam"}]}, {"id": "level-1", "title": "SMA / Ulya", "family": "Jenjang Pendidikan", "paragraphs": ["Jenjang lanjutan untuk memperdalam ilmu, memperluas wawasan, dan memantapkan kesiapan masa depan."], "photos": [{"src": "images/ruang-belajar.webp", "alt": "Suasana pembelajaran di Pesantren Cahaya Fajrul Islam"}]}]);
const programDialog = document.querySelector('.program-dialog');
let activeProgram, activePhoto = 0, programTrigger;
const galleryView = programDialog.querySelector('.program-gallery-view');
function showProgramPhoto(index) {
  activePhoto = (index + activeProgram.photos.length) % activeProgram.photos.length;
  const photo = activeProgram.photos[activePhoto];
  const image = galleryView.querySelector('figure img');
  image.src = photo.src;
  image.alt = photo.alt;
  galleryView.querySelector('figcaption').textContent = photo.alt;
  galleryView.querySelector('.program-photo-count').textContent = `${activePhoto + 1} / ${activeProgram.photos.length}`;
  galleryView.querySelectorAll('.program-thumbnails button').forEach((button, i) => button.setAttribute('aria-pressed', String(i === activePhoto)));
}
document.querySelectorAll('[data-program]').forEach(button => {
  button.addEventListener('click', () => {
    programTrigger = button;
    activeProgram = characterPrograms.find(program => program.id === button.dataset.program);
    programDialog.querySelector('h2').textContent = activeProgram.title;
    programDialog.querySelector('.eyebrow').textContent = activeProgram.family || 'Penanaman Karakter CAHAYA';
    const copy = programDialog.querySelector('.program-full-copy');
    copy.replaceChildren(...activeProgram.paragraphs.map(text => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      return paragraph;
    }));
    const hasPhotos = activeProgram.photos.length > 0;
    galleryView.hidden = !hasPhotos;
    const empty = programDialog.querySelector('.program-gallery-empty');
    empty.hidden = hasPhotos;
    const symbol = button.closest('article')?.querySelector('.program-symbol');
    empty.replaceChildren();
    if (!hasPhotos && symbol) empty.append(symbol.cloneNode(true));
    galleryView.querySelector('.program-gallery-controls').hidden = activeProgram.photos.length < 2;
    const thumbnails = galleryView.querySelector('.program-thumbnails');
    thumbnails.replaceChildren(...activeProgram.photos.map((photo, i) => {
      const thumbnail = document.createElement('button');
      thumbnail.type = 'button';
      thumbnail.setAttribute('aria-label', `Foto ${i + 1}: ${photo.alt}`);
      const image = document.createElement('img');
      image.src = photo.src;
      image.alt = '';
      image.loading = 'lazy';
      thumbnail.append(image);
      thumbnail.addEventListener('click', () => showProgramPhoto(i));
      return thumbnail;
    }));
    if (hasPhotos) showProgramPhoto(0);
    programDialog.showModal();
    programDialog.scrollTop = 0;
    document.body.classList.add('program-dialog-open');
  });
});
programDialog.querySelector('.program-prev').addEventListener('click', () => showProgramPhoto(activePhoto - 1));
programDialog.querySelector('.program-next').addEventListener('click', () => showProgramPhoto(activePhoto + 1));
programDialog.querySelector('.program-dialog-close').addEventListener('click', () => programDialog.close());
programDialog.addEventListener('click', event => { if (event.target === programDialog) programDialog.close(); });
programDialog.addEventListener('keydown', event => {
  if (!activeProgram.photos.length || event.target.closest('.program-thumbnails')) return;
  if (event.key === 'ArrowRight') { event.preventDefault(); showProgramPhoto(activePhoto + 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); showProgramPhoto(activePhoto - 1); }
});
programDialog.addEventListener('close', () => {
  document.body.classList.remove('program-dialog-open');
  programTrigger?.focus({preventScroll:true});
});
