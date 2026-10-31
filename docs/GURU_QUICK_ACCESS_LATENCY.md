# Guru quick access latency

2026-09-17. Scope: Jadwal Hari Ini and Izin / Sakit only. No UI redesign, rules deployment, schedule/allocation changes, or operational feature rewrites.

## Audit / root cause

Before: click rendered a local sheet with “Memuat…”, then loaded local helper scripts and imported guru-home-actions.js. That module statically imported Firebase SDK, so even cached local schedule rendering waited for SDK download/evaluation. It then awaited fastSchedule(), followed by a Promise.all of two Firebase reads. Only after both finished did the real schedule/list/stats render. Read errors were swallowed into empty objects, potentially presenting unavailable data as no attendance/leave.

Base schedule is local: data/jadwal-pelajaran-awal-2026-2027.json, with the existing cahaya_guru_schedule_v148 12-hour cache. K.identityFromProfile, K.assignedSchedule and Jakarta day filtering remain unchanged. No base schedule Firebase read is required. The shell's CahayaDataCache guru:schedule:2026-2027 is now also reused if present; the static file remains the fallback. Parallel first opens share one file request.

Important distinction: the quick-access teacher GPS attendance sheet did not previously load guru_berhalangan/replacement overlays. Those are owned by guru/absensiPembelajaran.html (today-only tanggal query, 60-second cache). This optimization does not transplant or change those schedule rules, merge teaching groups differently, or introduce a new overlay source. Current quick-access same-day updates are attendance status, not schedule reassignment.

Izin/Sakit is an existing read-only list, not a form. It uses today's scheduled classes and local student class mapping, then filters health and permits. Existing behavior when no classes are assigned, identity matching, date interval checks and status filters are unchanged.

## After sequence

1. Click: existing sheet/header/close control appear synchronously.
2. Load local actions/helper code on demand only. Actions module has no top-level Firebase import.
3. Reuse schedule cache or local file; render base schedule immediately. Izin/Sakit renders its actual list shell with an honest pending state or short-lived cached data.
4. Only now initialize/import Firebase and request sources concurrently.
5. Each source completion independently updates the affected panel. Schedule rows with identical markup retain their DOM; changed status rows alone are replaced.
6. Close/leave invalidates the existing render-generation predicate. Late results can populate bounded cache but cannot reopen/repaint a hidden panel.

Loading/error/cached states are distinct. Unknown attendance totals use “—”, not zero/absent. Incomplete leave data uses “data sebagian” or “—”; failed refresh does not become a successful empty list. Cached results are explicitly labelled. Firebase SDK get may itself return SDK-cached data; the UI says loaded, not guaranteed server-confirmed.

## Exact Firebase scope / request counts

All paths below are under cahaya_app. No write path changed.

| Feature | Before | After |
| --- | --- | --- |
| Jadwal | absensi_guru/{today}, entire date subtree; log_absensi_guru ordered by tanggal equalTo(today), last 250. Two reads every open; both awaited. | Same two sources on cold/expired open. Independently render results. Zero reads within 30 seconds; concurrent opens share two in-flight requests. |
| Izin/Sakit | izin_sakit_harian/{today}; perizinan_ringkas ordered by tanggalPengajuan from today−30 days through today, last 120. Health read each time; permits cache 120 seconds. Both awaited. | Same cold scope. Health cache 30 seconds; permits retains 120-second TTL. Within fresh TTL: zero reads. Only expired/failed sources are fetched, concurrent requests deduplicated. |

No entire historical attendance or perizinan node is downloaded. Current-day attendance remains date-wide for legacy teacher-key compatibility; no proven canonical alias/index migration was available to narrow it safely. Client matching is unchanged.

The 30-day permit window is **not a history screen**: older applications may still be active today. Filtering only today's submission date would drop valid multi-day permits. Existing schema lacks a verified teacher/class+active-date index. Therefore the bounded last-120 lookback is deliberately preserved, rather than claiming a safe query reduction that cannot be established. Existing limitations (permits older than 30 days or beyond the cap) are not silently fixed here. A separately approved active-permit index would be required to improve that scope without risking omissions.

Repository rules file firebase-rtdb-rules-cahaya-app-v20.json declares tanggal on log_absensi_guru and tanggalPengajuan on perizinan_ringkas. Date-node reads do not need an orderBy index. Deployed rules were not inspected or changed; an unindexed warning in deployment should be checked against these declarations, not addressed by downloading the whole node.

## Cache / lifecycle

- Base schedule: existing 12-hour local cache + optional shared shell cache; force-cache file fetch if absent.
- Operational cache: module memory, keyed by source and Jakarta date. No new persistent operational storage. Preview data older than 120 seconds is not shown.
- Freshness: attendance/health 30 seconds, permit 120 seconds (unchanged permit policy). Refresh happens on explicit open after expiry, not a background timer.
- Successful GPS attendance invalidates both current-day attendance source caches. Existing GPS validation, idempotent record check, payload, and write paths remain.
- No new realtime listener, polling, timeout-based refresh or hidden preload. In-flight SDK get cannot be cancelled; the existing visibility/generation guard suppresses stale rendering. Reopen can share those requests.
- Home resume itself does not call either feature. Explicit reopening reuses cache and refreshes expired data.

## Instrumentation / observed timings

js/guru-home-hub.js emits console.debug records prefixed [Guru quick access] with feature, stage and elapsed milliseconds from click. Stages: shell, local, first firebase, complete/error. This logs no identity/record contents and causes no requests. Shell/local timings measure synchronous DOM updates, not a guaranteed compositor paint event. Firebase timing includes lazy SDK startup plus SDK/network response; it is not a pure server latency measurement.

Observed local browser, 409×720, existing session/cache:

| Open | Shell DOM | Local DOM | First Firebase | Complete |
| --- | ---: | ---: | ---: | ---: |
| Jadwal first | 0 ms | 13 ms | 1291 ms | 1324 ms |
| Jadwal after cache expiry | 0 ms | 7 ms | 366 ms | 498 ms |
| Izin/Sakit first | 0 ms | 4 ms | 265 ms | 417 ms |
| Izin/Sakit immediate reopen | 0 ms | 5 ms | no new read | 7 ms |

These are individual observations, not latency percentiles or guarantees. Before-change timings were not instrumented: source inspection establishes that useful local content previously waited for SDK and both reads. No invented before/after network improvement percentage is claimed. Cold query scope is unchanged; improvements are removing the local-render dependency and eliminating repeat/in-flight reads.

## Checks

- Browser: Home → Jadwal, close → Jadwal; Home → Izin/Sakit, close/reopen repeatedly. Actual schedule and leave sheets inspected at 409×720 with existing styling and single bottom nav.
- tests/guru-quick-access.cjs: deterministic delayed reads prove local render precedes Firebase; concurrent opens produce only two reads; fresh cache produces zero; partial result plus simulated offline error is not an empty success; retry fetches only failed source; closing while pending prevents repaint; reopening after recovery reuses cache. No production network/writes in this test.
- Live OS/network disconnect was not performed. Slow/offline/reconnect behavior was simulated at the read boundary in the deterministic test.
- Syntax checks and root/docs byte equivalence passed; git diff whitespace check passed.
- Home still has no operational call on boot/resume. Firebase imports occur inside the explicit action path, after local render. No Home CSS/markup changed except the script cache version.
- Presensi, Nilai, shell navigation, Director, schedule data, roster data, Firebase configuration and rules were not edited in this task. GPS write payload/path remain the existing absensi_guru and log_absensi_guru paths. Production attendance/save actions were not tested by writing.

## Files

Root plus /docs mirror: js/guru-home-hub.js, js/guru-home-actions.js, home-guru.html (script version only).
Added: tests/guru-quick-access.cjs and this report.

Remaining latency: on first-ever click local helper scripts/static schedule still need to load if browser cache is cold; operational accuracy still depends on Firebase response. No preloading was introduced to conceal this. Reassignment overlays remain in their original Presensi feature, not newly added to the GPS quick panel.
