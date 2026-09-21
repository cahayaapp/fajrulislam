# Naqib Home V1 — premium zero-download navigation hub

Date: 2026-09-17. Scope: Naqib Home and narrowly scoped shared-shell startup guards only. No Firebase Rules, schema, roster, program definition, scoring formula, point value, assessment mechanism, attendance write, or case workflow was changed.

## Existing architecture discovered

Before this change, `menu-home` loaded the shared `home.html`. Its Naqib branch called `loadNaqibQuickData()` while rendering Home and mixed navigation with operational attention data. The separate operational workspace already existed at `workspace/naqib-operasional.html?v=85`; attendance, reports, initiatives, CAHAYA assessment and violation reporting also already had their own feature pages. The new `home-naqib.html` therefore does not duplicate any of those implementations. It is a static navigation hub that delegates to the existing shell routes.

The shell retains exactly one outer bottom navigation. Current Naqib semantics remain the existing mapping:

| Bottom item | Existing target |
| --- | --- |
| Jadwal | `menu-absen-asrama` / operational-program entry mapping already owned by the shell |
| KPI | `menu-asesmen-santri` plus the shell's existing operational fallback |
| Beranda | `home-naqib.html?v=204` |
| Pesan | `menu-chat` |
| Lainnya | existing utility/menu sheet |

This task did not silently replace that mapping. A dedicated KPI Naqib module does not yet exist; the Home card says **BELUM TERSEDIA** rather than routing to CAHAYA assessment under a misleading KPI label.

## Before: Home request graph

Opening the former shared Home as Naqib issued three RTDB one-shot reads from `loadNaqibQuickData()`:

| Path | Scope | Purpose on old Home |
| --- | --- | --- |
| `cahaya_app/jadwal_piket_naqib` | whole node | current Putra/Putri duty summary |
| `cahaya_app/absensi_program_harian` | `limitToLast(250)` | today's attendance/attention calculation |
| `cahaya_app/log_lapor_inisiatif` | `limitToLast(250)` | today's violation/attention calculation |

The result used a 90-second parent-window cache, but a cold Home still downloaded operational records. Those were `once('value')` calls rather than realtime subscriptions. No Naqib Home-specific polling interval was found.

The shared shell could additionally start chat inbox listeners through its timeout fallback and could refresh push configuration/token data even when Pesan had not been opened. A cold role-menu setup could also fetch Firestore `settings/role_menus` when no cache existed.

## After: zero-download Home

**Naqib Home operational Firebase reads = 0. Operational listeners = 0. Polling timers = 0.**

`home-naqib.html` imports only scoped local CSS and `js/naqib-home-hub.js`. It uses locally available shell/session identity, static route metadata, date formatting and local assets. It imports no Firebase SDK/config, master-data bundle, program module, feature page, or hidden iframe. It displays no fake counts, percentages, points, ranks, alerts or KPI values.

The shared shell now treats `naqib` and `naqib-operasional` like the already approved Guru/Director zero-download roles for cold Home startup:

- existing local/default role-menu policy is used instead of a blocking `settings/role_menus` fetch;
- chat contact/inbox bootstrap is deferred until explicit Pesan use;
- automatic push configuration/token refresh is deferred until Pesan or the existing explicit enable action;
- global authentication/session restoration remains owned by the shell and is the only permitted startup network exception.

After Pesan has explicitly been opened, its existing bounded messaging listeners may remain active for delivery/unread behavior. Existing registered service-worker push is not revoked. This intentional messaging behavior is not Naqib operational dashboard preload.

## Home structure and existing routes

The V1 Home contains a local brand/profile header, identity hero, four quick actions, ten Menu Naqib cards, a static motivational card and a lightweight local Panduan Kerja modal.

| Home action | Existing target/status |
| --- | --- |
| Program Hari Ini / Program Santri | `menu-dashboard-operasional` → `workspace/naqib-operasional.html?v=85` |
| Absensi Program | `menu-absen-asrama` → `naqib/absensi.html?v=59` |
| Laporan Pelaksanaan | `menu-jurnal-piket` → `naqib/jurnal-piket.html?v=59` |
| Catat Inisiatif Santri | `menu-gamifikasi` → `naqib/gamifikasi.html` |
| Asesmen CAHAYA | `menu-asesmen-santri` → `pusat-asesmen/santri.html?v=59` |
| Lapor Kasus / Pelanggaran | `menu-laporan-murojaah` → `guru/lapor-pelanggaran.html?v=153` |
| Riwayat Laporan | existing journal route, which already owns report lookup/history |
| Riwayat Absensi | dedicated module not found; card marked **BELUM TERSEDIA** |
| KPI Naqib | dedicated module not found; card marked **BELUM TERSEDIA** |
| Panduan Kerja | local/static modal; no operational read |

For the narrower legacy role `naqib-operasional`, the shell's existing authorization remains authoritative. For example, `menu-jurnal-piket` is not currently in its whitelist, while it is valid for `naqib`. The Home does not expand permissions; unauthorized navigation is still rejected by `openAuthorizedMenu()`.

## Feature-on-click data ownership

No feature data is loaded by Home. After explicit navigation, existing pages continue to own their reads and writes:

- Program workspace: local `CAHAYA_PROGRAM_HARIAN_24JAM` plus its existing full read of `cahaya_app/absensi_program_harian`.
- Absensi Program: reads `master_usrah`, `master_program_harian`, and `jadwal_program_harian`; save remains `absensi_program_harian` plus `wali_index/{santri}/program/{id}`, with the current `izin_sakit_harian/{date}` check.
- Laporan Pelaksanaan: uses `cahaya_app/jadwal_piket_naqib` and `cahaya_app/jurnal_piket_naqib`; existing date-filtered journal query/save remains unchanged.
- Asesmen CAHAYA: reads roster only after entry and saves to `cahaya_app/asesmen_cahaya_santri` plus `wali_index/{santri}/asesmen/{id}`.
- Lapor Kasus: uses bundled local roster and writes the existing `cahaya_app/log_lapor_inisiatif`, `wali_index/{santri}/laporan/{id}`, and optional `bukti_pelanggaran/{groupId}` paths.

Some feature queries remain broad, particularly the operational workspace's full `absensi_program_harian` read. They now occur only after explicit entry and were not rewritten because this phase preserves existing feature behavior.

## Positive initiative/scoring audit

An existing initiative feature **does exist** at `naqib/gamifikasi.html`; no parallel backend or point engine was created.

Authoritative record path:

- `cahaya_app/log_lapor_inisiatif`

Roster sources used only after the feature opens:

- `cahaya_app/master_usrah`
- `cahaya_app/master_akademik`

Existing record fields include `poinDiberikan`, `poin`, `tipe: "Inisiatif Kebaikan"`, `kategoriApresiasi`, `subtipe`, `jenisInisiatif`, optional `jenisIbadahSunnah`, `levelInisiatif`, `poinStandar`, `poinDisesuaikan`, `panduanPoinVersi`, batch/group metadata, santri identity, and Naqib/input identity. The current feature supports one initiative applied to multiple selected santri.

Existing configured options in the page remain authoritative: Inisiatif Ringan 5, Kepedulian Nyata 10, Solusi dan Tanggung Jawab 15, Kepemimpinan Kebaikan 20, Dampak Istimewa 25; the existing special Ibadah Sunnah entries and 40-point daily guard also remain untouched. These values are documented, not newly introduced by Home. No separate aggregate path was found in the initiative save flow; consumers use records in `log_lapor_inisiatif`. Any future aggregation redesign needs a separate approved scoring audit.

## Lifecycle/listener audit

The inspected Naqib feature pages use one-shot `get()` calls and transient UI timers; no feature-level `onValue`/`value` subscription or periodic Firebase polling was found that needed a detach hook. The shell's existing frame parking/resume mechanism remains intact. An already-started one-shot request may finish after a page is hidden because Firebase `get()` is not cancellable here, but no hidden recurring Naqib listener is kept alive by the new Home.

The Home closes its local guide/toast state on suspend and performs no resume fetch. It does not create or preload feature iframes.

## Identity, Panduan Kerja, and role boundary

Identity is resolved from the existing local/shell profile and synchronized through the existing profile message. Generic `Admin`/`Admin Cahaya` labels are excluded from display-name candidates; no production identity write occurs.

Panduan Kerja is a static, role-aware Naqib guide with the requested eight sections: Peran Saya, Tugas Utama, Alur Kerja Harian, Standar Kerja, Batas Kewenangan, Jika Ada Masalah, Panduan Fitur, and FAQ. It establishes a local-data pattern suitable for later reuse, but this task deliberately does not modify Guru/Director or introduce a global guide engine.

The Home exposes reporting only, never counseling, tabayyun, punishment, consequence assignment, violation-point assignment, case closure, audit, Manager, Supervisor or Director controls. `Catat Inisiatif Santri` is explicitly positive-santri recognition, not a Naqib journal.

One legacy inconsistency was found and intentionally not altered: the existing violation reporter writes `jalurPenanganan: "NAQIB"` and `statusPenanganan: "Menunggu Naqib Operasional"` for some noncritical/non-moral reports, although its visible copy says tabayyun/handling belongs to the Counselor. The new Home adds no handling control, but the stored routing semantics require a separately approved case-workflow correction.

## Files changed

Root and byte-matched `/docs` copies:

- `home-naqib.html` — static zero-download Home.
- `css/naqib-home-hub.css` — scoped mobile-first presentation.
- `js/naqib-home-hub.js` — local identity, static menu, existing-route delegation, Panduan Kerja and suspend cleanup.
- `main-dashboard.html` — role-specific Naqib Home routing, local menu-policy guard, shared-script cache version.
- `js/pengurus-whatsapp-chat.js` — extends the approved cold-Home deferred chat guard to Naqib roles.
- `js/cahaya-push-global-v68.js` — extends the approved deferred push refresh guard to Naqib roles.

This report is documentation-only and is not mirrored as a second file.

## Verification and limitations

- Static source and VM checks confirm Home has no Firebase import/reference, fetch, XHR, timer-driven operational load or hidden feature preload.
- Root and `/docs` copies are byte-equivalent for all touched mirrored files.
- Mobile browser verification target is 409 × 720: two-column quick/menu cards, readable copy, normal vertical scrolling, no horizontal overflow and exactly one outer bottom navigation.
- Guru/Director Home and Guru Presensi/Nilai files are not edited by this task; checksum regression is recorded in the final implementation report.
- No production attendance, initiative, assessment or violation write is performed during testing.
- Dedicated Riwayat Absensi and KPI Naqib feature modules remain unresolved. Laporan and its history share the existing journal module.
- Existing feature-level query efficiency is outside Home V1; broad reads begin only after the relevant feature is opened.

