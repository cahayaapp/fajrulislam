# Role System V2 — foundation and migration audit

Phase 2B update (2026-09-17): centralized standalone/iframe entry guards and initial assignment consumers are now implemented. Read ROLE_SYSTEM_V2_PHASE2B.md and ROLE_SYSTEM_V2_PAGE_READINESS.md for current coverage and the **NOT READY** activation verdict. The foundation-only route limitations below are historical; production remains unmigrated.

Date: 2026-09-17. Foundation audit retained below. Production migration was subsequently authorized, but preflight found blocking standalone-route and scoped-consumer gaps. No production write has occurred. See `ROLE_SYSTEM_V2_PRODUCTION_MIGRATION.md` and the current user mapping report.

**Authoritative correction:** WALI_SANTRI keeps the existing production `users/{username}.namaAnak` relationship and the existing Portal Wali login route. `studentIds` is NOT required or introduced for Wali. The V2 adapter derives its child scope from the existing profile, without persisting another mapping. See `ROLE_SYSTEM_V2_WALI_LINK.md`.

## Existing architecture (before V2 integration)

- `index.html`: Firebase Auth login followed by Firestore `users/{username}`; the profile is cached as `cahayaCurrentUser`. Missing legacy profiles use username-based fallback roles. This fallback must never assign canonical roles.
- `admin/users.html`: edits `workspaceAssignments`, `workspaceRoles`, `akses`, `jabatan`, `role`, `operationalAssignments`, `allowedMenus`, and `defaultWorkspaceRole`. **Its field `roleAssignmentsV2` contains legacy assignments, not this canonical V2 model.** Do not interpret the field name as migration approval.
- `config/team-roles-v191.js`: local name/alias-based overrides, including an ALL list for Multazam and Dini. These are evidence for a migration report, not authority to assign new roles or scope by name.
- `main-dashboard.html`: multiple role alias tables, compatibility grants, DEFAULT/CORE menu tables, `settings/role_menus`, per-user `allowedMenus`, role-sensitive Home routing and iframe caching. Legacy `semua-peran` combines access. V2 must resolve one active role instead.
- Legacy state: `cahayaCurrentUser`, `cahayaCurrentProfile`, `cahayaActiveRole`, `cahayaCurrentRole`, `activeRole`, `cahayaRoleMenuRulesCache`. Feature pages read different subsets. V2 gets a separately named active-role key and preserves the existing session/authentication.
- `js/cahaya-workspace-core-v82.js`, `js/pengurus-whatsapp-chat.js`, `konselor/daftar-kasus-baru.html`, `pembinaan/mentoring-individu.html`, and many feature pages contain legacy role parsing. A new central registry alone does not make these pages enforce assignment scope.
- `wali/dashboard/index.html` uses its existing child/account lookup. It must NOT be changed to consume a new `assignments.WALI_SANTRI.studentIds` mapping.

## Approved Home contracts

Read before implementation: `docs/GURU_GOLDEN_BASELINE.md`, `docs/GURU_HOME_FIREBASE_BANDWIDTH.md`, `docs/GURU_PERFORMANCE_AND_STATE.md`, `docs/DIRECTOR_HOME_FIREBASE_BANDWIDTH.md`, and `docs/NAQIB_HOME_FIREBASE_BANDWIDTH.md`.

The approved `home-guru.html`, `home-direktur.html`, `home-naqib.html`, their `css/*-home-hub.css` and `js/*-home-hub.js` retain their presentation and static menus. NAQIBAH reuses the Naqib Home with a separate PUTRI assignment. The shell remains the owner of the only bottom navigation. Homes cannot load operational data to resolve roles.

## Migration boundary

Canonical profiles require an explicit `roleSystemVersion: 2`, a canonical `roles` array, and role-keyed `assignments`. Legacy profiles remain on their existing compatibility route until reviewed. Invalid explicit V2 profiles fail closed; they cannot fall back to legacy admin/access grants.

V2 permissions use exact IDs. Assignment data is independent per role; Manager `managedRoles`, Supervisor `supervisedRoles`, Mentor `usrahIds`, and Counselor `level` + `unit` are required where relevant. Wali uses its pre-existing child-name profile field instead of new studentIds. No manager/supervisor permission is inferred from a username or a generic division string.

Client navigation and resource guards are not server security. Firebase Rules remain unchanged. A scoped V2 role must not enter a legacy page that has not been adapted to its assignment. The foundation will explicitly mark these routes as requiring an adapter, rather than claim menu hiding secures their Firebase queries. Existing legacy assignments are not migrated automatically.

## Legacy aliases and cleanup plan

Canonical migration suggestions are centralized in `js/role-system-v2.js`. Generic Guru requires an explicit PKBM/KEPONDOKAN domain. Generic Mentor requires confirmation that it means Usrah and explicit usrah IDs. Counselor rank is metadata, not a role; legacy Utama has no approved V2 level. Admin, observer, ALL, hybrid strings and unsupported organizational functions are unresolved.

After account assignments and feature adapters are approved and verified, remove: the v191 name-based overrides; shell normalisasiRole/compatRolesForWorkspace tables; DEFAULT/CORE legacy menu unions; legacy role_menus reads and cache; semua-peran; per-page string/regex authorization; old active-role storage keys; and compatibility profile projection. Do not remove them while legacy users still rely on them.

## Implemented canonical foundation

`js/role-system-v2.js` is a local, synchronous module with no SDK, fetch, database listener, or write. Its 15 exact IDs are GURU_PONDOK, GURU_PKBM, NAQIB, NAQIBAH, KONSELOR, MENTOR_USRAH, MANAJER, SUPERVISOR, DIREKTUR, KESEHATAN, LAYANAN_KEBERSIHAN, DAPUR, SARPRAS, MEDIA, WALI_SANTRI.

- `ROLE_PERMISSIONS` owns menu and action permissions. Exact comparisons replace legacy inference on the V2 branch. The canonical branch returns before the legacy DEFAULT/CORE unions, role_menus query, allowedMenus inheritance, or PKBM name matching.
- `resolveSession()` selects a role from the authenticated/local profile's explicit canonical list. The session has `activeRole` and `activeAssignment`; old `activeScope` is an API compatibility alias for the same assignment, never a global scope union.
- `switchRole()` rejects unassigned roles, switches assignment, and records `cahayaActiveRoleV2` together with `cahayaRoleUserV2` so a previous account's preference does not choose the next user's role. Default role remains profile metadata, not a changed Firebase field.
- `assignmentFor()` supplies only intrinsic defaults: NAQIB=PUTRA, NAQIBAH=PUTRI, Guru Pondok=KEPONDOKAN, Guru PKBM=PKBM. Conflicting explicit values are rejected, not silently converted.
- `validateAssignment()` requires Manager managedRoles/unit/domain, Supervisor supervisedRoles/unit, Mentor usrahIds, Counselor level/unit, and Wali's existing child-name link. Generic divisionIds do not grant a Supervisor or Manager an area.
- `authorize()` and `filterResources()` check action plus active assignment. Resource metadata is required; missing restricted unit, usrah or student identifiers cannot accidentally pass a filter. Manager/Supervisor resources must identify the managed canonical role. Arrays and assignments are frozen to prevent accidental scope mutation.
- `projectLegacyProfile()` is the outbound compatibility boundary. Existing feature readers receive only the active legacy role and active assignment; old workspace/operational assignment arrays are cleared in this local projection. The canonical roles/assignments remain available to V2. This projection is local/session-only, not a Firebase migration.

### Shell and login

`index.html` retains its existing authentication and profile read. Explicit staff V2 profiles go through the shell. Following the Wali correction, active WALI_SANTRI goes directly to the same existing Portal Wali as legacy accounts; no nested staff shell or replacement child lookup. Legacy login targets remain unchanged. The legacy editor's `roleAssignmentsV2` does not activate V2.

`main-dashboard.html` bypasses name-based team grants for V2 profiles. Approved Home mapping is Guru Pondok→home-guru, Director→home-direktur, Naqib/Naqibah→home-naqib. The existing Home role controls are connected by the shell to the canonical selector; a single-role profile opens no selector. NAQIBAH uses the same Home with its chip labeled Naqibah. No second navigation or authentication session is created.

Other V2 roles enter a minimal shared `role-workspace.html` foundation/guide page while their scoped feature adapters are pending. This is not a redesigned Manager application. `js/role-guide-v2.js` is a local reusable role guide, available through Panduan Kerja. The approved Naqib Home's existing guide and menus remain untouched.

On canonical role/active-assignment change the shell sends suspend and disposes previous role frames, clearing the in-memory shared cache. This stops their SDK listeners/timers even when old pages lack complete suspend handlers. Normal same-role feature navigation keeps the existing frame cache. **Unsaved transient feature form state is not preserved across role switches; save before switching.** No form data is automatically written to compensate.

Messaging's privilege check now uses only the canonical active role. Existing account-level inbox notifications may remain after explicit Pesan entry; these are shared identity messaging, not a hidden role dashboard. Fresh V2 shells defer automatic chat and push startup until explicit use.

## Scoped route readiness — production rollout limitation

The registry/resource adapter contract is tested. **This is not a completed migration of all legacy feature queries.** `js/role-navigation-v2.js` validates menu permission and expected route before creating an iframe, rejects external/spoofed URLs, and returns `ASSIGNMENT_ADAPTER_REQUIRED` for unadapted scoped pages. The shell displays a local unavailable message rather than starting their broad legacy queries. Existing legacy profiles are unaffected.

| Route family | V2 status |
|---|---|
| Approved Guru, Director, Naqib Home | Connected; static menus and zero-download preserved. NAQIBAH shares Naqib engine. |
| Guru Pondok core academic routes | Existing own-teacher/Kepondokan behavior reused, without changing schedule/roster. Additional explicit unit/student/usrah restrictions require an adapter before those routes open. |
| Director routes | Existing unrestricted strategic policy, including the existing nine division routes. Menu/path validation still applies. |
| Manager/Supervisor detail data | Menu visibility derives from managedRoles/supervisedRoles. Legacy broad detail pages are held pending assignment-aware query/filter adapters. |
| Naqib/Naqibah detail data | Approved Home menus remain. Detail activation for V2 awaits PUTRA/PUTRI and optional program/student scope adapters; no production Naqib account is migrated in this task. |
| Counselor case queue | Level/unit model is ready. Existing queue is not yet a canonical unit-filter consumer; held pending adapter. No new rank action policy invented. |
| Mentor | Usrah resource filter tested; legacy mentoring page awaits query/filter integration. |
| Wali | Existing namaAnak link adapted read-only; original Portal Wali login and feature engine preserved. No studentIds conversion. Fixture regression covers existing child/index and rejection of unrelated records. Server Rules review remains separate. |
| PKBM | Separate role/domain, no access to Pondok academic routes. Dedicated scoped route adapter pending. |
| Other operational roles/profile/reporting pages | Registry ready; pages not reviewed for assignment enforcement remain held pending adapters. |

Direct route tests refer to the **shell router**, including spoofing an allowed menu with a forbidden URL. Arbitrary standalone legacy HTML URLs have not all been converted to the V2 guard. Existing Firebase Rules remain the ultimate data boundary. Menu/resource checks do not secure a malicious client, and this foundation must not be presented as new server-side access control. Review and integrate scoped readers/writers and server authorization before production migration.

## Network audit

- New role/assignment resolution: **0 Firebase reads, 0 writes, 0 listeners**.
- V2 shell skips `settings/role_menus` entirely; static permissions supply its menus.
- Browser instrumentation found the old finance settings bootstrap reading `cahaya_app/keuangan/pengaturan_modul` from the shell. `keuangan/finance-settings.js` now honors the shell's `data-role-v2-lazy` attribute for explicit V2 profiles only. Local settings remain available; finance feature load/save and its path are unchanged. Legacy profiles retain their old bootstrap behavior.
- Four isolated Home tests (Guru Pondok, Director, Naqib, Naqibah) recorded only the existing Firestore `users/fixture` identity lookup, no RTDB reads/listeners, no Home iframe reads, and no writes.
- Role switching does not fetch settings or preload other roles' feature pages. Features with pending assignment adapters start no operational reads.
- Production wire traffic and production writes were not tested. All browser external requests were blocked and Firebase was replaced with instrumented fixtures.

## Tests and visual verification

- `node tests/role-system-v2.cjs`: 19 contract tests, including all requested role cases and the nine assignment scenarios, legacy ambiguity, invalid profiles, cross-account selection, active-only projection, login routing, and direct shell route denial.
- `tests/role-system-v2-browser.cjs`: isolated Chromium at 409×720 for the three approved Homes plus shared NAQIBAH, multi-role switching, single-role selector behavior, old iframe disposal, no horizontal overflow, one bottom navigation, zero operational reads/writes, and no page errors.
- Screenshots inspected: `/tmp/role-v2-guru_pondok.png`, `/tmp/role-v2-direktur.png`, `/tmp/role-v2-naqib.png`. Hero, quick access, spacing and bottom navigation retain approved presentation.
- Existing `tests/naqib-home-zero-download.cjs` and `tests/guru-quick-access.cjs` pass. The latter intentionally logs a simulated offline error while verifying retry behavior.
- Guru Home, Director Home, their CSS/JS, Presensi and Nilai source files have no diff. Naqib Home/CSS/JS were already untracked approved work at task start and were not edited here.
- Syntax checks cover new JS, affected shared JS and inline shell/login scripts; root/docs mirrored files are compared byte-for-byte. No build/package manifest exists for this static application.

## Files changed by this foundation

Root + `/docs` copies: `index.html`, `main-dashboard.html`, `js/role-system-v2.js`, `js/role-navigation-v2.js`, `js/role-guide-v2.js`, `role-workspace.html`, `js/pengurus-whatsapp-chat.js`, `js/cahaya-push-global-v68.js`, `keuangan/finance-settings.js`.

Documentation: this audit and `docs/ROLE_SYSTEM_V2_USER_MAPPING.md`. Tests: `tests/role-system-v2.cjs`, `tests/role-system-v2-browser.cjs`.

The pre-existing Naqib Home files/report/test and earlier shared-shell changes remain in the worktree. No commit, reset, account update, data migration, rules deployment, or new Naqib feature was performed.

## Exact source files inspected

`index.html`; `main-dashboard.html`; `admin/users.html`; `config/team-roles-v191.js`; `config/master-data.js`; `config/tenant-config.js`; `home-guru.html`; `home-direktur.html`; `home-naqib.html`; `js/guru-home-hub.js`; `js/guru-home-actions.js`; `js/guru-kpi-v144.js`; `js/director-home-hub.js`; `js/naqib-home-hub.js`; `js/cahaya-workspace-core-v82.js`; `js/cahaya-config-runtime.js`; `js/cahaya-responsive-v24.js`; `js/cahaya-push-global-v68.js`; `js/pengurus-whatsapp-chat.js`; `keuangan/finance-settings.js`; `guru/absensiPembelajaran.html`; `guru/inputNilaiUjian.html`; `naqib/absensi.html`; `konselor/daftar-kasus-baru.html`; `pembinaan/mentoring-individu.html`; `wali/dashboard/index.html`; the five baseline/bandwidth documents listed above; `tests/guru-quick-access.cjs`; `tests/naqib-home-zero-download.cjs`; new foundation files and their mirrors. Inspection included targeted searches for several large legacy modules, not a line-by-line audit of every feature.

Recommended next phase: confirm the account/assignment mapping, then adapt scoped data consumers one route family at a time with fixture tests before activating canonical profiles. Only afterward remove old compatibility branches. No new role Home redesign is needed for this step.
