# Role System V2 Phase 2 — safe production preflight

Phase 2B update (2026-09-17): the standalone URL guard gap below has been fixed and tested with zero-read denials. Absensi Program and Mentoring Usrah have initial scoped consumers. Other required adapters are still incomplete, so activation remains **NOT READY**, with zero production mutations. Current evidence and blockers: ROLE_SYSTEM_V2_PHASE2B.md, ROLE_SYSTEM_V2_PAGE_READINESS.md, ROLE_SYSTEM_V2_FIREBASE_RULES_GAPS.md.

Date: 2026-09-17. **Status: BLOCKED BEFORE ACTIVATION, not a completed migration.** Current work was continued after interruption; existing foundation and approved Home work were preserved.

## Production changes

**Zero user/profile writes, zero business-data writes, zero Rules changes, zero deployments.** No legacy field was removed. No account was created, renamed, merged, or deleted. No current production role was changed.

The authenticated read-only inventory found 184 Firestore `users` documents in project `absensi-santri-fajrul-islam`; all remain noncanonical. It contains 39 non-Wali and 145 Wali profiles. Actual document IDs and status categories are in `ROLE_SYSTEM_V2_USER_MAPPING.md`. Six confirmed staff patch payloads are prepared in `tools/role-v2-confirmed-plan.json` but **not applied** or referenced by application runtime.

## Why activation is blocked

1. **Direct-route guard test fails.** In an isolated browser with canonical GURU_PONDOK, navigating directly to `admin/users.html` still calls `Firestore users.get()`. No console error, redirect, or guard prevents that read. All requests in this diagnostic use mocks; no production user list was read as that fixture. The source page itself has no V2 entry guard. Hiding admin menus in the shell is not sufficient.
2. **Working scoped features would be lost.** The foundation deliberately refuses unadapted Naqib, Counselor, Supervisor and Manager detail routes. For example, confirmed Favian's NAQIB session receives `ASSIGNMENT_ADAPTER_REQUIRED` for `naqib/absensi.html`. Enabling the profile now would keep the approved Home but disable current attendance/reporting workflows. Granting those pages broad legacy access instead would violate assignment scope.
3. **Release/session rollout not verified.** This working tree contains local foundation code and pre-existing work. Production clients and cached profile sessions have not been upgraded/invalidated or verified. Writing canonical fields alone does not prove every client uses them as authority.

These are implementation readiness gates, **not a request to broaden anyone's roles or to replace Wali child links**. Enabling all confirmed profiles despite these gates would not meet the requested safe-migration acceptance criteria. Further scoped-consumer/entry-guard integration is required before production application; no new role UI should be built to do that.

## Confirmed payloads and unresolved assignments

- Multazam / `multazam`: DIREKTUR + GURU_PONDOK, default DIREKTUR. Director ALL; Guru KEPONDOKAN.
- Dony / `donisetiawan`: SUPERVISOR + KONSELOR, default SUPERVISOR. PUTRA supervising GURU_PONDOK, NAQIB, KONSELOR, MEDIA; counselor PUTRA/MUDA. No current local schedule/master assignment supports the conditional Guru role, so it is omitted. Existing unversioned UTAMA legacy metadata is not silently converted; current user explicitly confirmed MUDA.
- Benny / `bennyarizona`: SUPERVISOR, default SUPERVISOR. PUTRA supervising DAPUR, SARPRAS, KESEHATAN, LAYANAN_KEBERSIHAN; no Pendidikan.
- Zaky / `zaky`: MANAJER + GURU_PONDOK, default MANAJER. Manager PUTRA/GURU_PONDOK/KEPONDOKAN; Guru KEPONDOKAN; no PKBM.
- Favian / `favian`, Kamal / `kamal`: NAQIB, default NAQIB, unit PUTRA.
- Dini / `diniindriani`: SUPERVISOR PUTRI confirmed, **supervisedRoles missing**.
- Dandy: confirm account `dandi`. Production profile does not establish KONSELOR or its level. The local name override cannot supply that authority.
- Khaizuran: choose the intended production account among `khaizuran`, `regen` (label Khaizuran), `adekhaizuron` (label Naqib Ade Khaizuran). No merge/reassignment performed.
- Mentor usrahIds and other unconfirmed role assignments remain untouched. Generic Guru is never globally converted; the report separates exact PKBM registry evidence from ambiguous cases.

## Wali correction implemented

The previous WALI_SANTRI studentIds requirement is cancelled. **`users/{username}.namaAnak` is the verified production relationship** (145/145 Wali accounts); 16 also have `namaSantri`. Existing login, Portal Wali session keys, child-name normalization, `wali_index` paths and features remain authoritative.

V2 derives the child assignment from the existing profile, ignores competing child mappings in assignment metadata, and retains the old standalone Wali login destination. No child relationship is copied to Firebase assignments and no Wali production record is modified. No manual reassignment is requested for these 145 valid accounts. See `ROLE_SYSTEM_V2_WALI_LINK.md` for exact code/data flow and limitations.

## Test results

| Check | Result / scope of evidence |
|---|---|
| Canonical registry / role switching / assignment isolation | PASS: 19 unit contracts in `tests/role-system-v2.cjs`. No Firebase network. |
| Dony/Benny/Zaky scoping equivalents | PASS registry fixtures: assigned areas only, Putra vs Putri separated, Pondok manager cannot read PKBM. Actual operational page adapters remain blocked, not falsely marked integrated. |
| NAQIBAH, Counselor, Mentor, Wali | PASS resource contract fixtures: Putri scope, counselor unit, assigned usrah, existing Wali child name. |
| Multi-role browser switch | PASS existing 409×720 browser tests: active assignment changes, previous role iframes disposed, forbidden/spoofed shell route denied; only newly selected Home loads. |
| Approved Home regression | PASS Guru, Director, Naqib, Naqibah: no operational reads/listeners, only existing `users/fixture` identity lookup; one bottom nav; no horizontal overflow; no page errors. No Home source/style files redesigned. |
| Existing Wali account regression | PASS isolated old and V2 `akbar308` profile fixtures: same login destination, child identity, academic index path, own-child record visible, unrelated record filtered. Core session tests also cover prior-account cache and conflicting assignment metadata. Not a live parent login. |
| Direct standalone URL | **FAIL — production activation blocked**. GURU_PONDOK fixture reaches `admin/users.html` and reads mocked `users`. |
| Naqib attendance after canonical activation | **NOT READY**. Router denies until assignment adapter exists. No production account activated into this incomplete workspace. |
| Firebase Rules enforcement | NOT TESTED/NOT DEPLOYED. Client checks are not server security. |

Commands:

```sh
node tests/role-system-v2.cjs
node tests/wali-role-v2.cjs
node tests/naqib-home-zero-download.cjs
node tests/guru-quick-access.cjs
NODE_PATH=/Users/haimac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/role-system-v2-browser.cjs
NODE_PATH=/Users/haimac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/wali-role-v2-browser.cjs
NODE_PATH=/Users/haimac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/role-v2-production-readiness.cjs
```

The last diagnostic intentionally returns exit code **2** while readiness is false; it must not be counted as a passing security test. All browser tests block external network traffic and prohibit Firebase writes. `guru-quick-access` intentionally logs a simulated offline error while its assertions pass.

## Files added/changed in Phase 2 and the Wali correction

New:

- `tools/role-v2-profile-audit.html`: localhost-only, authenticated, explicit-click read-only inventory; role-field allowlist, optional existing Wali-link fields. No write methods. Not linked from application UI and not mirrored into `/docs` hosting.
- `tools/role-v2-confirmed-plan.json`: six reviewed candidate staff payloads and three unresolved identity/assignment groups. Unapplied; no executable writer.
- `tests/role-v2-production-readiness.cjs`: reproducible negative direct-URL and scoped-route diagnostic.
- `tests/wali-role-v2.cjs`, `tests/wali-role-v2-browser.cjs`: existing Wali relationship regression.
- This report and `docs/ROLE_SYSTEM_V2_WALI_LINK.md`.

Updated:

- `js/role-system-v2.js` and mirror: read-only existing-child adapter; Wali validation no longer requires IDs; existing portal Home route.
- `index.html` and mirror: retain existing Wali login destination for active canonical Wali.
- `main-dashboard.html` and mirror: Wali Home goes to its existing standalone portal, not a nested second shell.
- `tests/role-system-v2.cjs`: superseded Wali-ID assertions corrected.
- `docs/ROLE_SYSTEM_V2_AUDIT.md`, `docs/ROLE_SYSTEM_V2_USER_MAPPING.md`: actual production evidence, statuses, correction and blockers.

Earlier foundation/shared-shell/Naqib work is preserved. `wali/dashboard/*`, Guru/Director/Naqib Home source/styles, academic/attendance pages, schedules, allocations, master data, Firebase config and Rules were not changed by Phase 2. No commit/reset/revert was performed.

## Required later Firebase Rules/security work — recommendation only

1. Restrict profile role/assignment updates to an independently authorized account-management authority; clients must not grant themselves roles. Define exact field write allowlists. Retaining legacy fields does not mean granting their union.
2. Bind profile identity to Firebase Auth and prevent broad user-directory access for unrelated roles. App localStorage is not trusted identity at the database layer.
3. Enforce supervisedRoles/managedRoles, unit and programDomain at relevant existing read/write paths; deny PKBM under GURU_PONDOK/Kepondokan management.
4. Enforce counselor unit/action policy and assigned Mentor usrah boundaries server-side.
5. For Wali, validate against the **existing** profile child relationship and existing name-derived index keys. Account for legitimate legacy name aliases and possible duplicate child names; do not invent studentIds or a duplicate link system in this phase.
6. Verify existing database Rules against emulators/fixtures for direct SDK calls, not only menu visibility. Firestore Rules source/deployed enforcement was not established here; repository RTDB Rules are not proof of deployed Firestore authorization.

No Rule change is required merely to document the Wali correction, and none was made. Rules hardening remains separately approved work.

## Safe application procedure once blockers are resolved

Re-read each exact user document and review newer role changes. Create a private backup with only the role fields affected plus version/precondition metadata (not credentials or the whole public user database). Verify the production client release and session refresh behavior. Apply the four approved canonical top-level fields via an authenticated, preconditioned transaction/update; retain every legacy/identity/child field. Read back the exact fields and test the actual user's default, switches, authorized feature access and denied direct routes. Process only fully ready users; incomplete profiles stay compatibility. Do not silently use a partially working V2 launch as the migration result.

Next decision required: prioritize the missing standalone entry guards and scoped feature consumers before account activation, plus the three outstanding assignment/identity confirmations. Wali-child reassignment is **not** among those confirmations.
