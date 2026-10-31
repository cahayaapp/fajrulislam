CAHAYA APP v96 — Instant Dashboard & Daily Index
Tanggal: 2 September 2026

Fokus:
- Dashboard Direktur tampil segera dari cache lokal bila tersedia.
- Angka diperbarui progresif per kelompok data; tidak menunggu seluruh query selesai.
- Menghapus query tanggal besar dari startup Harian.
- Menambah daily index: cahaya_app/dashboard_index/YYYY-MM-DD.
- Input Absensi Pembelajaran, Absensi Program Naqib, dan Setoran Tahfiz melakukan dual-write ke daily index ringkas.
- Absensi Guru tetap memakai struktur harian yang sudah efisien: absensi_guru/YYYY-MM-DD.
- Data lama hari berjalan dibaca dengan limitToLast terbatas, difilter lokal, lalu dibackfill ke daily index.
- Tahfiz dimuat setelah data utama / saat browser idle.
- Pekanan/Bulanan membaca daily index dengan orderByKey; fallback histori hanya ketika indeks lama belum tersedia.

Tidak mengubah alur kerja pengguna dan tidak menghapus data lama.
