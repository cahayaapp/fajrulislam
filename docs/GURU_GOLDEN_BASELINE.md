# Guru Golden Baseline

## Status

- **Sumber kanonis UI/UX Guru:** commit `aa92614`
- **Tanggal pembekuan:** 16 September 2026
- **Cakupan:** pengalaman Guru saja; bukan baseline seluruh aplikasi.
- **Aturan keras:** “No Guru UI/behavior may be changed unless explicitly requested by the user.”

## Berkas yang Dipulihkan dari `aa92614`

- `home-guru.html`
- `docs/home-guru.html`

Kedua salinan tersebut dipulihkan byte-for-byte dari baseline. Berkas Guru inti berikut diperiksa dan sudah identik dengan `aa92614`, sehingga tidak perlu ditulis ulang:

- seluruh `guru/*`
- `guru/guru-ui-final-v190.css`
- `js/guru-kpi-v144.js`
- `config/master-data.js`
- data jadwal yang dipakai Guru

## Integrasi Minimum pada Shell Saat Ini

`main-dashboard.html` dan `docs/main-dashboard.html` tidak dikembalikan seluruhnya ke commit lama karena keduanya juga memuat routing dan modul role baru yang tidak berkaitan dengan Guru. Integrasi minimum yang dipertahankan adalah:

1. Home Guru selalu memuat `home-guru.html?v=195` yang berisi UI Golden.
2. Bottom navigation Guru berisi tepat lima item.
3. Tombol Jadwal memanggil `openScheduleModal()` pada Home Guru yang sedang hidup; jika Home belum hidup, shell memuatnya dengan action `openSchedule=1`.
4. Shell V193 tidak disuntikkan ke markup internal Home Guru.
5. Hanya satu bottom navigation milik shell luar yang terlihat.

Pada `pendidikan/kpi-guru.html` dan mirror `/docs`, kelas visual Manager `manager-edu-v194` kini hanya aktif apabila role aktif bukan Guru. Ini menghilangkan interferensi CSS Manager terhadap tampilan KPI Guru tanpa menghapus fitur Manager yang lebih baru.

## Mapping Bottom Navigation Guru

| Label | Target yang dipakai |
|---|---|
| Jadwal | Jadwal Guru pada Home Guru / `openScheduleModal()` |
| KPI | `menu-kpi-guru` → `pendidikan/kpi-guru.html` |
| Beranda | `menu-home` → `home-guru.html` |
| Pesan | `menu-chat` → fitur pesan yang sudah ada |
| Lainnya | `utility-menu` → menu Guru yang sudah ada |

Urutan dan visual mengikuti baseline Guru, bukan implementasi global-shell V193.

## Firebase dan Data

Tidak ada konfigurasi Firebase, database rules, data produksi, path baca/tulis, jadwal, alokasi guru, kelas, kelompok, atau master data yang diubah dalam restorasi ini. Tidak diperlukan adaptasi path data karena binding Guru pada baseline masih cocok dengan sumber kanonis saat ini.

Kasus jadwal khusus tetap dibaca dari sumber yang berjalan saat ini, termasuk Al-Qur'an, Bahasa Arab, kelas gabungan, Tahsin/Tahfiz, dan pemetaan kelas/kelompok. Restorasi ini tidak menyederhanakan atau membentuk ulang data tersebut.

## Berkas yang Sengaja Tidak Dipulihkan

- keseluruhan `main-dashboard.html` dari `aa92614`
- konfigurasi Firebase dan database rules
- file data dan jadwal produksi
- backend/push/service worker
- modul Direktur, Supervisor, Manager, Pengasuhan, Konselor, Mentor, dan Naqib
- fitur Manager yang lebih baru pada halaman KPI bersama

Tujuannya adalah menghindari rollback perubahan baru yang tidak berhubungan dengan presentasi Guru.

## Kriteria Penerimaan Visual

- viewport uji utama 409 × 720
- layout mobile premium sesuai `aa92614`
- kartu tidak saling menindih atau terkompresi
- Menu Guru memiliki ukuran normal dan mudah dibaca
- tidak ada ruang kosong vertikal yang tidak dapat dijelaskan
- tipografi dan proporsi kartu stabil
- scrolling dan tinggi konten stabil
- tepat satu bottom navigation
- label bottom navigation: Jadwal, KPI, Beranda, Pesan, Lainnya

## Checklist Fungsional

- [x] Home Guru termuat
- [x] Jadwal Guru dapat dibuka dari bottom navigation
- [x] KPI Guru dapat dibuka dari bottom navigation
- [x] Beranda kembali ke Home Guru
- [x] Menu Guru merender delapan kartu utama dengan ukuran normal
- [x] Presensi Santri / Absensi Pembelajaran tetap tersedia
- [x] Materi Pembelajaran dan Kalender/Target Materi tetap tersedia
- [x] Nilai Ujian tetap tersedia
- [x] Tindak Lanjut Akademik tetap tersedia
- [x] Al-Qur'an, Bahasa Arab, Tahsin/Tahfiz, dan pilihan kelas/kelompok tidak diubah
- [x] Tidak ada perubahan Firebase/data path dari restorasi ini
- [x] Root dan mirror `/docs` sinkron untuk berkas yang disentuh

## Aturan Perubahan Berikutnya

Setiap perubahan Guru di masa depan harus diminta secara eksplisit oleh pengguna, dibuat seminimal mungkin, diuji terhadap baseline ini, serta tidak boleh mengubah schema/path Firebase secara diam-diam.
