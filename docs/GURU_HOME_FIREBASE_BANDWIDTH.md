# Guru Home — zero operational download hub

Date: 2026-09-17. This user-approved Home redesign supersedes only the old Home dashboard presentation described in GURU_GOLDEN_BASELINE.md. Feature pages, assessment formulas, schedules, roster mapping, Firebase schemas and rules remain authoritative and unchanged.

## Before

The former home-guru.html imported Firebase and guru-kpi-v144.js during startup, then loaded dashboard evidence. Sources included:

- `cahaya_app/absensi_guru/{date}` and `cahaya_app/log_absensi_guru`, queried by date for the current week; the same day could also be revisited for the schedule panel.
- `cahaya_app/izin_sakit_harian/{date}` and `cahaya_app/perizinan_ringkas` for permission/health counts.
- KPI inputs: attendance logs, exam scores, Tahfiz, observations, calendar/material targets and completion records. These were needed only for the removed statistics, not for navigation.
- A current-day realtime attendance listener refreshed dashboard state.
- Home cached some requests, but cold Home visits still initiated operational queries; period fallback helpers could download broader nodes.
- Shell chat bootstrap could reach its timeout fallback and attach inbox/notification listeners even before Pesan was opened.
- Global push boot/pageshow could read `cahaya_app/pengaturan_notifikasi_web/vapidKey` and refresh token registration without feature intent.
- Cached iframe parking hid pages without a generic suspend notification. The writing page retained its article value listener; Presensi retained a date-sync timer.

## After: entry and data ownership

| Entry | Requests / behavior |
| --- | --- |
| Fresh Guru Home | **0 operational Firebase reads, 0 operational listeners**. Only local identity, static navigation, date formatting and local visual assets. |
| Return/resume Home | Refresh local identity only; no statistics refresh or automatic schedule query. |
| Jadwal click | Lazily import guru-home-actions.js and local schedule helpers. Read `absensi_guru/{today}` and date-filtered `log_absensi_guru` (limit 250), reusing the existing cache/in-flight mechanism. No weekly or KPI query. |
| Izin / Sakit click | Read today's `izin_sakit_harian` plus existing date-window `perizinan_ringkas` query (limit 120, cached). |
| Aktivitas | Static feature shortcuts; no query. |
| Materi | Static choice sheet first; selected existing feature owns its requests. |
| KPI / Nilai / Presensi / Tahsin / other feature | Navigate to the existing feature. That feature loads its existing sources only after entry. No hidden preload from Home. |
| Notification icon | Static link to Pesan, not an unread-count query. |
| Pesan explicitly opened | Existing chat bootstrap becomes eligible; existing push enable/registration can run. |

`?openSchedule=1` is an explicit schedule-navigation intent, not an ordinary Home render. Existing GPS attendance action and its location/read/write paths are retained inside the lazily imported actions module; merely viewing Home cannot execute them.

### Shell exception and intentional listeners

Firebase Auth/session restoration still belongs to the global shell. Its existing Firestore identity lookup is `users/{usernameAuth}`, with `users/{pUserSafe.username}` fallback if necessary. This is identity/access resolution, not operational dashboard data. No extra identity lookup was added by Home.

On a fresh Guru shell, chat no longer attaches inbox listeners through its timeout fallback. After the user explicitly opens Pesan, existing bounded messaging listeners may remain active for delivery/unread notifications: `pesan_dibaca/{user}`, `pesan_inbox/{user}` (last 100), and `notifikasi_user/{user}` (last 100), under `cahaya_app`. This intentional messaging exception does not preload Guru statistics. It means returning Home after explicitly starting messaging is not a guarantee of zero total network traffic.

Guru push configuration/token refresh is deferred until explicit Pesan entry or the existing explicit enable action. Existing registered service-worker background push is not revoked. Other roles retain their boot behavior. No notification subscription was toggled during testing.

## Lifecycle and cache

- Shell frame parking emits `cahaya:suspend` and a source/origin-verifiable suspend message before hiding the iframe. Existing resume behavior remains.
- Home closes transient panels and invalidates pending render generations on leave. A late response cannot reopen a hidden/closed sheet. No Home listener/timer remains.
- Presensi clears its existing 60-second date-sync timer while suspended and restores one timer on resume. AWAL/FINAL/FINAL_VIEW and all save semantics are unchanged.
- Tulis Materi detaches its article `value` listener while suspended and reattaches on resume. Editor DOM/state remains cached; listener startup is guarded against a late initialization while hidden.
- Existing one-shot feature requests already in flight may complete after navigation; Firebase get requests are not cancellable here. They are not new hidden subscriptions. No iframe is eagerly created to preload feature evidence.
- Query cache TTL and authoritative schedule matching in the extracted actions remain unchanged. Removing Home KPI/statistics requests is the main saving, not fabricated cached numbers.

## UI and identity

Home consists of the existing branding/profile/role contract, static greeting, three quick links, nine Guru feature cards, and a lightweight motivational footer. No fake counts, percentages or loading dashboard are displayed. The shell retains exactly `Jadwal | KPI | Beranda | Pesan | Lainnya`.

Display-name resolution uses the existing local/shell profile. A profile identifying Multazam through name/username/email displays Multazam rather than generic Admin/Admin Cahaya. This is presentation-only and does not write production identity.

## Files in this change

Root and matching /docs copies:

- `home-guru.html`: static Home, removes operational boot module.
- `css/guru-home-hub.css`: scoped Home layout only.
- `js/guru-home-hub.js`: identity, navigation and deferred feature entry.
- `js/guru-home-actions.js`: extracted existing schedule/leave/GPS actions, loaded on intent only.
- `main-dashboard.html`: Home v201 route and iframe suspend dispatch.
- `guru/absensiPembelajaran.html`: date timer suspension only.
- `guru/gurumenulis.html`: writing listener suspension only.
- `js/pengurus-whatsapp-chat.js`: fresh-Guru lazy bootstrap guard.
- `js/cahaya-push-global-v68.js`: Guru deferred automatic registration guard.

This audit document is documentation-only and has no second mirror. Existing unrelated dirty files were preserved. Nilai implementation was not edited in this task. No Firebase rules, data files or backend schema were modified.

## Verification

- Actual local browser render at 409 × 720: readable hero, identity Multazam, normal card proportions, scrollable two-column Menu Guru, no overlapping cards or horizontal page overflow; one outer bottom navigation.
- Fresh Home iframe script inspection found only `js/guru-home-hub.js?v=201`, with no imported Firebase/feature scripts.
- Isolated Node VM startup and suspend/resume test used a throwing Firebase accessor, throwing script-preload hook and throwing timer hook: passed without invoking any of them.
- Browser navigation checked Jadwal, KPI, Nilai, Presensi, Materi/Atur Target and Tahsin/Tahfiz, returning Home between features. Presensi retained combined Juz 1/Juz 2 and Al-Qur'an groups; existing target page retained combined contexts. No save, attendance or final-submit action was used.
- Syntax checks passed for changed JS and inline HTML scripts. Root/docs byte comparisons and git whitespace checks passed.

## Limitations / follow-up

This is a source-level request audit plus isolated startup guard and actual browser navigation/visual testing, not a byte-accurate Firebase wire-traffic measurement. No percentage saving is claimed. Production writes and full draft/final submission regression were deliberately not performed. Tulis Materi detach/reattach was source-reviewed; live database subscription traffic was not instrumented.

The browser console exposed an existing shell MutationObserver observe(null) error during boot; Home and feature routes rendered despite it. It is not fixed here because it predates the hub and broader shell repairs are outside scope.

The Home shell remains navigable with existing local session/assets offline; actual feature data still needs its normal network/cache support. Service-worker delivery and pre-existing browser caches can affect deployment freshness. No Manager Pendidikan work or rules deployment is included.
