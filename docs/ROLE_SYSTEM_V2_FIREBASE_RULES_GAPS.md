# Role System V2 — Firebase Rules gaps (Phase 2B)

Date: 2026-09-17. **Recommendations only. No Rules/schema change, deployment, profile mutation, or migration activation.**

## Boundary

The new centralized route/entry guard stops normal canonical navigation before an unauthorized page initializes Firebase. The assignment adapter controls participating readers, selectors, action targets and late responses. Neither makes localStorage trusted, prevents a modified client calling Firebase directly, nor protects publicly hosted static JS/JSON master data.

Production activation is **NOT READY** due to unfinished app-level consumers, independently of this later server-hardening work. Tests use isolated fixtures; deployed Firestore/RTDB Rules have not been certified by these tests.

## Requirements for the later approved Rules phase

1. **Trusted identity/profile authority.** Bind Firebase Auth UID to the authoritative users document. Do not trust a client-supplied username, role, activeRole, unit, teacher code, usrah or child name. Deny client self-assignment of roleSystemVersion, roles, defaultRole and assignments. Retain legacy fields as compatibility metadata, not an additional union of V2 grants. Account management needs independently authorized capability; no generic admin alias may bypass canonical policy.
2. **User-directory protection.** Explicitly restrict collection-wide Firestore users reads and individual profile reads. Direct URL admin/users.html now starts zero reads when denied, but that does not prove direct Firestore SDK access is denied. The current in-shell messaging user directory also needs a separately reviewed least-privilege policy.
3. **RTDB query constraints are not filters.** Rules permitting a parent node can reveal all descendants. A client requesting a broad historical node cannot rely on UI filtering for privacy. Test exact existing key paths, bounded/indexed queries and negative direct SDK requests. Do not quietly rewrite business paths to solve this.
4. **Guru/domain boundaries.** Enforce authorized teacher identity, assigned teaching group, unit where restricted, and authoritative KEPONDOKAN vs PKBM metadata on existing attendance, materials, exam and academic paths. Subject names are not authoritative domain evidence. Preserve combined groups and all schedule semantics.
5. **Management scope.** MANAJER must be restricted by managedRoles + unit + domain. SUPERVISOR by supervisedRoles + unit. Missing metadata cannot default to Putra/ALL. Education managers must not read PKBM merely because both have teacher records.
6. **Counselor cases/actions.** Require KONSELOR and matching unit for queue, source reports, details/photos, handling, consequences, case writes and resolution. Naqib reporting/positive initiatives must not confer handling/negative-point authority. Any future PEMULA/MUDA action difference needs explicit centralized policy, not a new role. Current Phase 2B queue remains blocked for V2 until its app-level source joins are scoped.
7. **Naqib/Naqibah.** Enforce PUTRA/PUTRI and any narrower assignment for program attendance, reports, assessment, positive initiative, history and fan-out index writes. Validate all members in aggregate payloads; do not trust a record's self-declared unit alone. Existing positive-point configuration remains authoritative. No new point values or scoring engine.
8. **Mentor.** Enforce assigned usrah for master_usrah children, mentoring_usrah queries and creates/updates. Verify action targets against the original assignment, including forged selectors and renamed labels. Individual mentoring and its history remain separate pending consumers. No username-based assignment inference.
9. **Wali — existing link only.** Use Firestore users/{username}.namaAnak as the relationship authority; never require a new studentIds field or a second child mapping. Validate authenticated Wali access to the existing normalized-name wali_index child and each category. Review legitimate existing aliases/name collisions deliberately. Cross-database Firestore↔RTDB authorization constraints must be resolved explicitly; RTDB Rules cannot simply dereference Firestore profiles. Choose a separately approved trusted authorization mechanism without silently duplicating the child relationship.
10. **Atomicity/fan-out writes.** Validate every existing multi-location update, including wali_index, attendance and assessment targets. A valid route does not make client-provided paths or mixed-scope batch members safe. This phase preserves existing write semantics and does not introduce transactions or a new schema.
11. **Session/release revocation.** Client role switching destroys old role frames; other tabs redirect on identity/assignment changes, and adapters reject late results. Server policy must independently reject stale/revoked grants. Verify installed/service-worker-cached clients have the guarded release before activation.
12. **Public/static records.** Some legacy master rosters and schedules ship in static assets. Client guards and Firebase Rules do not make those files private. Inventory public hosting exposure separately; no removal/relocation is performed here.

## Index recommendations, not deployment

- Existing Nilai periode_ujian warning remains governed by NILAI_FIREBASE_QUERY_AUDIT.md; no change here.
- New scoped Mentor history request: ref('cahaya_app/mentoring_usrah'), orderByChild('usrah'), equalTo('Usrah 3') (or another explicitly assigned existing key). Check current deployed index first. If absent, merge **only** the usrah index into the existing node's .indexOn without replacing read/write rules or other indexes:

```json
{
  "rules": {
    "cahaya_app": {
      "mentoring_usrah": {
        ".indexOn": ["usrah"]
      }
    }
  }
}
```

This fragment is an index recommendation, **not a replacement Rules file** and not an authorization grant. An index alone does not stop unscoped reads. The fixture cannot measure deployed query bandwidth or confirm the current index.

## Required negative emulator/server tests

- Any client forges role/assignment or attempts profile privilege escalation.
- Supervisor Dapur reads education; education Supervisor reads Dapur.
- Kepondokan Guru/Manager reads PKBM or another teacher's evidence.
- Naqib opens/executes Counselor handling, or cross-unit attendance/scoring.
- Counselor Putra reads/writes Putri records or unowned source photo/detail.
- Mentor reads/writes an unassigned usrah, including history queries.
- Wali reads/writes another child's name key/category, a colliding/ambiguous alias, or the broad wali_index root.
- Mixed-scope fan-out, old-role tabs, removed assignments, missing metadata and stale cached sessions.

Do not treat menu hiding, successful positive UI tests, or the new entry guard as a substitute for these server tests. All production migration payloads remain unapplied.
