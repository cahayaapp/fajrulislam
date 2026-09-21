# Role System V2 Phase 2B — route and assignment hardening

Date: 2026-09-17. **Verdict: NOT READY for production activation.**

This phase adds real entry guards and initial scoped consumers; it does not certify the remaining generic feature engines. No six-profile payload was applied. No profile, Wali child mapping, attendance/scoring/academic schema, authoritative business path or Firebase Rules was changed. No deployment/commit/reset was performed. Work present before this phase was retained.

## Centralized authorization

- js/role-route-registry-v2.js is the exact route→capability/readiness registry. Unknown routes fail closed for explicit canonical profiles. No external URLs, role-name substrings, legacy admin unions or caller-provided expected URL can grant a route.
- js/role-navigation-v2.js exposes canAccessRoute(session, route) and keeps decision() for the existing shell. loadPage/menu/quick links/bottom navigation therefore use the same decision as standalone pages. Role/unit/domain restrictions derive from the existing permission registry; generic scoped engines remain blocked until adapted.
- js/role-entry-v2.js runs synchronously before feature scripts/SDKs. A denied static HTML page consumes the remaining parser input as inert PLAINTEXT and renders an access-denied message and safe top-level Home link. An asynchronous redirect alone would not reliably stop following inline scripts, so it is not used as the initial guard. Do not change the entry script to async/defer.
- 122 root HTML entry points have the same small five-script hook, with 118 existing mirrors (240 guarded files total). Public login, 404 and the static revocation page are excluded; no docs-only hidden HTML entry was found. The legacy generic home.html is explicitly disabled for V2 so it cannot replace the approved zero-download Homes.
- Denials happen before Firebase initialization/reads, including direct iframe src navigation that bypasses loadPage. The original shell still destroys old role frames; other tabs revalidate local identity/assignment and replace the old document on storage/focus/pageshow changes.

## Assignment adapter

js/role-scope-v2.js supplies immutable window.cahayaRoleContext with activeRole, active assignment, unit, programDomain, allowedRoles, usrahIds and childName (read-only derived from namaAnak). No extra Firebase lookup. No global union of multiple roles' scope.

The adapter checks exact canonical actions and resource metadata, filters arrays only through explicit resource descriptors, loads assigned usrah child paths, and rejects stale contexts/results after a role or assignment switch. Manager/Supervisor data descriptors require the managed/supervised canonical role and unit; education additionally requires the correct explicit domain. A subject name cannot confer a domain. Counselor level configuration is centralized; no new PEMULA/MUDA privileges were invented. The legacy queue remains blocked rather than displaying unscoped data.

Implemented feature consumers:

1. **Absensi Program:** canonical NAQIB/NAQIBAH use assigned unit/usrah, not names. Exact master_usrah children only; no generic roster fallback. Forged selections and wrong roster members are rejected before original writes. The existing save-time daily health read remains broad and is documented as a B-level query gap.
2. **Mentoring Usrah:** assigned usrah roster paths and usrah-equality history queries, returned-record recheck, scoped selection/write validation. Existing payload/point/reward semantics untouched. Individual mentoring is not silently enabled by this adapter.
3. **KPI Guru:** canonical activeRole overrides stale legacy admin/current-role flags, and its teacher selector contains only the existing matched identity. Score calculation remains unchanged; broad historical reads still need query isolation.
4. **Shared workspace identity bridge:** active-only compatibility projection and current unit; no stale cahayaCurrentProfile grants over canonical context.

## Page and payload readiness

See ROLE_SYSTEM_V2_PAGE_READINESS.md for all routes, capabilities, assignments, path-reference audit, and exact reachable/pending/denied lists per prepared account.

| Classification | Pages | Meaning |
|---|---:|---|
| A | 17 | Local shell/Home/guide, existing child-scoped Wali engine, or integrated Mentor group consumer |
| B | 12 | Guarded existing all-scope/own-teacher flow or partial program adapter; query gaps remain |
| C | 48 | Scoped consumer needed; canonical restricted roles denied before reads |
| D | 45 | Unknown/unreviewed/admin/legacy Home; canonical access denied |

| Prepared account | Roles / default | Activation blocker |
|---|---|---|
| multazam | DIREKTUR + GURU_PONDOK / DIREKTUR | Guru reporting/shared scoped routes and query certification remain incomplete; strategic Director routes retain existing ALL policy |
| donisetiawan | SUPERVISOR + KONSELOR / SUPERVISOR | Assigned education/care/media consumers and Counselor unit-scoped joins/detail/actions pending |
| bennyarizona | SUPERVISOR / SUPERVISOR | Assigned service/health/Sarpras consumers pending; Pendidikan denied |
| zaky | MANAJER + GURU_PONDOK / MANAJER | Manager education evidence adapters pending; PKBM denied |
| favian | NAQIB / NAQIB | Attendance roster scoped; reports/initiative/assessment/history still pending; save-time daily health query gap |
| kamal | NAQIB / NAQIB | Same as Favian |

All assignments/defaultRole values and the six prepared patch payloads are unchanged. Their validity is not equivalent to feature readiness. Older migration-report statements that standalone entry guards are missing are superseded by this phase; the scoped-consumer and release blockers remain.

## Verification

- 19 existing canonical role/assignment contracts pass.
- New route/scope matrix passes: supervised areas, Manager Kepondokan vs PKBM, Guru PKBM domain, Naqib/Naqibah units, Counselor units/levels, explicit Mentor usrah, existing Wali name, immutable role-specific assignments and late-result rejection. These helper tests are not claimed as integration of blocked pages.
- Chromium 409×720 direct URL matrix: 12 denied cases, **0 Firebase initializations/reads/writes**, including docs mirror, older login HTML, old legacy admin grants, spoofed query params, wrong role and invalid assignment. Direct iframe bypass is tested separately. Access-denied screen inspected.
- Actual Naqib/Naqibah module fixture: loads only assigned usrah children; malicious other-unit pick cannot change roster; original attendance + wali_index paths used by mock writes; role change in another tab revokes the old document.
- Actual Mentor module fixture: only Usrah 3 roster/history appears; wrong returned history filtered; forged Usrah 7 submission rejected; original mentoring_usrah mock write checked.
- Home tests: Guru, Director, Naqib and Naqibah remain 409px wide with no horizontal overflow, one bottom navigation, no page errors, and **0 operational Firebase reads**. Only existing shell users/fixture identity read. Role switches dispose old frames.
- Wali legacy and canonical akbar308-shaped account: same normal login destination and namaAnak, same child academic index, unrelated record excluded. Zero production writes. This is a fixture regression based on the previously inspected real account shape, not an impersonated parent login.
- SHA-256 approval snapshots verify Guru/Director/Naqib Home, Presensi, Nilai and Wali engine unchanged except parser hooks; Wali HTML differs only by hook and terminal newline. Existing feature markup/styles were not redesigned.
- Root/docs JS and adapted HTML byte-equivalence, entry coverage, classic/modified-inline JS syntax and git diff --check pass. No frontend build manifest exists. Existing quick-access regression passes (its offline warning is intentional).
- Readiness diagnostic deliberately exits **2 / NOT READY** because required pages are still incompatible. Do not relabel this as a fully passing production activation test.

All browser network access to external services is intercepted. Mock writes are test-memory assertions only; no production read/write was needed in Phase 2B. During test development a docs-mirror adapter insertion error was detected and fixed; final mirror/runtime checks pass.

## Files changed in this phase

- New JS: role-route-registry-v2.js, role-entry-v2.js, role-scope-v2.js and mirrors.
- Updated central router: role-navigation-v2.js and mirror.
- New static role-access-denied.html and mirror.
- Entry hook only in 122 existing root pages and their existing mirrors, except the three data-consumer changes below; main-dashboard.html also removes its duplicate old role-system/navigation imports. Frozen Home/Presensi/Nilai bodies unchanged.
- Feature/bridge changes: naqib/absensi.html, pembinaan/mentoring-usrah.html, pendidikan/kpi-guru.html, js/cahaya-workspace-core-v82.js and mirrors.
- Tests: role-v2-hardening.cjs, role-v2-entry-guards.cjs, role-v2-protected-source.cjs; updated role-system-v2.cjs, role-v2-production-readiness.cjs, Wali browser test diagnostics.
- Audit tools: role-v2-entry-coverage.cjs (read-only check / prints patch), role-v2-readiness-report.cjs (read-only inventory).
- Reports: this file, ROLE_SYSTEM_V2_PAGE_READINESS.md, ROLE_SYSTEM_V2_FIREBASE_RULES_GAPS.md; historical audit/migration report annotated to point here.

## Exact remaining gates

1. Scoped read/selection/write consumers for the six users' required Counselor, Manager/Supervisor and Naqib reporting/initiative/assessment/history features.
2. Narrow remaining broad data requests (notably Guru/KPI and daily-health attendance lookup) and verify explicit source-domain/unit metadata; no inferred Putra fallback.
3. Confirm release/cache/session rollout and verify deployed app entry coverage before account activation.
4. Server-side security remains separate: client guards cannot secure manipulated clients, public static rosters or direct SDK requests. Recommendations are in ROLE_SYSTEM_V2_FIREBASE_RULES_GAPS.md. No Rules changes are deployed.

Stop here as requested. No production activation, user-management redesign or new role feature development.
