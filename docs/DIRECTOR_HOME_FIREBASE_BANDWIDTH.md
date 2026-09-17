# Director Home — executive navigation hub

Date: 2026-09-17. Scope: Director Home only, with narrowly scoped shared-shell startup guards. Guru Home is unchanged. No Firebase rules, schema, production data, schedules, roster/allocation or Manager Pendidikan implementation changed.

## Before: actual Home request graph

Opening `home-direktur.html` ran `initIdentity(); renderDivisionMonitor(); loadData()`. `loadData()` subsequently called `loadRollingDisciplineScores()`. All operational calls were RTDB `once('value')`, not realtime subscriptions.

| Path under cahaya_app | Trigger/query |
| --- | --- |
| absensi_pembelajaran | Today's `orderByChild('tanggal').startAt(today).endAt(today)`; empty/error fallback `limitToLast(900)` filtered locally. Then a separate rolling 30-day date-range read. |
| absensi_program_harian | Same daily/fallback and rolling 30-day reads. |
| setoran_tahfiz | Same daily query and last-900 fallback. |
| jadwal_pelajaran | Whole node, with local `data/jadwal-pelajaran-awal-2026-2027.json` fallback. Schedule result cached within Home. |
| absensi_guru/{today} | Whole current-date node. |
| target_tahfiz | Whole node, cached in Home. |
| master_usrah | Whole node, reused by rolling calculations. |
| log_absensi_guru | Rolling 30-day `tanggal` range. |

Cold Home therefore initiated seven primary reads plus three rolling reads, with up to three extra last-900 fallbacks. Daily records overlapped with the later rolling downloads for learning/program attendance. Schedule/usrah caches avoided some duplicate calls, but not the overlapping ranges. Additional recap-sheet date-range reads were user-triggered, not startup reads. No independent health/sarpras/service statistics query was found in the actual Home startup graph; those belong to detail modules.

Home had no operational onValue subscription or periodic polling timer. Its delayed notification-sheet opening was a transient timeout. Shared shell chat timeout fallback could nevertheless attach operational inbox listeners before Pesan was opened; push boot/pageshow could read VAPID configuration and refresh tokens.

## After

**Director Home operational Firebase reads = 0. Operational listeners = 0. Polling timers = 0.**

`home-direktur.html` now loads only `js/director-home-hub.js` and scoped local CSS/assets. No master-data, Firebase module, aggregation module, hidden feature iframe or data preload is initiated by the Home script. Resume refreshes local display identity only. No fake statistics replace removed metrics.

Shared-shell changes:

- Director Home URL version is 202; Guru remains 201.
- On a cold Director start, role menu presentation uses existing cached/local configuration instead of fetching `settings/role_menus`. Existing authentication and backend authorization are not replaced.
- Director joins the existing Guru guard deferring chat bootstrap until explicit Pesan entry, and deferring automatic push configuration/token refresh until Pesan or an existing explicit enable action.
- Existing global Auth/session identity lookup remains: Firestore `users/{usernameAuth}`, with `users/{pUserSafe.username}` fallback when necessary. This is shell-owned identity/access resolution, not operational statistics.
- After Pesan has explicitly been opened, its existing bounded messaging listeners may remain for notifications (`cahaya_app/pesan_dibaca/{user}`, `pesan_inbox/{user}` last 100, `notifikasi_user/{user}` last 100). Thus zero operational Home startup does not mean zero total traffic after the user has started messaging. Existing background push registration is not revoked.

## Navigation and feature ownership

| Home action | Existing target |
| --- | --- |
| Pendidikan | menu-dashboard-pendidikan → pimpinan/dashboard-pendidikan.html |
| Other eight divisions | pimpinan/dashboard-divisi.html?division={existing key}&view=executive&v=112 |
| Keputusan & Eskalasi | menu-keputusan-direktur → pimpinan/keputusan-direktur.html |
| Laporan | menu-raport-bulanan → supervisor/raport-bulanan.html |
| KPI / Supervisi card | menu-supervisi-terpadu → supervisor/command-center.html |
| Bottom KPI | Existing shell mapping, menu-kpi-guru → pendidikan/kpi-guru.html |
| Profil / Pesan | Existing menu-profil / menu-chat |

Division keys remain pendidikan, pembinaan, kesehatan, sarpras, keamanan, layanan, keuangan, dapur and media. The Kebersihan Lingkungan card uses the existing combined keamanan/kebersihan module; no new division data model is created.

Feature HTML renders inside the existing shell, then its existing requests execute. Returning Home does not invoke any feature load function. Home does not rewrite module-level fetching, error handling, formulas, writes, or filters.

## Hidden iframe audit

The shell already sends cahaya:suspend before parking and cahaya:resume on returning to cached frames. This mechanism is reused without changing Guru lifecycle code.

Inspected `pimpinan/dashboard-pendidikan.html`, `pimpinan/dashboard-divisi.html`, `pendidikan/kpi-guru.html`, `pimpinan/keputusan-direktur.html`, `supervisor/command-center.html`, `supervisor/raport-bulanan.html`, and `js/cahaya-workspace-core-v82.js` for recurring reads/listeners. Direct executive modules use one-shot requests; no onValue/value subscription or periodic analytics refresh was found needing detachment. Short toast-hide timeouts do not download data. Cached DOM and useful local state remain intact. Already-started one-shot requests may finish while hidden; this change does not cancel Firebase get/once promises or discard their results.

Home's role dialog closes on suspend. No Home data timer or listener exists to restart. Broader drill-down modules not reached by these Home routes were not exhaustively reworked.

## UI and identity

One local Home header (not a second shell), greeting/name/role hero, four executive quick links, nine division cards, management links and a static footer. The existing outer five-item bottom nav remains Jadwal | KPI | Beranda | Pesan | Lainnya. Scoped `.director-hub` styles cannot affect a Guru iframe.

Multazam is resolved from existing profile name/username/email, with generic Admin labels excluded. Profile photo and profile-sync message are reused. No identity write occurs. Other legitimate users keep their own display names rather than being renamed Multazam.

## Changed files

Root and matching /docs copies:

- home-direktur.html — remove dashboard boot/metrics and render navigation-only Home.
- css/director-home-hub.css — isolated responsive presentation.
- js/director-home-hub.js — local identity, existing role switching and navigation.
- main-dashboard.html — Director v202 route, local menu-config startup guard and shared script cache versions.
- js/pengurus-whatsapp-chat.js — extend existing lazy bootstrap guard to Director.
- js/cahaya-push-global-v68.js — extend existing deferred registration guard to Director.

This report is documentation-only. No operational feature page was edited.

## Verification and limitations

- Actual browser 409×720: hero and division-card screenshots inspected, readable two-column cards, no overlaps, normal scroll. Home body clientWidth and scrollWidth both 409. One shell bottom navigation.
- Fresh iframe script inspection: only director-home-hub.js?v=202.
- Node VM startup/suspend/resume with throwing Firebase accessor, fetch and timer hooks: passed; Admin Cahaya + multazam identity displayed Multazam.
- Browser flow passed: Guru role → Director, Home → Pendidikan → Home → KPI → Home → Kesehatan → Home. Detail shells appeared and loaded their existing content without blanking the application shell.
- Syntax checks for changed scripts and inline HTML passed; root/docs byte comparison passed; git diff whitespace check passed.
- SHA-1 before/after identical for home-guru.html, js/guru-home-hub.js, css/guru-home-hub.css, guru/absensiPembelajaran.html, guru/inputNilaiUjian.html and guru/gurumenulis.html. Guru Home was visibly rendered before switching role; its existing menu, identity and navigation remained intact. Full attendance/score write regression was not repeated because those files were untouched and production writes were intentionally avoided.
- No byte-accurate Firebase wire measurement was performed. Savings come from eliminating the entire Home request graph, not from a claimed percentage or payload estimate.
- Detail modules still have legacy broad reads (e.g. Supervisi reads observasi_lapangan twice). These occur only after explicit entry and were not changed under the preserve-feature-behavior constraint.
- Shared-shell pre-existing MutationObserver startup error remains outside this Home scope. Auth/network failures in existing detail modules are not masked with fake data.

Stop here: no Manager Pendidikan build and no Firebase rules deployment.
