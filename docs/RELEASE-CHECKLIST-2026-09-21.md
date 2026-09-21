# Release checklist — 21 September 2026

## Keputusan rilis

**Patch utilitas internal v266 siap ditinjau; bukan sertifikasi seluruh produksi siap.** Tidak ada push, deployment, migrasi, perubahan Rules, rumus KPI, atau catatan operasional produksi. Pengujian memakai browser terisolasi dan fixture. Akses legacy yang belum memiliki pembatasan cakupan tetap ditolak.

Wali Santri **OUT OF SCOPE — NOT MODIFIED**. SHA-256 atas 78 berkas di `wali/` dan `docs/wali/` sama dengan awal task. Kedua bagian Wali pada menu manifest juga dipertahankan identik. Cabang presentasi Wali tetap memakai versi 265.

## Yang diselesaikan

- Satu `panduan-role-v2.html`, registry `js/role-guide-content-v2.js`, dan renderer `js/role-utilities-v2.js`. Tiap peran mendapat 15 bagian Panduan Operasional dan 15 bagian User Manual. Dua area Manajer berbeda; Naqibah memakai pedoman Naqib dengan konteks unit; kewenangan izin Supervisor hanya pada Layanan.
- Konten manual mengikuti menu yang benar-benar diizinkan. Ada pencarian lokal, tab dan cetak browser. Tidak ada bacaan operasional, istilah backend, dokumentasi kasus oleh Naqib/Mentor, atau pemulihan Kontrol Hari Ini pada Manajer Pembinaan.
- Empat utilitas wajib internal: KPI, Pesan, Profil, Panduan & Manual. Resolver pusat tidak bergantung kepada konfigurasi menu legacy.
- KPI lama tetap menggunakan halaman/mesin yang sama. Tujuh peran tanpa formula final menggunakan direktori sumber bukti; **tidak ada agregasi/perhitungan baru**. Skor ditampilkan —. Periode diperiksa di halaman sumber, bukan diklaim sudah dimuat pada direktori.
- Jadwal yang sudah tersedia tetap digunakan. Fallback berisi ritme kerja lokal, dengan keterangan jelas bahwa belum ada jadwal sesi khusus terhubung. Tidak membuat sesi mengajar/manajemen baru.
- Profil tetap satu halaman `profil.html`: identitas, peran aktif, konteks penugasan, peran yang dimiliki dan pemilih peran global. Proses simpan foto/nama/password yang sudah ada tidak ditulis ulang.
- Pesan sidebar dan bottom nav membuka modal yang sama pada shell. `pesan.html` hanya launcher untuk tautan langsung; bukan sistem pesan kedua.
- Bottom internal: **Jadwal | KPI | Beranda | Pesan | Lainnya**. Semua tujuan aktif pada 22 fixture. Drawer dapat menerima fokus dari iframe dan ditutup dengan Escape.

## Hasil audit Pesan

Otoritas: `js/pengurus-whatsapp-chat.js`, dipanggil shell `main-dashboard.html`.

Kontrak dipertahankan: `cahaya_app/pesan_global/{room}`, `pesan_meta/{room}`, `pesan_inbox/{user}`, `pesan_dibaca/{user}`, `notifikasi_user/{user}`. Tidak menambah database, percakapan berbasis role, hak broadcast, atau kebijakan kontak baru.

Penyebab masalah yang ditemukan dan diperbaiki:

1. Normalisasi role shell kanonis dipakai langsung oleh kebijakan kontak chat yang memakai label legacy; kontak kanonis dapat hilang. Konversi kini eksplisit, dan profil kanonis mengutamakan daftar peran miliknya.
2. Master kontak gagal dibaca tetapi kegagalan ditelan dan dianggap selesai. Kini tampil **Pesan belum dapat dimuat** dengan **Coba Lagi**; detail hanya di console.
3. Timer bootstrap berulang dan listener-event berulang; diganti inisialisasi malas berbasis kejadian. Subscription inbox/read/notifikasi dilepas pada pergantian role, berikut listener percakapan dan draft sebelumnya.
4. Variabel `allGlobalNotifs` dan `lastUnreadCount` hilang bersama penghapusan inline chat lama; kini dimiliki mesin chat.
5. Membuka percakapan internal menimpa entri inbox tanpa `lastMessage`. Uji round-trip membuktikan pratinjau hilang. Kini pembaruan metadata memakai field-level update tanpa menimpa pesan terakhir. Cabang percakapan Wali tidak diubah oleh perbaikan ini.
6. State kosong ditampilkan sebagai **Belum Ada Pesan**. Gagal kirim mempertahankan draft dan tidak menampilkan detail backend.
7. Tiga query inbox/status/notifikasi baru dipasang setelah Pesan dibuka, percakapan dibatasi 50 pesan; indeks inbox/notifikasi 100. Master kontak masih memakai pembacaan koleksi pengguna yang sudah ada ketika pertama dibuka, bukan pada Home.

## Matriks internal (fixture browser)

Semua baris: Home, sidebar, Jadwal, KPI, Beranda, Pesan, Lainnya, Profil, Panduan & Manual **PASS** di 409×720, 456×720, 1440×720. PASS berarti navigasi dan inisialisasi fixture, bukan bukti data Firebase produksi lengkap.

| Peran / penugasan | Menu | Tujuan KPI | Hasil |
|---|---:|---|---|
| GURU_PONDOK | 14 | `pendidikan/kpi-guru.html` | PASS fixture |
| GURU_PKBM | 6 | `utilitas-role-v2.html?view=kpi` | PASS fixture |
| NAQIB | 15 | `naqib/kpi.html` | PASS fixture |
| NAQIBAH | 15 | `naqib/kpi.html` | PASS fixture |
| KONSELOR | 12 | `konselor/kpi.html` | PASS fixture |
| MENTOR_USRAH | 8 | `utilitas-role-v2.html?view=kpi` | PASS fixture |
| MANAJER | 14 | `manajer/pendidikan-v2.html?view=kpi` | PASS fixture |
| SUPERVISOR | 16 | `supervisor/workspace-v2.html?view=kpi` | PASS fixture |
| DIREKTUR | 15 | `pimpinan/direktur-v2.html?view=kpi` | PASS fixture |
| KESEHATAN | 10 | `utilitas-role-v2.html?view=kpi` | PASS fixture |
| LAYANAN_KEBERSIHAN | 9 | `utilitas-role-v2.html?view=kpi` | PASS fixture |
| DAPUR | 9 | `utilitas-role-v2.html?view=kpi` | PASS fixture |
| SARPRAS | 9 | `utilitas-role-v2.html?view=kpi` | PASS fixture |
| MEDIA | 8 | `utilitas-role-v2.html?view=kpi` | PASS fixture |
| MANAJER / PEMBINAAN_KARAKTER | 13 | `manajer/pembinaan-karakter-v2.html?view=kpi` | PASS fixture |
| MANAJER / PENDIDIKAN PUTRI | 14 | `manajer/pendidikan-v2.html?view=kpi` | PASS fixture |
| SUPERVISOR / PENDIDIKAN | 15 | `supervisor/workspace-v2.html?view=kpi` | PASS fixture |
| SUPERVISOR / PELAYANAN | 16 | `supervisor/workspace-v2.html?view=kpi` | PASS fixture |
| KONSELOR / MADYA PUTRI | 12 | `konselor/kpi.html` | PASS fixture |
| KESEHATAN / PUTRA terbatas | 6 | `utilitas-role-v2.html?view=kpi` | PASS fixture |
| SARPRAS / PUTRA terbatas | 6 | `utilitas-role-v2.html?view=kpi` | PASS fixture |
| LAYANAN_KEBERSIHAN / PUTRA terbatas | 6 | `utilitas-role-v2.html?view=kpi` | PASS fixture |

Jumlah: **22 konteks**, **248 tujuan menu internal**. Menu legacy yang diblokir tidak dimasukkan sebagai PASS.

## Browser, UI dan pergantian peran

- `tests/role-menu-v2-browser.cjs`: seluruh tujuan menu di atas, nol exception JavaScript; urutan bottom, drawer/keyboard, guide/profil/Pesan, guide zero-read, 30 bagian, pencarian, tab dan pemanggilan cetak browser. Cetak ke printer/PDF sistem operasi tidak diuji.
- Role switch Direktur → Guru → Mentor → Manajer Pendidikan → Direktur: Home, menu, assignment, KPI, Profil, Panduan dan Pesan berubah sesuai peran; identitas tetap; tanpa logout/login; iframe peran sebelumnya dibuang.
- `tests/mobile-home-v2-browser.cjs`: 22 konteks × 409, 456, 550, 1024, 1440 × tinggi 720. Home zero-read, tanpa scroll/overflow/kartu bertindih. Role tunggal tanpa picker; multi-role hanya peran yang dimiliki. Satu bottom nav.
- `tests/release-chat-v266-browser.cjs`: gagal master kontak → retry; kosong → kontak kanonis; kirim → baca → unread; kegagalan kirim mempertahankan draft; last-message tetap; tidak ada room duplikat; Mentor → Guru → Mentor memutus listener lama. Seluruh penulisan hanya dalam objek memori fixture.
- Batas uji UI feature: overflow guide/profil/chat, bukan setiap variasi form bisnis berisi data panjang. Banner permintaan notifikasi global yang sudah ada tidak didesain ulang.
- Bukti gambar lokal dihasilkan harness di `/tmp/cahaya-release-guide-409.png`, `/tmp/cahaya-release-guide-456.png`, `/tmp/cahaya-release-guide-1440.png` dan `/tmp/cahaya-home-*.png`.

## Suite statis / kontrak / sintaks

| Suite | Hasil |
|---|---|
| `tests/release-hardening-v266.cjs` | PASS |
| `tests/role-system-v2.cjs` | PASS |
| `tests/role-menu-v2.cjs` | PASS |
| `tests/role-v2-hardening.cjs` | PASS |
| `tests/manager-education-v2.cjs` | PASS |
| `tests/education-findings-v2.cjs` | PASS |
| `tests/manager-character-v2.cjs` | PASS |
| `tests/manager-home-routing-v2.cjs` | PASS |
| `tests/naqib-core-v2.cjs` | PASS |
| `tests/mentor-usrah-v2.cjs` | PASS |
| `tests/counselor-v2.cjs` | PASS |
| `tests/supervisor-v2.cjs` | PASS |
| `tests/supervisor-permit-v2.cjs` | PASS |
| `tests/director-v2.cjs` | PASS |
| `tests/dapur-v2.cjs` | PASS |
| `tests/media-v2.cjs` | PASS |
| `tests/global-ui-v2-contract.cjs` | PASS |

Asersi lama yang memeriksa teks routing inline diganti dengan hasil resolver aktual (Supervisor, Direktur, Manajer). Asersi Mentor kini memasukkan utilitas navigasi tanpa memberi kewenangan bisnis tambahan. Route legacy yang sengaja ditutup tetap dites ditolak. Tidak mengubah perilaku bisnis agar cocok dengan tes lama.

`global-ui-v2-contract`: **150 entrypoint** root/docs; entrypoint internal v266, Wali tetap v265. `git diff --check`: PASS.

## Suite yang tidak PASS / keterbatasan

- `tests/role-v2-production-readiness.cjs`: **BLOCKED / exit 2**. Penolakan URL admin oleh Guru lulus dengan **0 reads, 0 writes, 0 exceptions**, tetapi diagnostik menyisir route legacy yang masih membutuhkan adapter cakupan, termasuk kalender dan dashboard operasional lama. Tidak disiasati dengan melonggarkan guard.
- `tests/role-v2-entry-guards.cjs`: **PARTIAL / exit 1**, timeout pada baris 86, menunggu `pickProgram` dan `#loading` dari mesin absensi lama. Tahap 14 URL ditolak dan satu iframe bypass selesai sebelum fase itu; seluruh suite bukan PASS. Browser menu terbaru mencakup pembukaan engine absensi saat ini, bukan uji write absensi lengkap.
- `tests/role-v2-protected-source.cjs`: **FAIL snapshot lama**. Snapshot pre-Phase-2B untuk Home Direktur tidak cocok dengan implementasi saat ini (termasuk versi loader). Snapshot tidak diregenerasi untuk memaksa PASS; bukan bukti Wali berubah dalam task ini.
- `PKL/jurnal-pkl.html` tetap diblokir karena pembagian tanggung jawab/cakupan belum aman. Tidak mengembalikan asrama/masjid/kelas ke tugas Layanan.
- Kalender Pendidikan/PKBM belum memiliki adapter domain/cakupan yang disetujui. Guru PKBM menerima panduan, ritme kerja dan direktori bukti kosong yang jujur, bukan fitur Kepondokan.
- Tool legacy Kesehatan, Sarpras dan Layanan hanya bekerja untuk penugasan role-wide yang sudah diizinkan. Assignment unit/Usrah/santri/divisi sempit tetap diblokir agar tidak bocor data. **Jika akun rilis memerlukan tool tersebut dengan assignment sempit, itu blocker rollout akun tersebut**, bukan sesuatu yang dinyatakan selesai oleh utilitas baru.
- Tidak menguji Firebase produksi, aturan akses live, kelengkapan data nyata, penyimpanan profil nyata, penerimaan pesan antarperangkat, push notification, offline/service worker atau upgrade sesi yang sudah lama terbuka.
- Formula KPI baru tidak dibuat. Fallback adalah direktori bukti, bukan rekap otomatis ataupun penilaian Supervisor.

## Gate sebelum push / pemakaian hari ini

1. Tinjau diff task ini bersama perubahan lama yang sudah ada di worktree; jangan menganggap seluruh worktree merupakan patch ini.
2. Pastikan role/assignment akun operasional memang termasuk cakupan yang didukung. Jangan membuka guard tool legacy yang belum scoped.
3. Pada deployment yang sebenarnya, muat ulang shell baru dan verifikasi baca-saja Home → KPI → Pesan → Profil → Panduan untuk akun sasaran. Live Firebase belum menjadi PASS dalam laporan ini.
4. Tidak ada push/deploy dilakukan oleh task ini. Rules, skema, bobot KPI, hierarki eskalasi dan Wali tidak berubah.

## Daftar perubahan task ini

Perubahan fungsi/presentasi internal: `main-dashboard.html`, `profil.html`, `js/role-system-v2.js`, `js/role-route-registry-v2.js`, `js/role-navigation-v2.js`, `js/role-menu-v2.js`, `js/role-entry-v2.js`, `js/cahaya-ui-v2.js`, `js/mobile-home-v2.js`, `js/pengurus-whatsapp-chat.js`, `css/pengurus-whatsapp-chat.css`.

Baru: `panduan-role-v2.html`, `utilitas-role-v2.html`, `pesan.html`, `js/role-guide-content-v2.js`, `js/role-utilities-v2.js`, `css/role-utilities-v2.css`.

Mirror produksi identik di `docs/`. Sebagian besar entrypoint HTML hanya mengalami pembaruan query versi script, bukan perubahan workflow/UI. Total **150 berkas produksi root + 150 mirror**.

Test yang ditambah/disesuaikan:
- `tests/release-hardening-v266.cjs`
- `tests/release-chat-v266-browser.cjs`
- `tests/role-menu-v2-browser.cjs`
- `tests/mobile-home-v2-browser.cjs`
- `tests/role-v2-hardening.cjs`
- `tests/mentor-usrah-v2.cjs`
- `tests/manager-education-v2.cjs`
- `tests/manager-character-v2.cjs`
- `tests/manager-home-routing-v2.cjs`
- `tests/supervisor-v2.cjs`
- `tests/director-v2.cjs`
- `tests/global-ui-v2-contract.cjs`

Dokumentasi: checklist ini dan `docs/CAHAYA-ROLE-MENU-MANIFEST.md`.

<details>
<summary>Inventaris lengkap berkas produksi root (masing-masing memiliki mirror docs/)</summary>

- `PKL/buku-tamu.html`
- `PKL/jurnal-pkl.html`
- `PKL/penitipan-barang.html`
- `admin/admin_komentar.html`
- `admin/admin_media.html`
- `admin/atur-jadwal.html`
- `admin/database.html`
- `admin/qrkelas.html`
- `admin/rapot-uas.html`
- `admin/settings.html`
- `admin/users.html`
- `cetak-kalender-materi.html`
- `css/pengurus-whatsapp-chat.css`
- `css/role-utilities-v2.css`
- `dapur/app.html`
- `dapur/panduan.html`
- `dashboard-operasional/divisi.html`
- `dashboard-operasional/semua-divisi.html`
- `deploy-v129.html`
- `guru/absenguru.html`
- `guru/absensiPembelajaran.html`
- `guru/capaian-materi.html`
- `guru/gurumenulis.html`
- `guru/inputNilaiUjian.html`
- `guru/inputSetoranTahfiz.html`
- `guru/lapor-pelanggaran.html`
- `guru/laporan-murojaah.html`
- `guru/tindak-lanjut.html`
- `home-dapur.html`
- `home-direktur.html`
- `home-guru.html`
- `home-konselor.html`
- `home-manajer-pembinaan-karakter.html`
- `home-manajer-pendidikan.html`
- `home-media.html`
- `home-mentor-usrah.html`
- `home-naqib.html`
- `home-supervisor-v2.html`
- `home.html`
- `index-v126.html`
- `index-v127.html`
- `index.html`
- `js/cahaya-ui-v2.js`
- `js/mobile-home-v2.js`
- `js/pengurus-whatsapp-chat.js`
- `js/role-entry-v2.js`
- `js/role-guide-content-v2.js`
- `js/role-menu-v2.js`
- `js/role-navigation-v2.js`
- `js/role-route-registry-v2.js`
- `js/role-system-v2.js`
- `js/role-utilities-v2.js`
- `kalender.html`
- `kesehatan/jurnal.html`
- `kesehatan/pemeriksaan.html`
- `kesehatan/perizinan-uks.html`
- `kesehatan/stokobat.html`
- `keuangan/kasir.html`
- `keuangan/pengaturan-modul.html`
- `keuangan/pusat-keuangan.html`
- `konselor/cases-v2.html`
- `konselor/daftar-kasus-baru.html`
- `konselor/higher-response.html`
- `konselor/kpi.html`
- `konselor/self-asesmen.html`
- `layanan/buku-izin.html`
- `main-dashboard.html`
- `manajer/jadwal-pendidikan.html`
- `manajer/kontrol-pembinaan.html`
- `manajer/kontrol-pendidikan.html`
- `manajer/materi-pembelajaran.html`
- `manajer/observasi-pendidikan.html`
- `manajer/pantau-nilai-bulanan.html`
- `manajer/pembinaan-guru.html`
- `manajer/pembinaan-karakter-v2.html`
- `manajer/pendidikan-v2.html`
- `media/target-capaian.html`
- `naqib/absensi.html`
- `naqib/edit-usrah.html`
- `naqib/gamifikasi.html`
- `naqib/jadwalpiket.html`
- `naqib/jurnal-piket.html`
- `naqib/kedisiplinan.html`
- `naqib/kpi.html`
- `naqib/laporan-pelaksanaan.html`
- `naqib/naqib-teladan.html`
- `naqib/program-hari-ini.html`
- `naqib/skor-kedisiplinan-usrah.html`
- `observer/dapur.html`
- `observer/kebersihan-kelas.html`
- `observer/kebersihan.html`
- `observer/ketertiban-kelas.html`
- `observer/pembelajaran.html`
- `observer/pengasuhan.html`
- `observer/sarpras.html`
- `observer/uks.html`
- `panduan-role-v2.html`
- `pembinaan/mentor-usrah-v2.html`
- `pembinaan/mentoring-individu.html`
- `pembinaan/mentoring-usrah.html`
- `pembinaan/pantau-asesmen.html`
- `pembinaan/pantau-pendampingan.html`
- `pendidikan/absensi-ibadah-guru.html`
- `pendidikan/kpi-guru.html`
- `pendidikan/manajemen-kelas.html`
- `pendidikan/tindak-lanjut-akademik.html`
- `pesan.html`
- `pimpinan/cetak-laporan.html`
- `pimpinan/dashboard-divisi.html`
- `pimpinan/dashboard-dua-divisi.html`
- `pimpinan/dashboard-pendidikan.html`
- `pimpinan/dashboard-pimpinan.html`
- `pimpinan/direktur-v2.html`
- `pimpinan/keputusan-direktur.html`
- `pimpinan/perizinan-santri.html`
- `pimpinan/rapat-evaluasi-pembinaan-karakter.html`
- `pimpinan/rapat-evaluasi-pendidikan.html`
- `pimpinan/rekap-kepala-sekolah.html`
- `profil.html`
- `pusat-asesmen/guru.html`
- `pusat-asesmen/naqib.html`
- `pusat-asesmen/santri.html`
- `pusat-asesmen/semester.html`
- `rapat/notulensi-rapat.html`
- `role-workspace.html`
- `rpp-generator.html`
- `sarpras/checklist.html`
- `sarpras/jurnal.html`
- `sarpras/tindak-lanjut.html`
- `supervisor/command-center.html`
- `supervisor/index.html`
- `supervisor/kpi-input.html`
- `supervisor/monitoringabsenguru.html`
- `supervisor/raport-bulanan.html`
- `supervisor/raport-cahaya-bulanan.html`
- `supervisor/raport-sdm.html`
- `supervisor/review-izin-santri.html`
- `supervisor/review-pembinaan.html`
- `supervisor/review-pendidikan.html`
- `supervisor/supervisor.html`
- `supervisor/tindak-lanjut-sdm.html`
- `supervisor/tinjau-laporan-bulanan.html`
- `supervisor/workspace-v2.html`
- `tools/role-v2-profile-audit.html`
- `utilitas-role-v2.html`
- `workspace/asisten-naqib.html`
- `workspace/guru.html`
- `workspace/mentor-quran.html`
- `workspace/naqib-operasional.html`
- `workspace/naqib-pendamping.html`

</details>
