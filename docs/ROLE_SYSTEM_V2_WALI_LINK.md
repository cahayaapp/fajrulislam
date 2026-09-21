# Wali Santri — preserve the existing production child relationship

Date: 2026-09-17. This correction supersedes every earlier suggestion to require or migrate Wali accounts to `studentIds`.

## Authoritative field and evidence

- Production project: `absensi-santri-fajrul-islam`.
- Source: Firestore `users/{username}`.
- **Primary child-link field: `namaAnak`.** Authenticated server-only read of `users.where('akses','array-contains','wali')` returned 145 accounts at `2026-09-17T06:49:47.395Z`.
- All 145 have nonempty `namaAnak`; 16 also have `namaSantri`. None is missing the existing name relationship. No manual reassignment is needed for these accounts.
- Representative existing record: `users/akbar308`, akses `[wali]`, `namaAnak: "AKBAR PRAYOGA"`. This is a verified profile, not a guessed username-to-child match.
- `wali/dashboard/script.js:studentNameFrom()` prioritizes namaAnak, namaSantri, namaAnanda, studentName, anak, then its existing local profile fallbacks. `ready()` refreshes the same Firestore user document and preserves the legacy local relationship when a remote field is missing.

No Wali production profile was modified. No child mapping was copied into another Firebase location. No new field, schema, Rule, or account was created.

## Unchanged login/session/data flow

```text
Existing Firebase Auth login
  → Firestore users/{username} (including existing namaAnak)
  → cahayaCurrentUser
  → wali/dashboard/index.html?v=20260820-v70
  → CahayaWaliSession.ready()
  → cahayaWaliAccount + cahayaWaliStudentProfile (existing local session keys)
  → existing Wali features
```

`CahayaWaliSession.readRTDB()` already maps operational sources to `cahaya_app/wali_index/{existing-normalized-child-name}/{category}`. It preserves canonical-name and legacy-name key fallback, bounded last-record reads, and the existing cache. Academic data still uses `.../nilai_bulanan`; attendance, assessments, permits, cases and other categories retain their existing index mapping. No new student ID path is introduced.

## V2 adapter

- `existingWaliChildLink(profile)` in `js/role-system-v2.js` reads the existing name fields in the portal's priority order and preserves the chosen field/value.
- For WALI_SANTRI, `adaptUser()` derives activeAssignment from the account profile, not from `assignments.WALI_SANTRI.studentIds` or a second stored name. A conflicting assignment name cannot override the profile's relationship.
- `validateAssignment()` checks the existing link; it does not require studentIds. The generic empty studentIds array in the shared in-memory scope shape is not a stored Wali mapping and grants no child access.
- `authorize(...,'student.read',resource)` matches the existing linked child. In Portal Wali it reuses `CahayaWaliSession.namesMatch`. Outside the portal it accepts only exact trimmed/case-normalized names; it does not guess aliases or grant partial-name matches. Missing child metadata is denied.
- Staff login remains staff routing. Active WALI_SANTRI returns to the existing Wali portal. Staff-shell Home entry redirects there rather than embedding a second shell/nav.
- `wali/dashboard/*` code is unchanged. The portal continues to own its existing session, menu configuration, name matching and feature reads. V2 permission helpers are not claimed to replace server authorization or all legacy feature checks.

## Regression evidence

1. `node tests/wali-role-v2.cjs`: uses the sanitized verified `akbar308` linkage, runs the actual existing `wali/dashboard/script.js`, compares legacy vs additive canonical profile, restores the same child, rejects unrelated child, ignores stale prior-account child when the current profile has its working link, verifies no profile mutation/new studentIds mapping, and verifies reuse of the original name matcher.
2. `tests/wali-role-v2-browser.cjs`: isolated Chromium at 409×720, external network blocked, mocked Auth/Firestore/RTDB, all writes forbidden. Both legacy and V2 profiles submit the existing login form and reach the same standalone Portal Wali, with the same child header and no staff shell. Existing Akademik opens and renders own-child fixture values while excluding a deliberately injected unrelated-child record. Reads retain `cahaya_app/wali_index/akbarprayoga/nilai_bulanan`.
3. `tests/role-system-v2.cjs`: child scope, conflicting assignment rejection, and both login targets pass alongside the other role/scope tests.
4. Approved Guru, Director and Naqib Home browser tests remain zero-operational-download and one-nav; their files were not redesigned.

This is **live read-only profile evidence plus isolated login/feature regression using that profile shape**, not a live login impersonating the parent. No production attendance, financial, academic, case, or profile writes were performed. Not every Wali feature or every one of the 145 accounts was interactively tested.

## Remaining security boundary

Existing localStorage identity and client-side name filtering are not sufficient server authorization. Later Rules work must bind authenticated accounts to the existing authoritative child link/index keys; it must not require creating a replacement child mapping. Name collisions and legacy key aliases need deliberate review, not an automatic ID migration in this phase. The unrelated standalone-route gaps in the general V2 migration remain open; this Wali correction does not mark production activation safe.
