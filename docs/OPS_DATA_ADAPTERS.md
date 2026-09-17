# Operational Data Adapters

## Intent

The operational engine sits **above** the working Guru system. It does not duplicate Guru data into a second authoritative database.

```text
Legacy Guru Sources (authoritative evidence)
                  ↓ read/normalize
             Ops Adapters
                  ↓ evaluate
 Standard → Finding → Verification → Action → Evaluation
                                      ↓
                              Resolved / Escalated
```

## Hierarchy and scope

```text
Director: Multazam
  └─ Supervisor Pendidikan & Pengasuhan: Dony Setiawan
       └─ Manager Pendidikan Putra: Muhammad Zaky
            └─ Personnel: Guru Kepondokan
```

- Muhammad Zaky's workspace is **KEPONDOKAN only**.
- PKBM teachers and PKBM schedules must not appear in Zaky's workspace.
- PKBM remains separately handled by **Feny Ayu Anggraeni — Kepala Sekolah PKBM**.
- Scope is an adapter/policy filter; source data remains intact.

## Adapter catalog

| Adapter | Legacy authoritative input | Operational output | Initial access |
|---|---|---|---|
| `ScheduleAdapter` | `cahaya_app/jadwal_pelajaran`; fallback schedule JSON | normalized occurrence/assignment, scope, expected teacher/time | Read-only |
| `LearningAttendanceAdapter` | `cahaya_app/absensi_pembelajaran` | KBM execution evidence, student attendance, start/final state, daily score | Read-only |
| `TeacherAttendanceAdapter` | `cahaya_app/absensi_guru`, `cahaya_app/log_absensi_guru` | teacher presence, punctuality, GPS evidence | Read-only |
| `MaterialExecutionAdapter` | `kalender_materi_pembelajaran/ta_2026_2027`, legacy `guru_kits_materi/ta_2026_2027`, `cahaya_app/capaian_materi_guru` | due target, taught/completed status, timeliness | Read-only |
| `AcademicResultsAdapter` | `cahaya_app/nilai_ujian_bulanan`, `cahaya_app/nilai_ujian` | assessment evidence, KKM result, missing/late input | Read-only |
| `AcademicFollowUpAdapter` | `cahaya_app/tindak_lanjut_guru` | remediation/action evidence tied to assessment | Read-only |
| `QuranProgressAdapter` | `cahaya_app/setoran_tahfiz`, `cahaya_app/target_tahfiz`, program/class sources | expected vs actual Tahsin/Tahfiz/Murojaah progress | Read-only |
| `TeacherKpiEvidenceAdapter` | sources consumed by `CahayaGuruKPI.compute` | evidence-only metric inputs and availability | Read-only; reuse calculation semantics |
| `RosterAdapter` | `cahaya_app/master_akademik/kelas`; fallback `CAHAYA_MASTER_DATA.santriByClass` | canonical class membership with explicit scope | Read-only |
| `TeacherIdentityAdapter` | schedule `guruKode`, current profile, master/aliases | stable operational teacher identity | Read-only |
| `AcademicCalendarAdapter` | `kalender_pendidikan/ta_2026_2027/events`; fallback calendar JSON | effective teaching days and exclusions | Read-only |

## Authority rules

1. Firebase runtime remains authoritative when available.
2. Bundled JSON/master data is fallback and drift-reference, not a competing write target.
3. Adapter output is derived and may be cached, but caches are disposable.
4. A Finding references evidence IDs/paths and adapter version; it does not copy full source records unnecessarily.
5. Findings and actions may later use a new ops namespace, but that schema is not created in this audit.
6. Adapters expose `source`, `sourcePath`, `sourceId`, `observedAt`, `scope`, and normalization warnings.

## Scope classification

Recommended classification order:

1. Explicit `scope`/`unit` field if trustworthy.
2. Class prefix `PKBM` → PKBM.
3. Class containing Putra/Putri without PKBM → kepondokan.
4. Teacher-only evidence joins through schedule/class assignment for the selected period.
5. Unknown scope is quarantined as `UNRESOLVED`; it is not shown to Zaky until reviewed.

The adapter must never classify a record as kepondokan merely because its teacher also teaches kepondokan.

## Operational engine contracts

### STANDARD

Defines an expected condition: schedule execution, material due date, attendance completion, score deadline, or follow-up SLA.

### EXECUTION DATA

Read-only normalized evidence returned by adapters. Every record retains a pointer to its legacy source.

### FINDING

Created only when a deterministic standard comparison detects deviation. Dedupe key should include standard, subject/person, occurrence/period, and scope.

### VERIFICATION

Manager confirms evidence, context, exemption, or false positive. Verification never edits the legacy evidence record.

### ACTION

Operational response with owner, due date, status, and relation to the finding.

### EVALUATION

Re-reads authoritative evidence after action or records a manager evaluation.

### RESOLVED / ESCALATED

- `RESOLVED`: standard is met or a verified exception closes the finding.
- `ESCALATED`: overdue/high-risk/repeated issue moves Manager → Supervisor → Director according to policy.

## Read model recommendation

Adapters return plain normalized objects; evaluators remain pure where possible. Firebase access, normalization, policies, and UI must be separate modules. No adapter is wired to production during this audit.

## Known mapping risks

- Live schedule may drift from the bundled snapshot.
- Name-based teacher/student identity can collide.
- Combined groups and virtual Juz must survive normalization.
- Material has current and legacy paths.
- KPI intentionally excludes unavailable indicators from its divisor.
- Date/time comparisons must use Asia/Jakarta and the academic calendar.
