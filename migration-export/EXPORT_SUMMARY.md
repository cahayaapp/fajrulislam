# Legacy Export Summary

## Hasil ekspor

| File | Record |
|---|---:|
| `teachers.json` | 25 |
| `students.json` | 122 |
| `classes.json` | 18 |
| `subjects.json` | 41 |
| `teaching-assignments.json` | 186 |
| `schedules.json` | 281 |
| `academic-calendar.json` | 293 |
| `material-targets.json` | 0 |

## Sumber utama

- Master guru, santri, kelas, dan mapel: `config/master-data.js`
- Jadwal: `data/jadwal-pelajaran-awal-2026-2027.json`
- Kalender akademik: `data/kalender-pendidikan-2026-2027.json`
- Penugasan: diturunkan dari jadwal
- Target materi: unresolved; hanya tersedia sebagai data runtime Firebase

## Mapping unresolved

- 2 kode guru jadwal tidak ada di master: `ALAMANDA`, `PEMBINA_EKSKUL`.
- 6 nama mapel jadwal tidak ada di daftar master.
- 3 kelompok nama santri sama setelah normalisasi tanda baca/spasi.
- 7 alias historis ditemukan dalam mapping PKBM.
- 4 jadwal hanya terdapat dalam `admin/atur-jadwal.html`, tidak dalam snapshot JSON.
- Target materi aktual tidak tersedia di repository.

## Berkas paket

- `LEGACY_DATA_INVENTORY.md`
- `DATA_QUALITY_REPORT.md`
- `EXPORT_SUMMARY.md`
- `teachers.json`
- `students.json`
- `classes.json`
- `subjects.json`
- `teaching-assignments.json`
- `schedules.json`
- `academic-calendar.json`
- `material-targets.json`
- `export-legacy-data.mjs` (generator reproducible; hanya membaca sumber lokal dan menulis ke folder ini)

Tidak ada Firebase write/read yang dilakukan. Tidak ada file produksi yang diubah, dihapus, atau diganti nama.
