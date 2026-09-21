# Phase 2C-1 — Counselor / Naqib assignment adapters

2026-09-17. **NOT READY for production activation. No migration, production writes, Rules changes or new schemas.**

## Delivered and deliberately held

The shared scope adapter now builds exact-name rosters from existing assigned `master_usrah/Usrah N` children. NAQIB uses Putra 1–6, NAQIBAH Putri 7–8, following the existing source boundary. Optional usrahIds narrow further; unknown keys fail closed. Explicit studentIds remain held until their identity mapping is implemented. Every scoped save revalidates the captured role/assignment and roster. Names are not guessed from usernames, normalized into new identities, or reassigned.

- Positive initiative and violation reporting consume that roster. Forged student selections are rejected before writes.
- Implementation journal reads the existing unit child of the schedule and locks its unit selector. Its duplicate lookup is unit-filtered; additional usrah restrictions remain held.
- Counselor queue and CAHAYA assessment have staged consumer adapters, but their restricted V2 routes **remain denied before Firebase initialization**. Rendering only the correct unit does not make a cross-unit download safe. Their pending policies are intentional, not a missing menu grant.
- Existing attendance scope was audited and re-tested, not rewritten.
- Approved Homes, Presensi, Nilai, Wali engine and six staff payloads remain unchanged.

## Counselor authority

`js/role-scope-v2.js` owns level capabilities and `counselorCaseAllowed`. The existing queue's category split was already explicit: PEMULA receives basic discipline/cleanliness, not repeated/escalated cases; MUDA receives advanced/repeated/escalated cases. That split is now checked before opening an action and again before its write, not just as a visual filter. A new report's generic `Menunggu Konselor` routing is not itself an escalation. Historical explicit escalations retain their meaning.

Unit and level come from activeAssignment; `?mode=naqib`, `?level=utama`, stale local legacy roles and user-name guessing cannot override them. SP issuance and deleting a case have no verified level policy; both are denied by default for V2. No new rank privilege was invented. Their existing legacy behavior remains untouched pending policy confirmation.

V2 Naqib/Naqibah cannot open the Counselor page, including direct URLs and iframes. In the staged Counselor consumer, new action records use `KONSELOR`, never a new Naqib handling action. Old records with NAQIB remain historical records. Existing case-status updates, negative `poin_manual` transactions, wali-index fanout and attendance restitution branches are retained. No historical data was deleted or migrated.

The old reporter actually routed some reports to Naqib and others to Manager/Supervisor. V2 reporting now follows the requested policy: `tipe: Lapor Pelanggaran`, `jalurPenanganan: KONSELOR`, `statusPenanganan: Menunggu Konselor`. It does not write points. Legacy accounts retain their existing branch. Positive initiatives retain the +5/+10/+15/+20/+25 standards and existing worship duplicate/40-point cap rules.

## Query audit

All RTDB paths below are under `cahaya_app/`. Queries occur only after feature navigation or submission, never on Home. Counts describe requests/record scope, not measured production bytes.

| Page / operation | Before | V2 adapter | Limits / readiness |
|---|---|---|---|
| `naqib/gamifikasi.html`, roster | Full master_usrah + master_akademik | Exact master_usrah child reads: six Putra or two Putri, fewer with explicit usrahIds; no academic-master fallback | More small requests can replace two large reads. No opposite-unit roster query. |
| Initiative, ordinary +5…+25 save | No extra read | Same; validation uses loaded roster | Existing log_lapor_inisiatif update preserved. |
| Initiative, worship cap | log_lapor_inisiatif ordered by tanggal = today, both units | For each selected name, existing pelapor and namaSantri equality queries; merge by original record key, retain today's records | Two reads per selected student, history for those names is not date-bounded. Do not truncate: that could bypass duplicate/cap checks. Required indexes unverified in production; no wire-isolation claim until indexed. |
| `guru/lapor-pelanggaran.html` | Local whole-school names, zero Firebase roster reads | Naqib/Naqibah: assigned master_usrah children; selected subjects and student source checked before update | Additional on-click small reads are intentional for authoritative assignment scope. Other legacy/Guru behavior not redesigned. |
| `naqib/absensi.html` | Phase 2B assigned-usrah loader | Retained; exact roster checked before original absensi_program_harian + wali_index writes | Shared master_program_harian/jadwal_program_harian retained. Save still reads izin_sakit_harian/{date} across units. Only allowed roster contributes to sick status. Remains partial. |
| `naqib/jurnal-piket.html`, initial | Entire jadwal_piket_naqib | jadwal_piket_naqib/putra OR /putri | Existing child paths; opposite schedule not requested. Existing local Putra fallback retained. |
| Journal duplicate lookup | jurnal_piket_naqib, tanggal equality, last 200 across units | unitPengawasan equality; exact date/block/author checks retained, plus exact unit | No opposite-unit query predicate, but index absent from checked-in file. Reads all matching unit history at save; date+unit needs a future verified composite source for efficient bounding. No new schema invented. |
| Counselor roster, staged | Full data_santri and master_usrah | Only assigned usrah children; no data_santri read | Empty roster fails closed, never accepts all students. |
| Counselor queue, staged | Reports by tanggal, last 700; program attendance last 1200; learning attendance last 900; actions by tanggalPenindakan last 700; 120-day window | Existing bounded queries retained; only authoritative own-unit roster enters queue/action history | **Still cross-unit wire data. Production route held.** Mixed attendance arrays, historical aliases and missing unit fields prevent certifying an equivalent narrow query from repo evidence alone. |
| Counselor warnings, staged | surat_peringatan_santri ordered by dibuatPada, last 300 | Same query, own-roster rows only; photo requests require an already-visible authorized record | Still broad query; part of held route. Evidence paths also restricted to existing bukti_pelanggaran child paths. |
| `pusat-asesmen/santri.html`, staged roster | Entire master_usrah | Assigned children, validate usrah/name before selection and save | Keeps five dimensions, payload, asesmen_cahaya_santri and wali_index paths. |
| CAHAYA chair lookup, staged | Firestore entire users collection | users where workspaceRoles array-contains exact existing `asisten-naqib` duty tag; intersect with scoped roster | Still cross-unit profile metadata. Assignment-only/variant-tag legacy chair profiles are not guessed or silently granted; missing verification fails closed. **Production route held.** |

Naqib's current CAHAYA implementation is for Ketua Usrah; this task does not broaden it to every student. An empty/failed chair lookup can no longer grant all roster members in the V2 consumer. The old duty tag is source compatibility metadata, not a canonical authorization role.

## Index / source blockers — recommendations only

Checked-in `firebase-rtdb-rules-cahaya-app-v20.json` and `database-indexes-bandwidth-snippet.json` contain only `tanggal` indexes at log_lapor_inisiatif and jurnal_piket_naqib. Deployed Rules were not inspected or modified. Proposed additive index arrays, subject to separate approval:

```json
{
  "log_lapor_inisiatif": { ".indexOn": ["tanggal", "pelapor", "namaSantri"] },
  "jurnal_piket_naqib": { ".indexOn": ["tanggal", "unitPengawasan"] }
}
```

Merge with any other deployed indexes; do not replace deployed Rules wholesale. Without indexes, RTDB may download broad data and filter client-side despite a selective query. Indexes improve queries; they do not authorize users or secure writes.

Counselor needs verified unit-scoped sources covering both reports and mixed attendance sessions, preserving historical aliases/completeness. A date query plus UI filter is not enough. CAHAYA needs a verified unit-scoped chair directory/mapping covering assignments-only legacy records. Do not infer unit from personal names, create a second authoritative roster, or silently omit historic cases. These require a separately approved data/index strategy before releasing the held routes.

## Lifecycle and existing missing features

The five audited consumers use one-shot gets, not realtime onValue listeners or periodic polling. No new listener/timer was introduced. Toast/loader animation timers are not database refreshes. Existing shell role-switch frame disposal and entry-context revocation remain in place; captured rosters reject work after activeRole/assignment changes. Already-started network gets cannot be cancelled by this adapter; their results are rejected before scoped rendering/writes when context expires. Authorized multi-write fanout semantics remain unchanged.

Program Hari Ini uses the existing V2 local role-workspace placeholder; it is not a completed program viewer. Riwayat Laporan currently reopens the journal, not a separate paginated history. Dedicated Riwayat Absensi and KPI Naqib remain approved Home placeholders. Legacy jadwalpiket.html is a schedule editor, not a safe replacement for a program viewer, and was not opened to Naqib. Other old discipline/ranking/self-assessment pages retain their guards. No feature was invented to conceal these gaps.

## Verification

- `tests/role-v2-counselor-naqib.cjs`: real feature modules in 409×720 isolated browser fixtures for both units; forged selections denied; +5 and report-only mock saves; unit journal read; staged Counselor action retains -5 existing scoring path; staged assessment chair roster checked.
- Important: this fixture server substitutes **only in the test response** the two pending route policies to exercise staged consumers. Production registry remains denied. These tests are not evidence that their broad queries are production-safe.
- `tests/role-v2-entry-guards.cjs`: actual unmodified production guard; direct/iframe denials before SDK/read/write, including held Counselor and assessment routes; attendance Putra/Putri and revoked old-tab context.
- `tests/role-v2-roster-adapters.cjs`: exact names/usrah, forged membership, expired roster after role switch, level category restrictions and new report-only routing.
- Existing canonical contracts, frozen-source hashes, Home browser and Wali browser regressions run. Home fixtures remain zero operational reads; shared shell has only its existing users/fixture identity read. Existing namaAnak link and portal child unchanged; no Wali profile write.
- Tests block all production network access; writes are mock objects only. Production data, rules and prepared migration payloads are untouched. No claim of live-production query/index verification.

## Files in this phase

Runtime plus existing byte-equivalent docs mirrors: js/role-scope-v2.js, js/role-navigation-v2.js, js/role-route-registry-v2.js, naqib/gamifikasi.html, naqib/jurnal-piket.html, guru/lapor-pelanggaran.html, konselor/daftar-kasus-baru.html, pusat-asesmen/santri.html.

Tests: new role-v2-counselor-naqib.cjs and role-v2-roster-adapters.cjs; updated role-system-v2.cjs and role-v2-entry-guards.cjs. Updated tools/role-v2-readiness-report.cjs and ROLE_SYSTEM_V2_PAGE_READINESS.md; this scope audit is new.

**Final verdict: NOT READY.** Remaining blockers: held Counselor and CAHAYA queries, index verification/approval, historical completeness and chair metadata reconciliation, unresolved SP/delete policy, existing absent Naqib features, and untouched Manager/Supervisor blockers from Phase 2B. Phase 2C-1 is partial hardening, not completion of every requested operational page. Do not activate the six staff payloads.
