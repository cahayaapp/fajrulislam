# CAHAYA Role Menu Manifest

Audit: 21 September 2026, internal release v266. No database migration, workflow, scoring or Wali changes.

## Authoritative resolution

Staff shell uses js/role-menu-v2.js (local menu model), role-system-v2.js (canonical permission/assignment), role-route-registry-v2.js (route registration), and role-navigation-v2.js (direct access guard). The same model feeds desktop sidebar, mobile Lainnya and bottom navigation. Home shortcuts use the same permission and route resolver. Owned roles are never unioned; only activeRole + activeAssignment determines menus.

Legacy allMenuHTML, DEFAULT_ROLE_MENUS, CORE_V83_ROLE_MENUS and Firestore settings/role_menus remain for legacy accounts only; they do not replace canonical staff menus. Menu building performs zero operational reads.

PASS means registered local route with accepted fixture guard, not a claim of live Firebase round-trip success. CONDITIONAL means assignment-dependent. BLOCKED means denied and not rendered. REMOVED means obsolete navigation removed, not historical data deleted.

## Per-role menu registry

Each table uses the profile assignment shown; narrower assignments can hide additional operational routes. Internal bottom order: Jadwal, KPI, Beranda, Pesan, Lainnya. Beranda uses the active-role Home; Lainnya opens the same menu drawer. Every tested internal assignment has all five destinations enabled. Wali is excluded and its sections below are unchanged.

Required internal utilities are enforced centrally by `js/role-menu-v2.js`, not legacy `settings/role_menus`: KPI, Pesan, Profil, Panduan & Manual. Existing KPI engines are retained. Where no finalized KPI engine exists, `utilitas-role-v2.html?view=kpi` provides links to authorized operational evidence and displays **—**, not a score or fabricated completeness count. Its schedule view reuses the local role work rhythm and explicitly states that no specialized session schedule is connected.

`panduan-role-v2.html` uses the local registry `js/role-guide-content-v2.js`: 15 operational sections and 15 manual sections for the active role/assignment, including contextual feature instructions, search and browser print. It performs zero operational reads.

Pesan sidebar and bottom actions open the existing staff chat modal in `main-dashboard.html`, powered by `js/pengurus-whatsapp-chat.js`. `pesan.html` is only a direct-link launcher, not another messaging engine. Existing `pesan_global`, `pesan_meta`, `pesan_inbox`, and `pesan_dibaca` contracts are preserved. Contact permission and broadcast authority remain unchanged. Profile remains `profil.html`.

### GURU_PONDOK

Assignment: `{"unit":"","area":"","divisionIds":[],"usrahIds":[],"studentIds":[],"programDomain":"KEPONDOKAN","supervisedRoles":[],"managedRoles":[],"level":""}`.

Home: `home-guru.html?v=201`.

Jadwal: `menu-absen-guru`; KPI: `menu-kpi-guru`.

| menuId | Label | Group | Route | Guard permission | Status / reason |
|---|---|---|---|---|---|
| menu-home | Beranda | Utama | home-guru.html?v=201 | menu-home | PASS |
| menu-absen-guru | Jadwal & Kehadiran Guru | Operasional | home-guru.html?openSchedule=1 | menu-absen-guru | PASS |
| menu-absen-kbm | Absensi Pembelajaran | Operasional | guru/absensiPembelajaran.html | menu-absen-kbm | PASS |
| menu-kalender-materi | Materi Pembelajaran | Operasional | guru/capaian-materi.html | menu-kalender-materi | PASS |
| menu-nilai | Nilai Ujian | Operasional | guru/inputNilaiUjian.html | menu-nilai | PASS |
| menu-tahfiz | Tahsin / Tahfiz | Operasional | guru/inputSetoranTahfiz.html | menu-tahfiz | PASS |
| menu-tindak-lanjut-guru | Tindak Lanjut Akademik | Operasional | guru/tindak-lanjut.html | menu-tindak-lanjut-guru | PASS |
| menu-laporan-murojaah | Lapor Kasus / Pelanggaran | Operasional | guru/lapor-pelanggaran.html | menu-laporan-murojaah | PASS |
| menu-guru-menulis | Guru Menulis | Operasional | guru/gurumenulis.html | menu-guru-menulis | PASS |
| menu-asesmen-guru | Asesmen Guru | Operasional | pusat-asesmen/guru.html | menu-asesmen-guru | PASS |
| menu-kalender-pendidikan | Kalender Pendidikan | Operasional | kalender.html?mode=view | menu-kalender-pendidikan | BLOCKED / ASSIGNMENT_ADAPTER_REQUIRED |
| menu-kpi-guru | KPI Guru | Evaluasi | pendidikan/kpi-guru.html | menu-kpi-guru | PASS |
| menu-panduan-kerja | Panduan & Manual | Lainnya | panduan-role-v2.html | menu-panduan-kerja | PASS |
| menu-profil | Profil | Lainnya | profil.html | menu-profil | PASS |
| menu-chat | Pesan | Lainnya | pesan.html | menu-chat | PASS / same staff chat engine |

### GURU_PKBM

Assignment: `{"unit":"","area":"","divisionIds":[],"usrahIds":[],"studentIds":[],"programDomain":"PKBM","supervisedRoles":[],"managedRoles":[],"level":""}`.

Home: `role-workspace.html?v=205`.

Jadwal: `menu-jadwal-role`; KPI: `menu-kpi-role`.

| menuId | Label | Group | Route | Guard permission | Status / reason |
|---|---|---|---|---|---|
| menu-home | Beranda | Utama | role-workspace.html?v=205 | menu-home | PASS |
| menu-kalender-pendidikan | Kalender Pendidikan PKBM | Operasional | kalender.html?mode=view | menu-kalender-pendidikan | BLOCKED / ASSIGNMENT_ADAPTER_REQUIRED |
| menu-panduan-kerja | Panduan & Manual | Lainnya | panduan-role-v2.html | menu-panduan-kerja | PASS |
| menu-profil | Profil | Lainnya | profil.html | menu-profil | PASS |
| menu-chat | Pesan | Lainnya | pesan.html | menu-chat | PASS / same staff chat engine |
| menu-kpi-role | KPI — Bukti Kerja | Evaluasi | utilitas-role-v2.html?view=kpi | menu-kpi-role | PASS |
| menu-jadwal-role | Jadwal & Ritme Kerja | Lainnya | utilitas-role-v2.html?view=schedule | menu-jadwal-role | PASS |

### NAQIB

Assignment: `{"unit":"PUTRA","area":"","divisionIds":[],"usrahIds":[],"studentIds":[],"programDomain":"","supervisedRoles":[],"managedRoles":[],"level":""}`.

Home: `home-naqib.html?v=210`.

Jadwal: `menu-dashboard-operasional`; KPI: `menu-kpi-naqib`.

| menuId | Label | Group | Route | Guard permission | Status / reason |
|---|---|---|---|---|---|
| menu-home | Beranda | Utama | home-naqib.html?v=210 | menu-home | PASS |
| menu-dashboard-operasional | Program Hari Ini | Operasional | naqib/program-hari-ini.html | menu-dashboard-operasional | PASS |
| menu-absen-asrama | Absensi Program | Operasional | naqib/absensi.html | menu-absen-asrama | PASS |
| menu-jurnal-piket | Laporan Pelaksanaan | Operasional | naqib/program-hari-ini.html?intent=report | menu-jurnal-piket | PASS |
| menu-gamifikasi | Catat Inisiatif Santri | Operasional | naqib/gamifikasi.html | menu-gamifikasi | PASS |
| menu-naqib-teladan | Naqib Teladan | Operasional | naqib/naqib-teladan.html | menu-naqib-teladan | PASS |
| menu-asesmen-santri | Asesmen CAHAYA Santri | Operasional | pusat-asesmen/santri.html | menu-asesmen-santri | PASS |
| menu-asesmen-naqib | Self Asesmen Naqib | Evaluasi | pusat-asesmen/naqib.html | menu-asesmen-naqib | PASS |
| menu-laporan-murojaah | Lapor Kasus / Pelanggaran | Operasional | guru/lapor-pelanggaran.html | menu-laporan-murojaah | PASS |
| menu-skor-usrah | Skor Kedisiplinan | Evaluasi | naqib/skor-kedisiplinan-usrah.html | menu-skor-usrah | PASS |
| menu-riwayat-laporan | Riwayat Laporan | Evaluasi | naqib/laporan-pelaksanaan.html?view=history | menu-riwayat-laporan | PASS |
| menu-kpi-naqib | KPI Naqib | Evaluasi | naqib/kpi.html | menu-kpi-naqib | PASS |
| menu-panduan-kerja | Panduan & Manual | Lainnya | panduan-role-v2.html | menu-panduan-kerja | PASS |
| menu-profil | Profil | Lainnya | profil.html | menu-profil | PASS |
| menu-chat | Pesan | Lainnya | pesan.html | menu-chat | PASS / same staff chat engine |

### NAQIBAH

Assignment: `{"unit":"PUTRI","area":"","divisionIds":[],"usrahIds":[],"studentIds":[],"programDomain":"","supervisedRoles":[],"managedRoles":[],"level":""}`.

Home: `home-naqib.html?v=210`.

Jadwal: `menu-dashboard-operasional`; KPI: `menu-kpi-naqib`.

| menuId | Label | Group | Route | Guard permission | Status / reason |
|---|---|---|---|---|---|
| menu-home | Beranda | Utama | home-naqib.html?v=210 | menu-home | PASS |
| menu-dashboard-operasional | Program Hari Ini | Operasional | naqib/program-hari-ini.html | menu-dashboard-operasional | PASS |
| menu-absen-asrama | Absensi Program | Operasional | naqib/absensi.html | menu-absen-asrama | PASS |
| menu-jurnal-piket | Laporan Pelaksanaan | Operasional | naqib/program-hari-ini.html?intent=report | menu-jurnal-piket | PASS |
| menu-gamifikasi | Catat Inisiatif Santri | Operasional | naqib/gamifikasi.html | menu-gamifikasi | PASS |
| menu-naqib-teladan | Naqib Teladan | Operasional | naqib/naqib-teladan.html | menu-naqib-teladan | PASS |
| menu-asesmen-santri | Asesmen CAHAYA Santri | Operasional | pusat-asesmen/santri.html | menu-asesmen-santri | PASS |
| menu-asesmen-naqib | Self Asesmen Naqib | Evaluasi | pusat-asesmen/naqib.html | menu-asesmen-naqib | PASS |
| menu-laporan-murojaah | Lapor Kasus / Pelanggaran | Operasional | guru/lapor-pelanggaran.html | menu-laporan-murojaah | PASS |
| menu-skor-usrah | Skor Kedisiplinan | Evaluasi | naqib/skor-kedisiplinan-usrah.html | menu-skor-usrah | PASS |
| menu-riwayat-laporan | Riwayat Laporan | Evaluasi | naqib/laporan-pelaksanaan.html?view=history | menu-riwayat-laporan | PASS |
| menu-kpi-naqib | KPI Naqib | Evaluasi | naqib/kpi.html | menu-kpi-naqib | PASS |
| menu-panduan-kerja | Panduan & Manual | Lainnya | panduan-role-v2.html | menu-panduan-kerja | PASS |
| menu-profil | Profil | Lainnya | profil.html | menu-profil | PASS |
| menu-chat | Pesan | Lainnya | pesan.html | menu-chat | PASS / same staff chat engine |

### KONSELOR

Assignment: `{"unit":"PUTRA","area":"","divisionIds":[],"usrahIds":[],"studentIds":[],"programDomain":"","supervisedRoles":[],"managedRoles":[],"level":"PEMULA"}`.

Home: `home-konselor.html?v=220`.

Jadwal: `menu-kasus-masuk`; KPI: `menu-kpi-konselor`.

| menuId | Label | Group | Route | Guard permission | Status / reason |
|---|---|---|---|---|---|
| menu-home | Beranda | Utama | home-konselor.html?v=220 | menu-home | PASS |
| menu-kasus-masuk | Kasus Masuk | Operasional | konselor/cases-v2.html?view=incoming | menu-kasus-masuk | PASS |
| menu-kasus-aktif | Kasus Aktif | Operasional | konselor/cases-v2.html?view=active | menu-kasus-aktif | PASS |
| menu-konseling-konselor | Catat Konseling | Operasional | konselor/cases-v2.html?view=counseling | menu-konseling-konselor | PASS |
| menu-eskalasi-konselor | Perlu Eskalasi | Operasional | konselor/cases-v2.html?view=escalations | menu-eskalasi-konselor | PASS |
| menu-riwayat-kasus | Riwayat Kasus | Operasional | konselor/cases-v2.html?view=history | menu-riwayat-kasus | PASS |
| menu-self-konselor | Self Asesmen Konselor | Evaluasi | konselor/self-asesmen.html | menu-self-konselor | PASS |
| menu-kpi-konselor | KPI Konselor | Evaluasi | konselor/kpi.html | menu-kpi-konselor | PASS |
| menu-panduan-kerja | Panduan & Manual | Lainnya | panduan-role-v2.html | menu-panduan-kerja | PASS |
| menu-profil | Profil | Lainnya | profil.html | menu-profil | PASS |
| menu-chat | Pesan | Lainnya | pesan.html | menu-chat | PASS / same staff chat engine |
| menu-jadwal-role | Jadwal & Ritme Kerja | Lainnya | utilitas-role-v2.html?view=schedule | menu-jadwal-role | PASS |

### MENTOR_USRAH

Assignment: `{"unit":"","area":"","divisionIds":[],"usrahIds":["USRAH_3"],"studentIds":[],"programDomain":"","supervisedRoles":[],"managedRoles":[],"level":""}`.

Home: `home-mentor-usrah.html?v=224`.

Jadwal: `menu-jadwal-role`; KPI: `menu-kpi-role`.

| menuId | Label | Group | Route | Guard permission | Status / reason |
|---|---|---|---|---|---|
| menu-home | Beranda | Utama | home-mentor-usrah.html?v=224 | menu-home | PASS |
| menu-mentoring-individu | Form Mentoring | Operasional | pembinaan/mentor-usrah-v2.html?view=form | menu-mentoring-individu | PASS |
| menu-mentoring-usrah | Riwayat Mentoring | Operasional | pembinaan/mentor-usrah-v2.html?view=history | menu-mentoring-usrah | PASS |
| menu-panduan-kerja | Panduan & Manual | Lainnya | panduan-role-v2.html | menu-panduan-kerja | PASS |
| menu-profil | Profil | Lainnya | profil.html | menu-profil | PASS |
| menu-chat | Pesan | Lainnya | pesan.html | menu-chat | PASS / same staff chat engine |
| menu-kpi-role | KPI — Bukti Kerja | Evaluasi | utilitas-role-v2.html?view=kpi | menu-kpi-role | PASS |
| menu-jadwal-role | Jadwal & Ritme Kerja | Lainnya | utilitas-role-v2.html?view=schedule | menu-jadwal-role | PASS |

### MANAJER

Assignment: `{"unit":"PUTRA","area":"PENDIDIKAN","divisionIds":[],"usrahIds":[],"studentIds":[],"programDomain":"KEPONDOKAN","supervisedRoles":[],"managedRoles":["GURU_PONDOK"],"level":""}`.

Home: `home-manajer-pendidikan.html?v=232`.

Jadwal: `menu-kontrol-pendidikan`; KPI: `menu-kpi-manajer`.

| menuId | Label | Group | Route | Guard permission | Status / reason |
|---|---|---|---|---|---|
| menu-home | Beranda | Utama | home-manajer-pendidikan.html?v=232 | menu-home | PASS |
| menu-kontrol-pendidikan | Kontrol Hari Ini | Manajemen | manajer/pendidikan-v2.html?view=control | menu-kontrol-pendidikan | PASS |
| menu-materi-pembelajaran | Capaian Materi | Manajemen | manajer/pendidikan-v2.html?view=material | menu-materi-pembelajaran | PASS |
| menu-tindak-akademik | Tindak Lanjut | Manajemen | manajer/pendidikan-v2.html?view=followup | menu-tindak-akademik | PASS |
| menu-absensi-ibadah-guru | Guru Mukim & Ibadah | Manajemen | pendidikan/absensi-ibadah-guru.html | menu-absensi-ibadah-guru | PASS |
| menu-guru-pondok | Guru Pondok | Manajemen | manajer/pendidikan-v2.html?view=teachers | menu-guru-pondok | PASS |
| menu-nilai-manajer | Nilai Ujian | Manajemen | manajer/pendidikan-v2.html?view=scores | menu-nilai-manajer | PASS |
| menu-observasi-pembelajaran | Observasi Pembelajaran | Manajemen | manajer/pendidikan-v2.html?view=observation | menu-observasi-pembelajaran | PASS |
| menu-riwayat-temuan | Riwayat Temuan | Manajemen | manajer/pendidikan-v2.html?view=findings | menu-riwayat-temuan | PASS |
| menu-pembinaan-guru | Pembinaan Guru | Manajemen | manajer/pendidikan-v2.html?view=coaching | menu-pembinaan-guru | PASS |
| menu-kpi-manajer | KPI Manajer Pendidikan | Evaluasi | manajer/pendidikan-v2.html?view=kpi | menu-kpi-manajer | PASS |
| menu-panduan-kerja | Panduan & Manual | Lainnya | panduan-role-v2.html | menu-panduan-kerja | PASS |
| menu-profil | Profil | Lainnya | profil.html | menu-profil | PASS |
| menu-chat | Pesan | Lainnya | pesan.html | menu-chat | PASS / same staff chat engine |

### SUPERVISOR

Assignment: `{"unit":"PUTRA","area":"","divisionIds":[],"usrahIds":[],"studentIds":[],"programDomain":"","supervisedRoles":["GURU_PONDOK","NAQIB","MENTOR_USRAH","KONSELOR","DAPUR","MEDIA","SARPRAS","KESEHATAN","LAYANAN_KEBERSIHAN"],"managedRoles":[],"level":""}`.

Home: `home-supervisor-v2.html?v=239`.

Jadwal: `menu-supervisor-schedule`; KPI: `menu-kpi-supervisor`.

| menuId | Label | Group | Route | Guard permission | Status / reason |
|---|---|---|---|---|---|
| menu-home | Beranda | Utama | home-supervisor-v2.html?v=239 | menu-home | PASS |
| menu-supervisor-v2 | Kondisi Divisi | Manajemen | supervisor/workspace-v2.html?view=divisions | menu-supervisor-v2 | PASS |
| menu-supervisor-v2--escalations | Eskalasi Masuk | Manajemen | supervisor/workspace-v2.html?view=escalations | menu-supervisor-v2 | PASS |
| menu-supervisor-v2--observation | Observasi Pembanding | Manajemen | supervisor/workspace-v2.html?view=observation | menu-supervisor-v2 | PASS |
| menu-supervisor-v2--followup | Tindak Lanjut Supervisor | Manajemen | supervisor/workspace-v2.html?view=followup | menu-supervisor-v2 | PASS |
| menu-supervisor-v2--people | Manajer & Personil | Manajemen | supervisor/workspace-v2.html?view=people | menu-supervisor-v2 | PASS |
| menu-supervisor-v2--recap | Rekap KPI Bawahan | Evaluasi | supervisor/workspace-v2.html?view=recap | menu-supervisor-v2 | PASS |
| menu-supervisor-v2--standards | Standar Kerja | Manajemen | supervisor/workspace-v2.html?view=standards | menu-supervisor-v2 | PASS |
| menu-supervisor-v2--coaching | Pembinaan | Manajemen | supervisor/workspace-v2.html?view=coaching | menu-supervisor-v2 | PASS |
| menu-supervisor-v2--history | Riwayat Eskalasi | Evaluasi | supervisor/workspace-v2.html?view=history | menu-supervisor-v2 | PASS |
| menu-supervisor-v2--review-izin | Review Izin Santri | Manajemen | supervisor/review-izin-santri.html | menu-supervisor-v2 | CONDITIONAL |
| menu-supervisor-schedule | Jadwal Supervisor | Utama | supervisor/workspace-v2.html?view=schedule | menu-supervisor-schedule | PASS |
| menu-kpi-supervisor | KPI Supervisor | Evaluasi | supervisor/workspace-v2.html?view=kpi | menu-kpi-supervisor | PASS |
| menu-panduan-kerja | Panduan & Manual | Lainnya | panduan-role-v2.html | menu-panduan-kerja | PASS |
| menu-profil | Profil | Lainnya | profil.html | menu-profil | PASS |
| menu-chat | Pesan | Lainnya | pesan.html | menu-chat | PASS / same staff chat engine |

### DIREKTUR

Assignment: `{"unit":"ALL","area":"","divisionIds":[],"usrahIds":[],"studentIds":[],"programDomain":"","supervisedRoles":[],"managedRoles":[],"level":""}`.

Home: `home-direktur.html?v=240`.

Jadwal: `menu-jadwal-direktur`; KPI: `menu-kpi-direktur`.

| menuId | Label | Group | Route | Guard permission | Status / reason |
|---|---|---|---|---|---|
| menu-home | Beranda | Utama | home-direktur.html?v=240 | menu-home | PASS |
| menu-direktur-v2 | Kondisi Pesantren | Manajemen | pimpinan/direktur-v2.html?view=condition | menu-direktur-v2 | PASS |
| menu-direktur-v2--inbox | Eskalasi & Keputusan | Manajemen | pimpinan/direktur-v2.html?view=inbox | menu-direktur-v2 | PASS |
| menu-direktur-v2--targets | Target & Arah | Manajemen | pimpinan/direktur-v2.html?view=targets | menu-direktur-v2 | PASS |
| menu-direktur-v2--supervisors | Supervisor | Manajemen | pimpinan/direktur-v2.html?view=supervisors | menu-direktur-v2 | PASS |
| menu-direktur-v2--systemic | Masalah Sistemik | Manajemen | pimpinan/direktur-v2.html?view=systemic | menu-direktur-v2 | PASS |
| menu-direktur-v2--recap | Rekap KPI Supervisor | Evaluasi | pimpinan/direktur-v2.html?view=recap | menu-direktur-v2 | PASS |
| menu-direktur-v2--changes | Perubahan Sistem | Manajemen | pimpinan/direktur-v2.html?view=changes | menu-direktur-v2 | PASS |
| menu-direktur-v2--coaching | Pembinaan Supervisor | Manajemen | pimpinan/direktur-v2.html?view=coaching | menu-direktur-v2 | PASS |
| menu-direktur-v2--history | Riwayat Keputusan | Evaluasi | pimpinan/direktur-v2.html?view=history | menu-direktur-v2 | PASS |
| menu-jadwal-direktur | Jadwal Direktur | Utama | pimpinan/direktur-v2.html?view=schedule | menu-jadwal-direktur | PASS |
| menu-kpi-direktur | KPI Direktur | Evaluasi | pimpinan/direktur-v2.html?view=kpi | menu-kpi-direktur | PASS |
| menu-panduan-kerja | Panduan & Manual | Lainnya | panduan-role-v2.html | menu-panduan-kerja | PASS |
| menu-profil | Profil | Lainnya | profil.html | menu-profil | PASS |
| menu-chat | Pesan | Lainnya | pesan.html | menu-chat | PASS / same staff chat engine |

### KESEHATAN

Assignment: `{"unit":"","area":"","divisionIds":[],"usrahIds":[],"studentIds":[],"programDomain":"","supervisedRoles":[],"managedRoles":[],"level":""}`.

Home: `role-workspace.html?v=205`.

Jadwal: `menu-jadwal-role`; KPI: `menu-kpi-role`.

| menuId | Label | Group | Route | Guard permission | Status / reason |
|---|---|---|---|---|---|
| menu-home | Beranda | Utama | role-workspace.html?v=205 | menu-home | PASS |
| menu-jurnal-kesehatan | Jurnal Kesehatan | Operasional | kesehatan/jurnal.html | menu-jurnal-kesehatan | PASS |
| menu-pemeriksaan-kesehatan | Pemeriksaan Kesehatan | Operasional | kesehatan/pemeriksaan.html | menu-pemeriksaan-kesehatan | PASS |
| menu-perizinan-uks | Perizinan Medis UKS | Operasional | kesehatan/perizinan-uks.html | menu-perizinan-uks | PASS |
| menu-stok-obat | Stok Obat UKS | Operasional | kesehatan/stokobat.html | menu-stok-obat | PASS |
| menu-panduan-kerja | Panduan & Manual | Lainnya | panduan-role-v2.html | menu-panduan-kerja | PASS |
| menu-profil | Profil | Lainnya | profil.html | menu-profil | PASS |
| menu-chat | Pesan | Lainnya | pesan.html | menu-chat | PASS / same staff chat engine |
| menu-kpi-role | KPI — Bukti Kerja | Evaluasi | utilitas-role-v2.html?view=kpi | menu-kpi-role | PASS |
| menu-jadwal-role | Jadwal & Ritme Kerja | Lainnya | utilitas-role-v2.html?view=schedule | menu-jadwal-role | PASS |

### LAYANAN_KEBERSIHAN

Assignment: `{"unit":"","area":"","divisionIds":[],"usrahIds":[],"studentIds":[],"programDomain":"","supervisedRoles":[],"managedRoles":[],"level":""}`.

Home: `role-workspace.html?v=205`.

Jadwal: `menu-jadwal-role`; KPI: `menu-kpi-role`.

| menuId | Label | Group | Route | Guard permission | Status / reason |
|---|---|---|---|---|---|
| menu-home | Beranda | Utama | role-workspace.html?v=205 | menu-home | PASS |
| menu-jurnal-pkl | Jurnal Keamanan & Kebersihan | Operasional | PKL/jurnal-pkl.html | menu-jurnal-pkl | BLOCKED / ASSIGNMENT_ADAPTER_REQUIRED |
| menu-buku-izin | Buku Izin | Operasional | layanan/buku-izin.html | menu-buku-izin | PASS |
| menu-buku-tamu | Buku Tamu | Operasional | PKL/buku-tamu.html | menu-buku-tamu | PASS |
| menu-penitipan-barang | Penitipan Barang | Operasional | PKL/penitipan-barang.html | menu-penitipan-barang | PASS |
| menu-panduan-kerja | Panduan & Manual | Lainnya | panduan-role-v2.html | menu-panduan-kerja | PASS |
| menu-profil | Profil | Lainnya | profil.html | menu-profil | PASS |
| menu-chat | Pesan | Lainnya | pesan.html | menu-chat | PASS / same staff chat engine |
| menu-kpi-role | KPI — Bukti Kerja | Evaluasi | utilitas-role-v2.html?view=kpi | menu-kpi-role | PASS |
| menu-jadwal-role | Jadwal & Ritme Kerja | Lainnya | utilitas-role-v2.html?view=schedule | menu-jadwal-role | PASS |

### DAPUR

Assignment: `{"unit":"","area":"","divisionIds":[],"usrahIds":[],"studentIds":[],"programDomain":"","supervisedRoles":[],"managedRoles":[],"level":""}`.

Home: `home-dapur.html?v=225`.

Jadwal: `menu-jadwal-role`; KPI: `menu-kpi-role`.

| menuId | Label | Group | Route | Guard permission | Status / reason |
|---|---|---|---|---|---|
| menu-home | Beranda | Utama | home-dapur.html?v=225 | menu-home | PASS |
| menu-dashboard-operasional | Logbook Hari Ini | Operasional | dapur/app.html?view=logbook | menu-dashboard-operasional | PASS |
| menu-dashboard-operasional--checklist | Checklist Kebersihan | Operasional | dapur/app.html?view=checklist | menu-dashboard-operasional | PASS |
| menu-dashboard-operasional--history | Riwayat | Evaluasi | dapur/app.html?view=history | menu-dashboard-operasional | PASS |
| menu-panduan-kerja | Panduan & Manual | Lainnya | panduan-role-v2.html | menu-panduan-kerja | PASS |
| menu-profil | Profil | Lainnya | profil.html | menu-profil | PASS |
| menu-chat | Pesan | Lainnya | pesan.html | menu-chat | PASS / same staff chat engine |
| menu-kpi-role | KPI — Bukti Kerja | Evaluasi | utilitas-role-v2.html?view=kpi | menu-kpi-role | PASS |
| menu-jadwal-role | Jadwal & Ritme Kerja | Lainnya | utilitas-role-v2.html?view=schedule | menu-jadwal-role | PASS |

### SARPRAS

Assignment: `{"unit":"","area":"","divisionIds":[],"usrahIds":[],"studentIds":[],"programDomain":"","supervisedRoles":[],"managedRoles":[],"level":""}`.

Home: `role-workspace.html?v=205`.

Jadwal: `menu-jadwal-role`; KPI: `menu-kpi-role`.

| menuId | Label | Group | Route | Guard permission | Status / reason |
|---|---|---|---|---|---|
| menu-home | Beranda | Utama | role-workspace.html?v=205 | menu-home | PASS |
| menu-jurnal-sarpras | Jurnal Sarpras | Operasional | sarpras/jurnal.html | menu-jurnal-sarpras | PASS |
| menu-checklist-sarpras | Checklist Harian | Operasional | sarpras/checklist.html | menu-checklist-sarpras | PASS |
| menu-tindak-sarpras | Tindak Lanjut | Operasional | sarpras/tindak-lanjut.html | menu-tindak-sarpras | PASS |
| menu-panduan-kerja | Panduan & Manual | Lainnya | panduan-role-v2.html | menu-panduan-kerja | PASS |
| menu-profil | Profil | Lainnya | profil.html | menu-profil | PASS |
| menu-chat | Pesan | Lainnya | pesan.html | menu-chat | PASS / same staff chat engine |
| menu-kpi-role | KPI — Bukti Kerja | Evaluasi | utilitas-role-v2.html?view=kpi | menu-kpi-role | PASS |
| menu-jadwal-role | Jadwal & Ritme Kerja | Lainnya | utilitas-role-v2.html?view=schedule | menu-jadwal-role | PASS |

### MEDIA

Assignment: `{"unit":"","area":"","divisionIds":[],"usrahIds":[],"studentIds":[],"programDomain":"","supervisedRoles":[],"managedRoles":[],"level":""}`.

Home: `home-media.html?v=226`.

Jadwal: `menu-jadwal-role`; KPI: `menu-kpi-role`.

| menuId | Label | Group | Route | Guard permission | Status / reason |
|---|---|---|---|---|---|
| menu-home | Beranda | Utama | home-media.html?v=226 | menu-home | PASS |
| menu-media | Update URL Wali | Operasional | admin/admin_media.html | menu-media | PASS |
| menu-dashboard-operasional | Laporan & Capaian Media | Operasional | media/target-capaian.html | menu-dashboard-operasional | PASS |
| menu-panduan-kerja | Panduan & Manual | Lainnya | panduan-role-v2.html | menu-panduan-kerja | PASS |
| menu-profil | Profil | Lainnya | profil.html | menu-profil | PASS |
| menu-chat | Pesan | Lainnya | pesan.html | menu-chat | PASS / same staff chat engine |
| menu-kpi-role | KPI — Bukti Kerja | Evaluasi | utilitas-role-v2.html?view=kpi | menu-kpi-role | PASS |
| menu-jadwal-role | Jadwal & Ritme Kerja | Lainnya | utilitas-role-v2.html?view=schedule | menu-jadwal-role | PASS |

### WALI_SANTRI

Assignment: `{"unit":"","area":"","divisionIds":[],"usrahIds":[],"studentIds":[],"programDomain":"","supervisedRoles":[],"managedRoles":[],"level":"","namaAnak":"SANTRI FIXTURE"}`.

Home: `wali/dashboard/index.html?v=20260820-v70`.

Jadwal: `BLOCKED — no supported destination`; KPI: `BLOCKED — no supported destination`.

| menuId | Label | Group | Route | Guard permission | Status / reason |
|---|---|---|---|---|---|
| menu-home | Beranda | Utama | wali/dashboard/index.html?v=20260820-v70 | menu-home | PASS |
| menu-panduan-kerja | Panduan Kerja | Lainnya | role-workspace.html?guide=1 | menu-panduan-kerja | PASS |

### MANAJER / PEMBINAAN_KARAKTER

Assignment: `{"unit":"PUTRI","area":"PEMBINAAN_KARAKTER","divisionIds":[],"usrahIds":[],"studentIds":[],"programDomain":"","supervisedRoles":[],"managedRoles":["NAQIBAH","MENTOR_USRAH","KONSELOR"],"level":""}`.

Home: `home-manajer-pembinaan-karakter.html?v=238`.

Jadwal: `menu-kontrol-pembinaan`; KPI: `menu-kpi-manajer`.

| menuId | Label | Group | Route | Guard permission | Status / reason |
|---|---|---|---|---|---|
| menu-home | Beranda | Utama | home-manajer-pembinaan-karakter.html?v=238 | menu-home | PASS |
| menu-kontrol-pembinaan | Naqib & Program | Manajemen | manajer/pembinaan-karakter-v2.html?view=naqib | menu-kontrol-pembinaan | PASS |
| menu-kontrol-pembinaan--mentoring | Mentoring Usrah | Manajemen | manajer/pembinaan-karakter-v2.html?view=mentoring | menu-kontrol-pembinaan | PASS |
| menu-kontrol-pembinaan--counselor | Kasus & Konselor | Manajemen | manajer/pembinaan-karakter-v2.html?view=counselor | menu-kontrol-pembinaan | PASS |
| menu-kontrol-pembinaan--followup | Tindak Lanjut | Manajemen | manajer/pembinaan-karakter-v2.html?view=followup | menu-kontrol-pembinaan | PASS |
| menu-kontrol-pembinaan--observation | Observasi Pengasuhan | Manajemen | manajer/pembinaan-karakter-v2.html?view=observation | menu-kontrol-pembinaan | PASS |
| menu-kontrol-pembinaan--coaching | Pembinaan Personil | Manajemen | manajer/pembinaan-karakter-v2.html?view=coaching | menu-kontrol-pembinaan | PASS |
| menu-kontrol-pembinaan--sdm-kpi | Rekap KPI SDM | Evaluasi | manajer/pembinaan-karakter-v2.html?view=sdm-kpi | menu-kontrol-pembinaan | PASS |
| menu-kontrol-pembinaan--history | Riwayat Temuan | Evaluasi | manajer/pembinaan-karakter-v2.html?view=history | menu-kontrol-pembinaan | PASS |
| menu-kpi-manajer | KPI Manajer Pembinaan Karakter | Evaluasi | manajer/pembinaan-karakter-v2.html?view=kpi | menu-kpi-manajer | PASS |
| menu-panduan-kerja | Panduan & Manual | Lainnya | panduan-role-v2.html | menu-panduan-kerja | PASS |
| menu-profil | Profil | Lainnya | profil.html | menu-profil | PASS |
| menu-chat | Pesan | Lainnya | pesan.html | menu-chat | PASS / same staff chat engine |

### MANAJER / PENDIDIKAN PUTRI

Assignment: `{"unit":"PUTRI","area":"PENDIDIKAN","divisionIds":[],"usrahIds":[],"studentIds":[],"programDomain":"KEPONDOKAN","supervisedRoles":[],"managedRoles":["GURU_PONDOK"],"level":""}`.

Home: `home-manajer-pendidikan.html?v=232`.

Jadwal: `menu-kontrol-pendidikan`; KPI: `menu-kpi-manajer`.

| menuId | Label | Group | Route | Guard permission | Status / reason |
|---|---|---|---|---|---|
| menu-home | Beranda | Utama | home-manajer-pendidikan.html?v=232 | menu-home | PASS |
| menu-kontrol-pendidikan | Kontrol Hari Ini | Manajemen | manajer/pendidikan-v2.html?view=control | menu-kontrol-pendidikan | PASS |
| menu-materi-pembelajaran | Capaian Materi | Manajemen | manajer/pendidikan-v2.html?view=material | menu-materi-pembelajaran | PASS |
| menu-tindak-akademik | Tindak Lanjut | Manajemen | manajer/pendidikan-v2.html?view=followup | menu-tindak-akademik | PASS |
| menu-absensi-ibadah-guru | Guru Mukim & Ibadah | Manajemen | pendidikan/absensi-ibadah-guru.html | menu-absensi-ibadah-guru | PASS |
| menu-guru-pondok | Guru Pondok | Manajemen | manajer/pendidikan-v2.html?view=teachers | menu-guru-pondok | PASS |
| menu-nilai-manajer | Nilai Ujian | Manajemen | manajer/pendidikan-v2.html?view=scores | menu-nilai-manajer | PASS |
| menu-observasi-pembelajaran | Observasi Pembelajaran | Manajemen | manajer/pendidikan-v2.html?view=observation | menu-observasi-pembelajaran | PASS |
| menu-riwayat-temuan | Riwayat Temuan | Manajemen | manajer/pendidikan-v2.html?view=findings | menu-riwayat-temuan | PASS |
| menu-pembinaan-guru | Pembinaan Guru | Manajemen | manajer/pendidikan-v2.html?view=coaching | menu-pembinaan-guru | PASS |
| menu-kpi-manajer | KPI Manajer Pendidikan | Evaluasi | manajer/pendidikan-v2.html?view=kpi | menu-kpi-manajer | PASS |
| menu-panduan-kerja | Panduan & Manual | Lainnya | panduan-role-v2.html | menu-panduan-kerja | PASS |
| menu-profil | Profil | Lainnya | profil.html | menu-profil | PASS |
| menu-chat | Pesan | Lainnya | pesan.html | menu-chat | PASS / same staff chat engine |

### SUPERVISOR / PENDIDIKAN

Assignment: `{"unit":"PUTRI","area":"","divisionIds":["PENDIDIKAN"],"usrahIds":[],"studentIds":[],"programDomain":"","supervisedRoles":["GURU_PONDOK"],"managedRoles":[],"level":""}`.

Home: `home-supervisor-v2.html?v=239`.

Jadwal: `menu-supervisor-schedule`; KPI: `menu-kpi-supervisor`.

| menuId | Label | Group | Route | Guard permission | Status / reason |
|---|---|---|---|---|---|
| menu-home | Beranda | Utama | home-supervisor-v2.html?v=239 | menu-home | PASS |
| menu-supervisor-v2 | Kondisi Divisi | Manajemen | supervisor/workspace-v2.html?view=divisions | menu-supervisor-v2 | PASS |
| menu-supervisor-v2--escalations | Eskalasi Masuk | Manajemen | supervisor/workspace-v2.html?view=escalations | menu-supervisor-v2 | PASS |
| menu-supervisor-v2--observation | Observasi Pembanding | Manajemen | supervisor/workspace-v2.html?view=observation | menu-supervisor-v2 | PASS |
| menu-supervisor-v2--followup | Tindak Lanjut Supervisor | Manajemen | supervisor/workspace-v2.html?view=followup | menu-supervisor-v2 | PASS |
| menu-supervisor-v2--people | Manajer & Personil | Manajemen | supervisor/workspace-v2.html?view=people | menu-supervisor-v2 | PASS |
| menu-supervisor-v2--recap | Rekap KPI Bawahan | Evaluasi | supervisor/workspace-v2.html?view=recap | menu-supervisor-v2 | PASS |
| menu-supervisor-v2--standards | Standar Kerja | Manajemen | supervisor/workspace-v2.html?view=standards | menu-supervisor-v2 | PASS |
| menu-supervisor-v2--coaching | Pembinaan | Manajemen | supervisor/workspace-v2.html?view=coaching | menu-supervisor-v2 | PASS |
| menu-supervisor-v2--history | Riwayat Eskalasi | Evaluasi | supervisor/workspace-v2.html?view=history | menu-supervisor-v2 | PASS |
| menu-supervisor-v2--review-izin | Review Izin Santri | Manajemen | supervisor/review-izin-santri.html | menu-supervisor-v2 | BLOCKED / PERMISSION_DENIED |
| menu-supervisor-schedule | Jadwal Supervisor | Utama | supervisor/workspace-v2.html?view=schedule | menu-supervisor-schedule | PASS |
| menu-kpi-supervisor | KPI Supervisor | Evaluasi | supervisor/workspace-v2.html?view=kpi | menu-kpi-supervisor | PASS |
| menu-panduan-kerja | Panduan & Manual | Lainnya | panduan-role-v2.html | menu-panduan-kerja | PASS |
| menu-profil | Profil | Lainnya | profil.html | menu-profil | PASS |
| menu-chat | Pesan | Lainnya | pesan.html | menu-chat | PASS / same staff chat engine |

### SUPERVISOR / PELAYANAN

Assignment: `{"unit":"PUTRI","area":"","divisionIds":["LAYANAN_KEBERSIHAN"],"usrahIds":[],"studentIds":[],"programDomain":"","supervisedRoles":["LAYANAN_KEBERSIHAN"],"managedRoles":[],"level":""}`.

Home: `home-supervisor-v2.html?v=239`.

Jadwal: `menu-supervisor-schedule`; KPI: `menu-kpi-supervisor`.

| menuId | Label | Group | Route | Guard permission | Status / reason |
|---|---|---|---|---|---|
| menu-home | Beranda | Utama | home-supervisor-v2.html?v=239 | menu-home | PASS |
| menu-supervisor-v2 | Kondisi Divisi | Manajemen | supervisor/workspace-v2.html?view=divisions | menu-supervisor-v2 | PASS |
| menu-supervisor-v2--escalations | Eskalasi Masuk | Manajemen | supervisor/workspace-v2.html?view=escalations | menu-supervisor-v2 | PASS |
| menu-supervisor-v2--observation | Observasi Pembanding | Manajemen | supervisor/workspace-v2.html?view=observation | menu-supervisor-v2 | PASS |
| menu-supervisor-v2--followup | Tindak Lanjut Supervisor | Manajemen | supervisor/workspace-v2.html?view=followup | menu-supervisor-v2 | PASS |
| menu-supervisor-v2--people | Manajer & Personil | Manajemen | supervisor/workspace-v2.html?view=people | menu-supervisor-v2 | PASS |
| menu-supervisor-v2--recap | Rekap KPI Bawahan | Evaluasi | supervisor/workspace-v2.html?view=recap | menu-supervisor-v2 | PASS |
| menu-supervisor-v2--standards | Standar Kerja | Manajemen | supervisor/workspace-v2.html?view=standards | menu-supervisor-v2 | PASS |
| menu-supervisor-v2--coaching | Pembinaan | Manajemen | supervisor/workspace-v2.html?view=coaching | menu-supervisor-v2 | PASS |
| menu-supervisor-v2--history | Riwayat Eskalasi | Evaluasi | supervisor/workspace-v2.html?view=history | menu-supervisor-v2 | PASS |
| menu-supervisor-v2--review-izin | Review Izin Santri | Manajemen | supervisor/review-izin-santri.html | menu-supervisor-v2 | CONDITIONAL |
| menu-supervisor-schedule | Jadwal Supervisor | Utama | supervisor/workspace-v2.html?view=schedule | menu-supervisor-schedule | PASS |
| menu-kpi-supervisor | KPI Supervisor | Evaluasi | supervisor/workspace-v2.html?view=kpi | menu-kpi-supervisor | PASS |
| menu-panduan-kerja | Panduan & Manual | Lainnya | panduan-role-v2.html | menu-panduan-kerja | PASS |
| menu-profil | Profil | Lainnya | profil.html | menu-profil | PASS |
| menu-chat | Pesan | Lainnya | pesan.html | menu-chat | PASS / same staff chat engine |

### KONSELOR / MADYA PUTRI

Assignment: `{"unit":"PUTRI","area":"","divisionIds":[],"usrahIds":[],"studentIds":[],"programDomain":"","supervisedRoles":[],"managedRoles":[],"level":"MADYA"}`.

Home: `home-konselor.html?v=220`.

Jadwal: `menu-kasus-masuk`; KPI: `menu-kpi-konselor`.

| menuId | Label | Group | Route | Guard permission | Status / reason |
|---|---|---|---|---|---|
| menu-home | Beranda | Utama | home-konselor.html?v=220 | menu-home | PASS |
| menu-kasus-masuk | Kasus Masuk | Operasional | konselor/cases-v2.html?view=incoming | menu-kasus-masuk | PASS |
| menu-kasus-aktif | Kasus Aktif | Operasional | konselor/cases-v2.html?view=active | menu-kasus-aktif | PASS |
| menu-konseling-konselor | Catat Konseling | Operasional | konselor/cases-v2.html?view=counseling | menu-konseling-konselor | PASS |
| menu-eskalasi-konselor | Eskalasi Masuk | Operasional | konselor/cases-v2.html?view=escalations | menu-eskalasi-konselor | PASS |
| menu-riwayat-kasus | Riwayat Kasus | Operasional | konselor/cases-v2.html?view=history | menu-riwayat-kasus | PASS |
| menu-self-konselor | Self Asesmen Konselor | Evaluasi | konselor/self-asesmen.html | menu-self-konselor | PASS |
| menu-kpi-konselor | KPI Konselor | Evaluasi | konselor/kpi.html | menu-kpi-konselor | PASS |
| menu-panduan-kerja | Panduan & Manual | Lainnya | panduan-role-v2.html | menu-panduan-kerja | PASS |
| menu-profil | Profil | Lainnya | profil.html | menu-profil | PASS |
| menu-chat | Pesan | Lainnya | pesan.html | menu-chat | PASS / same staff chat engine |
| menu-jadwal-role | Jadwal & Ritme Kerja | Lainnya | utilitas-role-v2.html?view=schedule | menu-jadwal-role | PASS |

### KESEHATAN / PUTRA terbatas

Assignment: `{"unit":"PUTRA","area":"","divisionIds":[],"usrahIds":[],"studentIds":[],"programDomain":"","supervisedRoles":[],"managedRoles":[],"level":""}`.

Home: `role-workspace.html?v=205`.

Jadwal: `menu-jadwal-role`; KPI: `menu-kpi-role`.

| menuId | Label | Group | Route | Guard permission | Status / reason |
|---|---|---|---|---|---|
| menu-home | Beranda | Utama | role-workspace.html?v=205 | menu-home | PASS |
| menu-jurnal-kesehatan | Jurnal Kesehatan | Operasional | kesehatan/jurnal.html | menu-jurnal-kesehatan | BLOCKED / ASSIGNMENT_ADAPTER_REQUIRED |
| menu-pemeriksaan-kesehatan | Pemeriksaan Kesehatan | Operasional | kesehatan/pemeriksaan.html | menu-pemeriksaan-kesehatan | BLOCKED / ASSIGNMENT_ADAPTER_REQUIRED |
| menu-perizinan-uks | Perizinan Medis UKS | Operasional | kesehatan/perizinan-uks.html | menu-perizinan-uks | BLOCKED / ASSIGNMENT_ADAPTER_REQUIRED |
| menu-stok-obat | Stok Obat UKS | Operasional | kesehatan/stokobat.html | menu-stok-obat | BLOCKED / ASSIGNMENT_ADAPTER_REQUIRED |
| menu-panduan-kerja | Panduan & Manual | Lainnya | panduan-role-v2.html | menu-panduan-kerja | PASS |
| menu-profil | Profil | Lainnya | profil.html | menu-profil | PASS |
| menu-chat | Pesan | Lainnya | pesan.html | menu-chat | PASS / same staff chat engine |
| menu-kpi-role | KPI — Bukti Kerja | Evaluasi | utilitas-role-v2.html?view=kpi | menu-kpi-role | PASS |
| menu-jadwal-role | Jadwal & Ritme Kerja | Lainnya | utilitas-role-v2.html?view=schedule | menu-jadwal-role | PASS |

### SARPRAS / PUTRA terbatas

Assignment: `{"unit":"PUTRA","area":"","divisionIds":[],"usrahIds":[],"studentIds":[],"programDomain":"","supervisedRoles":[],"managedRoles":[],"level":""}`.

Home: `role-workspace.html?v=205`.

Jadwal: `menu-jadwal-role`; KPI: `menu-kpi-role`.

| menuId | Label | Group | Route | Guard permission | Status / reason |
|---|---|---|---|---|---|
| menu-home | Beranda | Utama | role-workspace.html?v=205 | menu-home | PASS |
| menu-jurnal-sarpras | Jurnal Sarpras | Operasional | sarpras/jurnal.html | menu-jurnal-sarpras | BLOCKED / ASSIGNMENT_ADAPTER_REQUIRED |
| menu-checklist-sarpras | Checklist Harian | Operasional | sarpras/checklist.html | menu-checklist-sarpras | BLOCKED / ASSIGNMENT_ADAPTER_REQUIRED |
| menu-tindak-sarpras | Tindak Lanjut | Operasional | sarpras/tindak-lanjut.html | menu-tindak-sarpras | BLOCKED / ASSIGNMENT_ADAPTER_REQUIRED |
| menu-panduan-kerja | Panduan & Manual | Lainnya | panduan-role-v2.html | menu-panduan-kerja | PASS |
| menu-profil | Profil | Lainnya | profil.html | menu-profil | PASS |
| menu-chat | Pesan | Lainnya | pesan.html | menu-chat | PASS / same staff chat engine |
| menu-kpi-role | KPI — Bukti Kerja | Evaluasi | utilitas-role-v2.html?view=kpi | menu-kpi-role | PASS |
| menu-jadwal-role | Jadwal & Ritme Kerja | Lainnya | utilitas-role-v2.html?view=schedule | menu-jadwal-role | PASS |

### LAYANAN_KEBERSIHAN / PUTRA terbatas

Assignment: `{"unit":"PUTRA","area":"","divisionIds":[],"usrahIds":[],"studentIds":[],"programDomain":"","supervisedRoles":[],"managedRoles":[],"level":""}`.

Home: `role-workspace.html?v=205`.

Jadwal: `menu-jadwal-role`; KPI: `menu-kpi-role`.

| menuId | Label | Group | Route | Guard permission | Status / reason |
|---|---|---|---|---|---|
| menu-home | Beranda | Utama | role-workspace.html?v=205 | menu-home | PASS |
| menu-jurnal-pkl | Jurnal Keamanan & Kebersihan | Operasional | PKL/jurnal-pkl.html | menu-jurnal-pkl | BLOCKED / ASSIGNMENT_ADAPTER_REQUIRED |
| menu-buku-izin | Buku Izin | Operasional | layanan/buku-izin.html | menu-buku-izin | BLOCKED / ASSIGNMENT_ADAPTER_REQUIRED |
| menu-buku-tamu | Buku Tamu | Operasional | PKL/buku-tamu.html | menu-buku-tamu | BLOCKED / ASSIGNMENT_ADAPTER_REQUIRED |
| menu-penitipan-barang | Penitipan Barang | Operasional | PKL/penitipan-barang.html | menu-penitipan-barang | BLOCKED / ASSIGNMENT_ADAPTER_REQUIRED |
| menu-panduan-kerja | Panduan & Manual | Lainnya | panduan-role-v2.html | menu-panduan-kerja | PASS |
| menu-profil | Profil | Lainnya | profil.html | menu-profil | PASS |
| menu-chat | Pesan | Lainnya | pesan.html | menu-chat | PASS / same staff chat engine |
| menu-kpi-role | KPI — Bukti Kerja | Evaluasi | utilitas-role-v2.html?view=kpi | menu-kpi-role | PASS |
| menu-jadwal-role | Jadwal & Ritme Kerja | Lainnya | utilitas-role-v2.html?view=schedule | menu-jadwal-role | PASS |

## Wali standalone portal — compatibility exception

The Wali shell remains wali/dashboard/index.html, not the staff sidebar. WALI_MENU_CONFIG is a strict local allowlist; settings/role_menus may select only those Wali IDs (legacy menu-laporan-wali maps to menu-akademik-wali). It cannot inject internal management routes. Existing namaAnak child mapping, login, student validation and child-only guards remain unchanged. Its legacy authorization read is retained; zero-read staff-menu claims do not include Wali portal startup.

| ID | Destination under wali/dashboard/ | Status |
|---|---|---|
| menu-beranda-wali | beranda.html | PASS |
| menu-akademik-wali | akademik.html | CONDITIONAL — Wali config |
| menu-karakter-wali | karakter.html | CONDITIONAL — Wali config |
| menu-pembinaan-wali | pembinaan.html | CONDITIONAL — Wali config |
| menu-informasi-penting-wali | informasi-penting.html | CONDITIONAL — Wali config |
| menu-riwayat-kesehatan-wali | riwayat-kesehatan.html | CONDITIONAL — Wali config |
| menu-perizinan-wali | perizinan.html | PASS |
| menu-keuangan-wali | keuangan.html | CONDITIONAL — existing disabled-module policy retained |

## Removed / consolidated navigation

| Previous entry or behavior | Final resolution | Status |
|---|---|---|
| Director/Supervisor legacy operational command centers | Dedicated V2 executive/supervision views only | REMOVED |
| Manager Pendidikan separate Pelaksanaan KBM | Kontrol Hari Ini | REMOVED |
| Manager Pembinaan Kontrol Hari Ini | Not restored; Naqib, Mentor, Counselor and follow-up remain | REMOVED |
| Naqib menu-usrah / old mentoring ownership | Dedicated Mentor role only | REMOVED |
| Naqib menu-jadwal-piket | Program Hari Ini / Jadwal | REMOVED |
| Naqib Riwayat Absensi linking back to attendance input | No history mode exists in current attendance page; duplicate card removed | REMOVED |
| Mentor legacy mentoring-individu / mentoring-usrah destinations | One mentor-usrah-v2.html engine, form/history views | REMOVED |
| Media Target & Capaian alternate label | Laporan & Capaian Media, same existing file | REMOVED |
| Workspace permission ID reused for multiple URLs | Unique DOM ID per view; original permission preserved | PASS |
| Generic Panduan used as Home | Dedicated Home when available, otherwise local navigation landing | REMOVED |
| KPI/Jadwal fallback to unrelated operational dashboard | Existing role-specific destination or local evidence/work-rhythm view without invented scores/sessions | REMOVED |

## Conditional and blocked legacy adapters

- Review Izin Santri requires Supervisor Layanan. Exact aliases LAYANAN and PELAYANAN normalize to LAYANAN_KEBERSIHAN. Other Supervisor divisions remain denied.
- Kalender Pendidikan / PKBM calendar lacks a reviewed assignment/domain adapter; BLOCKED, not bypassed.
- PKL/jurnal-pkl.html lacks a compatible responsibility/scope adapter; BLOCKED to avoid returning Pendidikan/Pembinaan responsibilities to Layanan.
- Legacy Kesehatan, Sarpras and Layanan tools operate only for role-wide assignments (no narrowed unit/student/usrah/division/domain). Narrowed assignments remain BLOCKED until their data adapters enforce that scope.
- Manager areas other than implemented Pendidikan/Pembinaan have no new Home/KPI invented; use generic local navigation landing.
- Guru Tahsin/Tahfiz keeps existing role/menu authorization; no schedule dataset is fetched just to build menus.
- konselor/higher-response.html remains contextual, not an ordinary executive case-handling menu. Its target-role guard remains authoritative.
- Legacy Wali module switches are preserved; this is not a Wali redesign.

## Verification and limits

- Static fixtures verify 250 registered menu instances including the unchanged two Wali metadata entries; 248 internal instances are covered by browser navigation across 22 role/assignment contexts. No production network or writes were used.
- Internal browser smoke covers all menu destinations, bottom Jadwal/KPI, guide tabs/search/30 sections/zero reads, profile role context, shared Pesan empty state, Lainnya/escape and A→B→A role switching. Zero uncaught runtime errors after fixes.
- Viewports: 409×720, 456×720 and 1440×720. Home geometry additionally passed at 550×720 and 1024×720; no Home scroll, card overlap or horizontal overflow. Feature overflow checks cover guide/profile/chat; this is not a test of every populated business form.
- `tests/release-chat-v266-browser.cjs` verifies failure/retry, canonical contacts, send, read/unread, preserved last-message preview and listener disposal with an in-memory message store. No real message was sent.
- Wali files are verified against this task's starting hashes, not modified or retested as a business workflow.
- Live Firebase permissions, production data completeness and profile-save round trips remain unverified. The broad production-readiness diagnostic still returns BLOCKED for legacy routes requiring scope adapters; these routes are not bypassed by the menu patch. The pre-Phase-2B protected-source hash test is obsolete relative to earlier approved role implementations and remains unmodified.
- The older `tests/role-v2-entry-guards.cjs` attendance UI fixture still predates the current attendance engine; see the release checklist for the exact result, not an assumed PASS.

Re-run: `node tests/release-hardening-v266.cjs`; `node tests/role-menu-v2.cjs`; `node tests/role-system-v2.cjs`. Browser harnesses: `tests/role-menu-v2-browser.cjs`, `tests/release-chat-v266-browser.cjs`, `tests/mobile-home-v2-browser.cjs` (Playwright + Chrome). Full results and remaining gates: [release checklist](RELEASE-CHECKLIST-2026-09-21.md).
