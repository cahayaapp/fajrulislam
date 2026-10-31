# PENERAPAN PATCH HEMAT BANDWIDTH CAHAYA APP

Patch ini **hanya mengubah beranda Naqib, beranda Wali, Buku Konseling, dan mirror `docs/`**. Tidak menyentuh Firebase production, basis data, autentikasi, struktur nilai, atau rules.

## Isi paket
- `home.html` + `docs/home.html`
- `wali/dashboard/beranda.html` + `docs/wali/dashboard/beranda.html`
- `js/counselor-simplified-v3.js` + `docs/js/counselor-simplified-v3.js`
- `konselor/workspace-v3.html` + `docs/konselor/workspace-v3.html`
- `css/counselor-simplified-v3.css` + `docs/css/counselor-simplified-v3.css`
- `tests/bandwidth-optimizations.cjs` dan `tests/counselor-workspace-bootstrap-v3.cjs`
- `Laporan_Audit_Firebase_CAHAYA_APP_2026-10-31.md`

## Penggunaan
1. Backup versi proyek Anda. Ekstrak ZIP ini di direktori akar proyek sehingga path di atas sama.
2. Telaah perubahan dan pastikan `docs/` ikut dipublikasikan apabila deployment menggunakan `docs/`.
3. Jalankan `node --test tests/bandwidth-optimizations.cjs tests/counselor-workspace-bootstrap-v3.cjs`.
4. Tes manual peran Wali, Naqib, dan Konselor sebelum deploy produksi.
5. Amati Firebase Downloads. **Tidak ada jaminan kuota <10 GB sebelum data nyata diukur.**

**Peringatan keamanan:** File rules pada ZIP asal membuka read/write di root. Periksa aturan produksi dan rancang pengetatan teruji secara terpisah. Jangan melakukan `firebase deploy --only database` tanpa audit rules.
