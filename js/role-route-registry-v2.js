// Exact route inventory. Unknown pages fail closed for V2; no prefix grants.
(function(root){'use strict';const routes={
  "panduan-role-v2.html": {"menus":["menu-panduan-kerja"],"policy":"internal-utility"},
  "utilitas-role-v2.html": {"menus":["menu-kpi-role","menu-jadwal-role"],"policy":"internal-utility"},
  "pesan.html": {"menus":["menu-chat"],"policy":"internal-utility"},
  "home.html": {
    "menus": [
      "menu-home"
    ],
    "policy": "legacy-home"
  },
  "kalender.html": {
    "menus": [
      "menu-kalender-pendidikan"
    ],
    "policy": "scoped"
  },
  "pimpinan/dashboard-pimpinan.html": {
    "menus": [
      "menu-dashboard-pimpinan"
    ],
    "policy": "scoped"
  },
  "pimpinan/keputusan-direktur.html": {
    "menus": [
      "menu-keputusan-direktur"
    ],
    "policy": "scoped"
  },
  "pimpinan/direktur-v2.html": {
    "menus": ["menu-direktur-v2", "menu-kpi-direktur", "menu-jadwal-direktur"],
    "policy": "director-v2"
  },
  "pimpinan/perizinan-santri.html": {
    "menus": [
      "menu-perizinan-santri"
    ],
    "policy": "legacy-permit-decision-disabled"
  },
  "pimpinan/rekap-kepala-sekolah.html": {
    "menus": [
      "menu-rekap-kepala-sekolah"
    ],
    "policy": "scoped"
  },
  "manajer/kontrol-pendidikan.html": {
    "menus": [
      "menu-kontrol-pendidikan"
    ],
    "policy": "scoped"
  },
  "home-manajer-pendidikan.html": {
    "menus": ["menu-home"],
    "policy": "manager-area-home"
  },
  "home-manajer-pembinaan-karakter.html": {
    "menus": ["menu-home"],
    "policy": "manager-area-home"
  },
  "home-supervisor-v2.html": {
    "menus": ["menu-home"],
    "policy": "supervisor-v2"
  },
  "supervisor/workspace-v2.html": {
    "menus": ["menu-supervisor-v2", "menu-supervisor-schedule", "menu-kpi-supervisor"],
    "policy": "supervisor-v2"
  },
  "supervisor/review-izin-santri.html": {
    "menus": ["menu-supervisor-v2"],
    "policy": "supervisor-layanan-v2"
  },
  "manajer/pembinaan-karakter-v2.html": {
    "menus": ["menu-kontrol-pembinaan", "menu-kpi-manajer", "menu-panduan-kerja"],
    "policy": "manager-character-v2"
  },
  "manajer/pendidikan-v2.html": {
    "menus": ["menu-kontrol-pendidikan", "menu-materi-pembelajaran", "menu-nilai-manajer", "menu-guru-pondok", "menu-observasi-pembelajaran", "menu-riwayat-temuan", "menu-pembinaan-guru", "menu-tindak-akademik", "menu-kpi-manajer", "menu-panduan-kerja"],
    "policy": "manager-education-v2"
  },
  "manajer/jadwal-pendidikan.html": {
    "menus": [
      "menu-jadwal-manajer"
    ],
    "policy": "scoped"
  },
  "manajer/pembinaan-guru.html": {
    "menus": [
      "menu-pembinaan-guru"
    ],
    "policy": "scoped"
  },
  "manajer/materi-pembelajaran.html": {
    "menus": [
      "menu-materi-pembelajaran"
    ],
    "policy": "scoped"
  },
  "manajer/observasi-pendidikan.html": {
    "menus": [
      "menu-observasi-pembelajaran"
    ],
    "policy": "scoped"
  },
  "pendidikan/absensi-ibadah-guru.html": {
    "menus": [
      "menu-absensi-ibadah-guru"
    ],
    "policy": "guru-mukim-v2"
  },
  "supervisor/review-pendidikan.html": {
    "menus": [
      "menu-review-pendidikan"
    ],
    "policy": "scoped"
  },
  "supervisor/laporan-akademik.html": {
    "menus": [
      "menu-kontrol-publikasi-rapor"
    ],
    "policy": "scoped"
  },
  "pimpinan/dashboard-pendidikan.html": {
    "menus": [
      "menu-dashboard-pendidikan"
    ],
    "policy": "scoped"
  },
  "pendidikan/tindak-lanjut-akademik.html": {
    "menus": [
      "menu-tindak-akademik"
    ],
    "policy": "scoped"
  },
  "manajer/kontrol-pembinaan.html": {
    "menus": [
      "menu-kontrol-pembinaan"
    ],
    "policy": "scoped"
  },
  "supervisor/review-pembinaan.html": {
    "menus": [
      "menu-review-pembinaan"
    ],
    "policy": "scoped"
  },
  "pembinaan/mentoring-individu.html": {
    "menus": [],
    "policy": "legacy-mentor-disabled"
  },
  "pembinaan/mentoring-usrah.html": {
    "menus": [],
    "policy": "legacy-mentor-disabled"
  },
  "home-mentor-usrah.html": {
    "menus": ["menu-home"],
    "policy": "home",
    "roles": ["MENTOR_USRAH"]
  },
  "pembinaan/mentor-usrah-v2.html": {
    "menus": ["menu-mentoring-individu", "menu-mentoring-usrah"],
    "policy": "mentor-usrah-v2"
  },
  "home-dapur.html": {
    "menus": ["menu-home"],
    "policy": "home",
    "roles": ["DAPUR"]
  },
  "dapur/app.html": {
    "menus": ["menu-dashboard-operasional"],
    "policy": "dapur-v2"
  },
  "dapur/menu-bahan-v2.html": {
    "menus": ["menu-dashboard-operasional", "menu-dapur-stock", "menu-dapur-menu", "menu-dapur-received", "menu-dapur-usage"],
    "policy": "dapur-material-v2"
  },
  "dapur/panduan.html": {
    "menus": ["menu-panduan-kerja"],
    "policy": "dapur-v2"
  },
  "home-media.html": {
    "menus": ["menu-home"],
    "policy": "home",
    "roles": ["MEDIA"]
  },
  "media/target-capaian.html": {
    "menus": ["menu-dashboard-operasional"],
    "policy": "media-v2"
  },
  "media/operasional.html": {
    "menus": ["menu-gallery-dokumentasi", "menu-manajemen-konten"],
    "policy": "media-operations-v2"
  },
  "pembinaan/pantau-pendampingan.html": {
    "menus": [
      "menu-pantau-pendampingan"
    ],
    "policy": "scoped"
  },
  "pimpinan/dashboard-dua-divisi.html": {
    "menus": [
      "menu-dashboard-dua-divisi"
    ],
    "policy": "scoped"
  },
  "supervisor/command-center.html": {
    "menus": [
      "menu-supervisi-terpadu"
    ],
    "policy": "scoped"
  },
  "supervisor/raport-bulanan.html": {
    "menus": [
      "menu-raport-bulanan"
    ],
    "policy": "scoped"
  },
  "supervisor/monitoringabsenguru.html": {
    "menus": [
      "menu-monitoring-absen-guru"
    ],
    "policy": "scoped"
  },
  "supervisor/raport-sdm.html": {
    "menus": [
      "menu-raport-sdm"
    ],
    "policy": "scoped"
  },
  "supervisor/tindak-lanjut-sdm.html": {
    "menus": [
      "menu-tindak-lanjut-sdm"
    ],
    "policy": "scoped"
  },
  "PKL/jurnal-pkl.html": {
    "menus": [
      "menu-jurnal-pkl"
    ],
    "policy": "scoped"
  },
  "layanan/buku-izin.html": {
    "menus": [
      "menu-buku-izin",
      "menu-perizinan-santri"
    ],
    "policy": "scoped"
  },
  "PKL/buku-tamu.html": {
    "menus": [
      "menu-buku-tamu"
    ],
    "policy": "scoped"
  },
  "PKL/penitipan-barang.html": {
    "menus": [
      "menu-penitipan-barang"
    ],
    "policy": "scoped"
  },
  "sarpras/jurnal.html": {
    "menus": [
      "menu-jurnal-sarpras"
    ],
    "policy": "scoped"
  },
  "sarpras/checklist.html": {
    "menus": [
      "menu-checklist-sarpras"
    ],
    "policy": "scoped"
  },
  "sarpras/tindak-lanjut.html": {
    "menus": [
      "menu-tindak-sarpras"
    ],
    "policy": "scoped"
  },
  "kesehatan/jurnal.html": {
    "menus": [
      "menu-jurnal-kesehatan"
    ],
    "policy": "scoped"
  },
  "kesehatan/pemeriksaan.html": {
    "menus": [
      "menu-pemeriksaan-kesehatan"
    ],
    "policy": "scoped"
  },
  "kesehatan/perizinan-uks.html": {
    "menus": [
      "menu-perizinan-uks"
    ],
    "policy": "scoped"
  },
  "kesehatan/stokobat.html": {
    "menus": [
      "menu-stok-obat"
    ],
    "policy": "scoped"
  },
  "keuangan/pusat-keuangan.html": {
    "menus": [
      "menu-pusat-keuangan"
    ],
    "policy": "unreviewed"
  },
  "keuangan/pengaturan-modul.html": {
    "menus": [
      "menu-pengaturan-keuangan"
    ],
    "policy": "unreviewed"
  },
  "keuangan/kasir.html": {
    "menus": [
      "menu-kasir"
    ],
    "policy": "unreviewed"
  },
  "observer/pembelajaran.html": {
    "menus": [
      "menu-observer-pembelajaran"
    ],
    "policy": "unreviewed"
  },
  "observer/pengasuhan.html": {
    "menus": [
      "menu-observer-pengasuhan"
    ],
    "policy": "unreviewed"
  },
  "observer/kebersihan.html": {
    "menus": [
      "menu-observer-kebersihan"
    ],
    "policy": "unreviewed"
  },
  "observer/sarpras.html": {
    "menus": [
      "menu-observer-sarpras"
    ],
    "policy": "unreviewed"
  },
  "observer/dapur.html": {
    "menus": [
      "menu-observer-dapur"
    ],
    "policy": "unreviewed"
  },
  "observer/uks.html": {
    "menus": [
      "menu-observer-uks"
    ],
    "policy": "unreviewed"
  },
  "home-guru.html": {
    "menus": [
      "menu-home",
      "menu-absen-guru"
    ],
    "policy": "home",
    "roles": [
      "GURU_PONDOK"
    ]
  },
  "guru/absensiPembelajaran.html": {
    "menus": [
      "menu-absen-kbm"
    ],
    "policy": "teacher"
  },
  "guru/gurumenulis.html": {
    "menus": [
      "menu-guru-menulis"
    ],
    "policy": "teacher"
  },
  "guru/capaian-materi.html": {
    "menus": [
      "menu-kalender-materi"
    ],
    "policy": "teacher"
  },
  "pendidikan/kpi-guru.html": {
    "menus": [
      "menu-kpi-guru"
    ],
    "policy": "teacher"
  },
  "pendidikan/manajemen-kelas.html": {
    "menus": [
      "menu-manajemen-kelas"
    ],
    "policy": "scoped"
  },
  "pendidikan/penempatan-tahsin.html": {
    "menus": ["menu-penempatan-tahsin"],
    "policy": "tahsin-placement-v2"
  },
  "guru/inputSetoranTahfiz.html": {
    "menus": [
      "menu-tahfiz"
    ],
    "policy": "teacher"
  },
  "guru/lapor-pelanggaran.html": {
    "menus": [
      "menu-laporan-murojaah"
    ],
    "policy": "naqib-report"
  },
  "guru/inputNilaiUjian.html": {
    "menus": [
      "menu-nilai"
    ],
    "policy": "teacher"
  },
  "guru/tindak-lanjut.html": {
    "menus": [
      "menu-tindak-lanjut-guru"
    ],
    "policy": "teacher"
  },
  "naqib/absensi.html": {
    "menus": [
      "menu-absen-asrama",
      "menu-riwayat-absensi"
    ],
    "policy": "program-attendance"
  },
  "naqib/program-hari-ini.html": {
    "menus": [
      "menu-dashboard-operasional", "menu-jurnal-piket"
    ],
    "policy": "naqib-program-today"
  },
  "naqib/kedisiplinan.html": {
    "menus": [
      "menu-disiplin"
    ],
    "policy": "scoped"
  },
  "naqib/gamifikasi.html": {
    "menus": [
      "menu-gamifikasi"
    ],
    "policy": "naqib-initiative"
  },
  "naqib/skor-kedisiplinan-usrah.html": {
    "menus": [
      "menu-skor-usrah"
    ],
    "policy": "naqib-discipline"
  },
  "naqib/kpi.html": {
    "menus": [
      "menu-kpi-naqib"
    ],
    "policy": "naqib-kpi"
  },
  "naqib/jadwalpiket.html": {
    "menus": [
      "menu-jadwal-piket"
    ],
    "policy": "scoped"
  },
  "naqib/laporan-pelaksanaan.html": {
    "menus": [
      "menu-jurnal-piket",
      "menu-riwayat-laporan"
    ],
    "policy": "naqib-journal"
  },
  "naqib/naqib-teladan.html": {
    "menus": [
      "menu-naqib-teladan"
    ],
    "policy": "naqib-teladan"
  },
  "naqib/jurnal-piket.html": {
    "menus": [
      "menu-jadwal-piket"
    ],
    "policy": "scoped"
  },
  "naqib/edit-usrah.html": {
    "menus": [
      "menu-usrah"
    ],
    "policy": "scoped"
  },
  "pusat-asesmen/naqib.html": {
    "menus": [
      "menu-asesmen-naqib"
    ],
    "policy": "naqib-self-assessment"
  },
  "pusat-asesmen/guru.html": {
    "menus": [
      "menu-asesmen-guru"
    ],
    "policy": "teacher"
  },
  "pusat-asesmen/santri.html": {
    "menus": [
      "menu-asesmen-santri"
    ],
    "policy": "naqib-assessment"
  },
  "pembinaan/pantau-asesmen.html": {
    "menus": [
      "menu-pantau-asesmen"
    ],
    "policy": "scoped"
  },
  "admin/admin_komentar.html": {
    "menus": [
      "menu-komentar"
    ],
    "policy": "unreviewed"
  },
  "admin/admin_media.html": {
    "menus": [
      "menu-media"
    ],
    "policy": "media-url-v2"
  },
  "admin/database.html": {
    "menus": [
      "menu-db-master"
    ],
    "policy": "unreviewed"
  },
  "admin/atur-jadwal.html": {
    "menus": [
      "menu-jadwal"
    ],
    "policy": "unreviewed"
  },
  "admin/qrkelas.html": {
    "menus": [
      "menu-qr-kelas"
    ],
    "policy": "unreviewed"
  },
  "admin/users.html": {
    "menus": [
      "menu-users"
    ],
    "policy": "unreviewed"
  },
  "admin/settings.html": {
    "menus": [
      "menu-koreksi"
    ],
    "policy": "unreviewed"
  },
  "profil.html": {
    "menus": [
      "menu-profil"
    ],
    "policy": "scoped"
  },
  "main-dashboard.html": {
    "menus": [],
    "policy": "shell"
  },
  "home-direktur.html": {
    "menus": [
      "menu-home"
    ],
    "policy": "home",
    "roles": [
      "DIREKTUR"
    ]
  },
  "home-naqib.html": {
    "menus": [
      "menu-home"
    ],
    "policy": "home",
    "roles": [
      "NAQIB",
      "NAQIBAH"
    ]
  },
  "home-konselor.html": {
    "menus": ["menu-home"],
    "policy": "home",
    "roles": ["KONSELOR"]
  },
  "konselor/cases-v2.html": {
    "menus": ["menu-kasus-masuk","menu-kasus-aktif","menu-konseling-konselor","menu-eskalasi-konselor","menu-riwayat-kasus"],
    "policy": "counselor-v2"
  },
  "konselor/kpi.html": {
    "menus": ["menu-kpi-konselor"],
    "policy": "counselor-v2"
  },
  "konselor/self-asesmen.html": {
    "menus": ["menu-self-konselor"],
    "policy": "counselor-v2"
  },
  "konselor/higher-response.html": {
    "menus": ["menu-arahan-kasus"],
    "policy": "higher-case-response-v2"
  },
  "role-workspace.html": {
    "menus": [
      "menu-home",
      "menu-panduan-kerja",
      "menu-dashboard-operasional"
    ],
    "policy": "workspace"
  },
  "konselor/daftar-kasus-baru.html": {
    "menus": [
      "menu-antrean-kasus"
    ],
    "policy": "counselor-queue-pending"
  },
  "pimpinan/dashboard-divisi.html": {
    "menus": [
      "menu-dashboard-operasional"
    ],
    "policy": "division"
  },
  "dashboard-operasional/semua-divisi.html": {
    "menus": [
      "menu-dashboard-operasional"
    ],
    "policy": "strategic"
  },
  "dashboard-operasional/divisi.html": {
    "menus": [
      "menu-dashboard-operasional"
    ],
    "policy": "division"
  },
  "wali/dashboard/index.html": {
    "menus": ["menu-home"],
    "policy": "wali"
  },
  "wali/dashboard/beranda.html": {
    "menus": [],
    "policy": "wali"
  },
  "wali/dashboard/akademik.html": {
    "menus": [],
    "policy": "wali"
  },
  "wali/dashboard/karakter.html": {
    "menus": [],
    "policy": "wali"
  },
  "wali/dashboard/pembinaan.html": {
    "menus": [],
    "policy": "wali"
  },
  "wali/dashboard/keuangan.html": {
    "menus": [],
    "policy": "wali"
  },
  "wali/dashboard/perizinan.html": {
    "menus": [],
    "policy": "wali"
  },
  "wali/dashboard/profil.html": {
    "menus": [],
    "policy": "wali"
  },
  "wali/dashboard/riwayat-kesehatan.html": {
    "menus": [],
    "policy": "wali"
  },
  "wali/dashboard/raport-bulanan.html": {
    "menus": [],
    "policy": "wali"
  },
  "wali/dashboard/informasi-penting.html": {
    "menus": [],
    "policy": "wali"
  },
  "wali/dashboard/mentoring-pekanan.html": {
    "menus": [],
    "policy": "wali"
  }
};
Object.values(routes).forEach(v=>{Object.values(v).forEach(x=>{if(Array.isArray(x))Object.freeze(x)});Object.freeze(v)});
const api=Object.freeze(routes);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CahayaRoleRoutesV2=api;
})(typeof window!=='undefined'?window:globalThis);
