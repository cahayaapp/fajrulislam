# Guru Freeze Rules

## Governing rule

> **No Guru production behavior may be changed unless the user explicitly requests a Guru change.**

The current Guru implementation is canonical. Manager, Supervisor, and Director features should read existing Guru evidence through adapters without redesigning or replacing Guru pages.

## Frozen surface

- Guru home, shell, responsive UI, role behavior, navigation, and labels
- Jadwal and teacher-to-subject allocation
- Presensi Guru and Presensi Santri/two-stage attendance
- Materi, kalender materi, and material completion
- Nilai Ujian and its scoring/session keys
- Tindak Lanjut Guru
- KPI Guru calculations and missing-data divisor behavior
- Tahsin, Tahfiz, and Murojaah workflows
- Al-Qur'an and Bahasa Arab special grouping
- Master teacher, student, class, and group mappings
- Existing Firebase paths, payload shapes, indexes, and legacy compatibility reads

## Integration rules

1. New operational modules are **consumers**, not replacement masters.
2. Prefer read-only adapters over changes inside `guru/`, `home-guru.html`, `pendidikan/kpi-guru.html`, or `js/guru-kpi-v144.js`.
3. Do not write derived Manager state back into Guru evidence paths.
4. Store findings/actions/audit state in separate ops paths only after schema review and explicit implementation approval.
5. Never silently rename a Firebase path, teacher code, class, mapel, schedule ID, assignment key, or material key.
6. PKBM and kepondokan filtering happens in the adapter/policy layer, not by deleting source rows.
7. `main-dashboard.html` remains routing/shell infrastructure; new business logic must not be embedded there.

## If Guru code must change

Before implementation:

1. Explain why an adapter cannot solve the requirement.
2. Name the exact Guru files/functions/paths affected.
3. Obtain an explicit Guru-change request from the user.
4. Minimize the patch and preserve existing UI and workflow.
5. Add a regression check against `docs/GURU_BASELINE_MANIFEST.json` or update the approved baseline deliberately.
6. Verify schedule allocation, combined groups, Firebase schema, and mobile UI.
7. Document any schema compatibility impact; never introduce a silent breaking change.

## Review gate

A change fails review if it unintentionally changes any fingerprinted canonical Guru file, modifies a frozen Firebase path/schema, changes teacher allocation, collapses PKBM/kepondokan scope, or moves operational business logic into `main-dashboard.html`.
