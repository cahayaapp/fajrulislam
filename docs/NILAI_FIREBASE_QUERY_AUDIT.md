# Audit Query Firebase — Input Nilai Ujian Guru

Tanggal audit: 17 September 2026  
Ruang lingkup: `guru/inputNilaiUjian.html` Phase 3  
Aturan: audit ini tidak mengubah Firebase Rules, schema, ataupun path produksi.

## Ringkasan

Alur utama sudah memakai indeks sesi yang selektif. Query `orderByChild("periode_ujian")` hanya dijalankan sebagai fallback kompatibilitas untuk record lama ketika indeks sesi baru dan lama sama-sama kosong. Tidak ada listener realtime per santri dan ringkasan, pencarian, dirty state, serta total nilai dihitung dari data yang sudah berada di memori.

## Read saat halaman Input Nilai dibuka

| Urutan | Sumber/path | Bentuk read | Tujuan |
|---|---|---|---|
| 1 | `../data/jadwal-pelajaran-awal-2026-2027.json` | File lokal/cache | Jadwal dan alokasi guru. Bukan Firebase. |
| 2 | `cahaya_app/master_akademik/kelas` | `get(ref(...))`, satu kali saat halaman dibuka | Memperbarui master kelas/santri lokal. |

Shell dilepas sebelum kedua sumber selesai. Kegagalan salah satu sumber tidak menampilkan full-page loader permanen.

## Read saat periode dipilih

Dengan parameter guru, jenis penilaian, mapel, kelas, tahun akademik, semester, jenis ujian, dan periode yang sedang aktif:

1. `cahaya_app/nilai_input_index/{sessionKeyV805}` — exact-path `get`, cache 10 menit.
2. Jika kosong: `cahaya_app/nilai_input_index/{legacySessionKey}` — exact-path `get`, cache 10 menit.
3. Jika keduanya kosong: fallback record lama pada:
   - `cahaya_app/nilai_ujian_bulanan` untuk ujian bulanan; atau
   - `cahaya_app/nilai_ujian` untuk selain bulanan.
4. Deteksi final: `cahaya_app/nilai_input_final/{sessionKeyV805}` — exact-path `get`, cache 10 menit. Deteksi juga memanfaatkan record roster yang sudah dimuat, tanpa read tambahan per santri.

Fallback memakai:

```js
query(
  ref(db, dbPath),
  orderByChild("periode_ujian"),
  equalTo(period),
  limitToLast(600)
)
```

Hasil fallback masih divalidasi client-side terhadap identitas sesi lengkap dan roster aktif. Cache fallback berlaku 15 menit. Tidak ada full-node read tanpa batas dalam kode ini.

## Draft restore dan final detection

- Draft dipulihkan dari `nilai_input_index/{sessionKey}`; record utama tetap berada pada path nilai yang sudah ada.
- Final dideteksi dari marker nyata `nilai_input_final/{sessionKey}` yang harus cocok dengan identitas sesi, atau dari seluruh record roster yang berstatus `FINAL`.
- Status final tidak ditentukan oleh modal, toast, atau state lokal sementara.
- Membuka periode tidak membuat record baru dan tidak menulis ke Firebase.

## Duplicate read dan cache

- Tidak ditemukan listener realtime per santri.
- Tidak ada read baru untuk empat kartu ringkasan, pencarian santri, total berbobot, label tombol, atau dirty state.
- Urutan indeks V805 → indeks legacy → fallback bukan pembacaan duplikat paralel; tiap tahap hanya berjalan bila tahap sebelumnya kosong.
- Berpindah kembali ke sesi/periode yang sama dalam TTL menggunakan cache exact-path/fallback.
- Setelah draft/final berhasil, cache indeks diperbarui dari data lokal sehingga halaman tidak perlu mengunduh ulang seluruh histori.

## Akar warning `.indexOn: "periode_ujian"`

Warning berasal tepat dari query fallback `orderByChild("periode_ujian")` terhadap `cahaya_app/nilai_ujian_bulanan` (dan secara potensial `cahaya_app/nilai_ujian`). Query tersebut masih diperlukan untuk kompatibilitas record lama yang belum memiliki `nilai_input_index`.

Repository sudah memiliki deklarasi index yang benar pada:

- `firebase-rtdb-rules-cahaya-app-v20.json`
- `database-indexes-bandwidth-snippet.json`
- mirror keduanya di `/docs`

Karena warning masih muncul, kemungkinan terbesar adalah rules produksi belum memakai/ belum menggabungkan konfigurasi tersebut. Ini merupakan inferensi dari kode dan file rules lokal; status rules yang sedang terpasang di Firebase tidak diubah atau dibaca dalam task ini.

## Rekomendasi rules (memerlukan persetujuan terpisah)

Pastikan rules produksi mengandung index berikut, dengan cara **menggabungkan** ke rules aktif—jangan mengganti rules produksi secara buta:

```json
{
  "rules": {
    "cahaya_app": {
      "nilai_ujian_bulanan": {
        ".indexOn": ["periode_ujian"]
      },
      "nilai_ujian": {
        ".indexOn": ["periode_ujian"]
      }
    }
  }
}
```

File lokal yang ada menyertakan beberapa index tambahan (`tanggal_ujian`, `jenis_ujian`, `tahun_akademik`, `guru_penguji`, dan `mata_pelajaran`) dan dapat dipakai sebagai acuan merge. **Tidak ada perubahan Firebase Rules pada Phase 3 ini.**

## Risiko dan tindak lanjut

- Maksimum 600 record pada fallback membatasi bandwidth, tetapi record legacy yang sangat lama dapat tidak ditemukan bila satu periode berisi lebih dari batas itu. Indeks sesi tetap solusi utama.
- Setelah rules produksi diverifikasi, warning seharusnya hilang untuk fallback `periode_ujian`.
- Migrasi backfill indeks sesi dapat dipertimbangkan terpisah agar fallback legacy makin jarang, tetapi tidak diperlukan untuk UI Phase 3 dan tidak boleh dilakukan tanpa persetujuan.
