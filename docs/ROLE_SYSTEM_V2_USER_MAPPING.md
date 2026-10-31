# Role V2 user mapping — production preflight, activation blocked

## Current status — 17 September 2026 (supersedes foundation proposals below)

**Production profiles changed: 0. Canonical profiles active: 0/184.** All 184 production accounts retain their existing compatibility/login behavior. This is an inspected migration plan, not a completed production migration.

Read-only evidence: authenticated Firestore `users`, project `absensi-santri-fajrul-islam`, server snapshot at `2026-09-17T06:41:34.341Z`; 184 documents, 39 non-Wali and 145 Wali. The previous admin editor's displayed roles are normalized; the raw fields below were separately inspected. No passwords, Auth tokens, or operational records were exported. Local `config/team-roles-v191.js` name overrides are **not** the production profile registry.

Activation gates currently fail:

- A canonical GURU_PONDOK fixture directly visiting `admin/users.html` starts a Firestore `users` collection read. Shell-menu checks alone do not protect standalone URLs.
- Scoped Naqib, Counselor, Manager and Supervisor detail routes still return `ASSIGNMENT_ADAPTER_REQUIRED`; activating them would remove working feature access. Their correct assignment metadata does not make these consumers ready.
- Deployed production clients/cached sessions have not been verified to run the new registry. No release deployment was requested or performed.

`tools/role-v2-confirmed-plan.json` contains six **unapplied** staff patches, each limited to `roleSystemVersion`, `roles`, `defaultRole`, `assignments`. It is not loaded by the application and cannot write Firebase. Refresh profiles and check for concurrent/newer assignment changes before any future application.

### A. MIGRATED / CONFIRMED

Migrated: **none**. The following assignments are confirmed, but activation remains blocked by the gates above.

| Production document / displayed name | Existing raw legacy values | Confirmed canonical roles / defaultRole | Independent assignments | Status / unresolved |
|---|---|---|---|---|
| `users/multazam` — Multazam | akses: direktur, guru, manajer-pendidikan, manajer, operasional; workspaceRoles: direktur, guru, manajer-pendidikan; updated 2026-09-11 | DIREKTUR, GURU_PONDOK / DIREKTUR | DIREKTUR `{unit:ALL,scope:ALL}`; GURU_PONDOK `{programDomain:KEPONDOKAN}` | CONFIRMED, NOT MIGRATED. Current user instruction supersedes older manager grant; legacy fields retained, not converted to runtime authority. |
| `users/donisetiawan` — Dony Setiawan | akses: konselor, admin, operasional; old function konselor-utama, unit Putra; supervisor scope Pengajaran, Pembinaan Karakter & Asrama, Konseling, Media & Digital | SUPERVISOR, KONSELOR / SUPERVISOR | SUPERVISOR `{unit:PUTRA,supervisedRoles:[GURU_PONDOK,NAQIB,KONSELOR,MEDIA]}`; KONSELOR `{unit:PUTRA,level:MUDA}` | CONFIRMED, NOT MIGRATED. Latest explicit MUDA instruction supersedes old UTAMA metadata. No Dony/Doni code or assignment found in current local teaching master/schedule; conditional GURU_PONDOK is not added. No claim that a separate live teaching override was audited. |
| `users/bennyarizona` — Wadir Benny Arizona | akses: wakil | SUPERVISOR / SUPERVISOR | `{unit:PUTRA,supervisedRoles:[DAPUR,SARPRAS,KESEHATAN,LAYANAN_KEBERSIHAN]}` | CONFIRMED, NOT MIGRATED. No Pendidikan access. |
| `users/zaky` — ZAKY | akses: guru, observer | MANAJER, GURU_PONDOK / MANAJER | MANAJER `{unit:PUTRA,managedRoles:[GURU_PONDOK],programDomain:KEPONDOKAN}`; GURU_PONDOK `{programDomain:KEPONDOKAN}` | CONFIRMED, NOT MIGRATED. PKBM excluded. |
| `users/favian` — Naqib Favian | akses: naqib-operasional, naqib; workspaceRoles: naqib-operasional; unit Putra; updated 2026-09-01 | NAQIB / NAQIB | `{unit:PUTRA}` | CONFIRMED, NOT MIGRATED. Feature scope adapter pending. |
| `users/kamal` — Naqib kamal | akses: naqib | NAQIB / NAQIB | `{unit:PUTRA}` | CONFIRMED, NOT MIGRATED. Feature scope adapter pending. |

**Wali correction — authoritative, not ambiguous:** the subsequent user instruction cancels the proposed `studentIds` requirement. A server query `users.where('akses','array-contains','wali')` at `2026-09-17T06:49:47.395Z` found **145/145 profiles with `namaAnak`**; 16 also contain `namaSantri`. No profile in that result lacks the existing child link. Canonical proposal for every account listed below is WALI_SANTRI, defaultRole WALI_SANTRI. Its activeAssignment derives the existing `namaAnak` from its own profile, not a new stored child assignment. All are CONFIRMED EXISTING LINK / NOT MIGRATED. No reassignment requested. Names/links themselves are deliberately not duplicated in this report.

Each document ID below is one of those 145 accounts; raw akses is `[wali]`, other legacy profile fields are preserved, and the runtime child assignment remains that document's existing `namaAnak`:

```text
abdullah551 abil773 adiba203 aditya311 afif244 ahmad233 ahmad312 ahmad709
airlangga915 aisyah528 aisyahnur287 akbar308 alexy658 alfalah711 alif204 alif401
allam365 almisky991 alvin880 amin397 amirah673 andes551 angga511 anisya905
anugrah820 aqiela842 aqil220 arya782 arya990 ashifa911 basri318 bilal597
bilqis311 brilly244 cahyis921 canza574 daffa237 dafia833 danang605 darren712
dedi204 dikki411 dina918 dirga822 dzikri133 earlyta419 elleno984 eza209
fadhil609 fadil408 fahrie519 fahry654 faisal232 fakhri623 falizh309 faqih921
farazh910 fatir637 fauzan917 febri728 firaas999 fitrah607 gabriel690 ghenis744
ghozy229 grinneta440 habib438 hadinata217 hafidz401 hafidz413 ihza587 ikhsan984
ilham432 ilham974 ilham993 inayah220 izam385 jessica512 juanda491 kiagus661
luthfan332 mahesa652 marfel273 marpin760 medika343 meldi622 mika325 miko825
nabil454 nabil815 nabila247 naeva867 nafis841 najiha815 najmi827 nami278
naufal502 naura319 nayya236 nessya501 nilam663 nizam643 nyayu707 pitri283
prawiro832 qelza455 qenzo756 qheizan739 qiara790 qonita849 raden555 rafa909
raffi598 rafi765 raid998 raka229 renal316 reyfas135 reynaldi443 rezfy801
rifki467 rijal544 riki101 riko693 rohadi882 roid312 satrio304 shelena937
syahrul881 syakir642 tegar532 thooriq517 umar958 usamah950 very429 wafii620
wahyu621 wilda988 windy212 xavi561 yasir260 yusuf407 zahir703 ziyad503 zulfakih766
```

### B. READY DOMAIN EVIDENCE, BUT REQUIRES CONFIRMATION / ROUTE READINESS

These are proposals only. Every row remains LEGACY at runtime; defaultRole is **unset**, no canonical assignment has been written. PKBM evidence is the exact username/code mapping in `config/master-data.js:pkbmTeachers` plus the current local schedule, not a global conversion of generic Guru. Pondok evidence is the current schedule's teacher codes; full account-role lists still need review.

| Document ID / production label | Raw akses | Proposed role / assignment | Outstanding |
|---|---|---|---|
| ahmadimbron — Ahmad Imbron, S.Ag., S.S. | guru | GURU_PKBM / domain PKBM | Complete role/default confirmation; PKBM route readiness |
| andriyani — Andriyani Kusuma Dayanti, S.Pd. | guru | GURU_PKBM / domain PKBM | Same |
| cappry — Cappry Yoda Pratama, S.Pd. | guru | GURU_PKBM / domain PKBM | Same |
| della — Della Gustia, S.Pd. | guru | GURU_PKBM / domain PKBM | Same |
| edwin — Edwin Romeo, S.Pd. | guru | GURU_PKBM / domain PKBM | Same |
| evita — Evita Hardyanti, S.Pd. | guru | GURU_PKBM / domain PKBM | Same |
| laila — Laila Nuzlini, S.Pd. | guru | GURU_PKBM / domain PKBM | Same |
| manda — Manda Saputra, S.Pd. | guru | GURU_PKBM / domain PKBM | Same |
| maryana — Maryana, S.Pd. | guru | GURU_PKBM / domain PKBM | Same |
| nurulfadlilah — Nurul Fadlilah, S.Pd. | guru | GURU_PKBM / domain PKBM | Same |
| shafira — Shafira Ramadanty, S.Pd. | guru | GURU_PKBM / domain PKBM | Same |
| faiq — Mu'allim Faiq Al-Fajr | guru | GURU_PONDOK / domain KEPONDOKAN | Complete role/default confirmation |
| falah — Mu'allim Al-Falah | guru | GURU_PONDOK / domain KEPONDOKAN | Same |
| naqieb — Mu'alim Nagieb | guru | GURU_PONDOK / domain KEPONDOKAN | Same; do not confuse name with NAQIB role |
| rahiel — Mu'allim Rahiel Al-Fadani | guru | GURU_PONDOK / domain KEPONDOKAN | Complete role/default confirmation |
| rosyidin — Mu'allim Rosyidin | guru | GURU_PONDOK proposed | Confirm RASYIDIN schedule identity mapping and complete roles |

### C. AMBIGUOUS — no canonical activation

| Document ID / production label | Raw legacy evidence | Proposed roles / assignment | Unresolved (defaultRole unset unless noted) |
|---|---|---|---|
| diniindriani — Ummi dr. Hj. Dini Indriani, MARS | akses konselor, wakil, observer | SUPERVISOR; unit PUTRI; proposed default SUPERVISOR | **supervisedRoles missing**. Do not infer all Putri areas. |
| dandi — Dandi | akses naqib, staf-muda, manajer; division Pembinaan Karakter & Asrama | User-confirmed Dandy concept: MANAJER; PUTRA; managedRoles [NAQIB,KONSELOR] | Confirm this is Dandy's account. Production does not confirm KONSELOR or level. Do not inherit the local name-alias grant. |
| khaizuran — khaizuran | akses naqib | NAQIB; PUTRA; intended default NAQIB | Select actual account among these three candidates. |
| regen — Khaizuran | akses naqib | Same proposal | Same identity ambiguity; do not activate all three by name. |
| adekhaizuron — Naqib Ade Khaizuran | akses naqib | Same proposal | Same identity ambiguity. |
| alamanda — Alamanda | akses guru, naqib | Teacher domain/independent NAQIBAH or management roles need confirmation | Do not infer all roles from earlier aliases or Putri teaching groups. |
| fatimah — Mu'allimah Fatimah | akses guru, naqib | Same independent-role review | Do not invent Mentor usrahIds or Naqibah grant. |
| meilisa — Mu'allimah Meilisa | updated 2026-09-17T05:13:55.869Z; workspaceRoles naqib-operasional, naqib-pendamping, manajer-pembinaan, guru; raw akses additionally naqib, manajer, operasional, konselor | Current record has Putri Naqib operational assignment, mixed ALL-scope assignments | Newer production assignment must be reviewed, not replaced with old guru/konselor-pemula alias. Counselor level/unit not complete. |
| fenny — Fenny Ayu Anggraeni, S.Pd. | akses guru, kepala-sekolah; exact PKBM teacher registry entry | GURU_PKBM candidate, school leadership separate | Confirm whether MANAJER [GURU_PKBM]/PKBM also applies; do not infer it. |
| mahmudah — Ibu Mahmudah El Gumeri, MPd., Gr. | akses guru, cla | Unresolved | CLA has no canonical mapping; teacher domain/default not established. |

### D. LEGACY ONLY — not targeted for activation

| Document ID / production label | Raw akses | Canonical role/default/assignment | Unresolved |
|---|---|---|---|
| admin — Admin Cahaya | admin | None / unset / none | Do not grant DIREKTUR by alias |
| fahmi — Fahmi | guru | None / unset / none | No active teaching-domain assignment established by this audit |
| hendrik — Hendrik | sarpras | SARPRAS concept only / unset / none | Operational ownership/unit confirmation |
| khansa — Khansa | kesehatan | KESEHATAN concept only / unset / none | Operational ownership/unit confirmation |
| naqib — Naqib | naqib | None / unset / none | Generic account identity/assignment confirmation |
| regenbaru — Regen Prayitno | layanan | None / unset / none | Layanan is not automatically LAYANAN_KEBERSIHAN; duplicate identity review |
| regenprayitno — Regen Prayitno | layanan | None / unset / none | Same |

Inventory coverage: A=151 (6 staff +145 Wali), B=16, C=10, D=7, total=184. These categories describe **planning status**, not active role grants. All existing role/access and child-link fields remain unchanged in Firestore.

See `ROLE_SYSTEM_V2_PRODUCTION_MIGRATION.md` for tests, blockers and Rules gaps; `ROLE_SYSTEM_V2_WALI_LINK.md` for the corrected child-link adapter and regression evidence.

## Historical foundation proposals (retained, superseded by production audit above)

Date: 2026-09-17. Source: `config/team-roles-v191.js`, the legacy editor in `admin/users.html`, and the user's explicit organizational instructions in this task history. No live Firestore user inventory was downloaded. This table is not an exhaustive production user list. No account document or assignment was changed.

## Proposed model

```json
{
  "roleSystemVersion": 2,
  "roles": ["SUPERVISOR", "KONSELOR", "GURU_PONDOK"],
  "defaultRole": "SUPERVISOR",
  "assignments": {
    "SUPERVISOR": {
      "unit": "PUTRA",
      "supervisedRoles": ["GURU_PONDOK", "NAQIB", "KONSELOR", "MEDIA"]
    },
    "KONSELOR": {"unit": "PUTRA", "level": "MUDA"},
    "GURU_PONDOK": {"programDomain": "KEPONDOKAN"}
  }
}
```

This is a fixture/example, not a proposed assignment to a named person. Runtime `activeRole` selects exactly `assignments[activeRole]`. A role switch never unions assignments.

`rolesV2` from the interrupted initial implementation is accepted only under explicit version 2. The canonical persisted contract is `roles` + `assignments`. Legacy `roleAssignmentsV2` is **not** accepted as canonical input. The legacy user editor is not a V2 editor; migration must wait for a reviewed profile-writing workflow.

## Static registry candidates

Confidence describes evidence for the role concept, not approval to migrate. `?` means explicit confirmation or authoritative record lookup is still required.

| Registry user | Current legacy roles | Proposed canonical roles | Per-role assignment / confidence | Unresolved |
|---|---|---|---|---|
| Zaky | manajer-pendidikan, guru | MANAJER; GURU_PONDOK proposed | MANAJER: unit PUTRA, managedRoles [GURU_PONDOK], programDomain KEPONDOKAN — high, explicitly described by user for Muhammad Zaky. Guru domain: proposed, requires individual teaching-role confirmation. | Confirm account ID, independent Guru assignment and defaultRole. No PKBM management. |
| Doni | supervisor-pendidikan-pengasuhan, konselor-muda, mentor | SUPERVISOR, KONSELOR; MENTOR_USRAH proposed | Supervisor concept high; supervisedRoles and unit require confirmation. KONSELOR level MUDA high from explicit legacy rank; unit ?. Mentor usrahIds ?. | Confirm Doni registry key vs Dony Setiawan identity, exact supervisedRoles, unit, mentoring type/usrah IDs, default role. Do not infer MEDIA supervision. |
| Beny | mentor | MENTOR_USRAH proposed | Low until mentoring type confirmed; usrahIds ?. | Generic Mentor does not establish Usrah authority. |
| Dandy | mentor, konselor-pemula, manajer-pengasuhan | KONSELOR, MANAJER; MENTOR_USRAH proposed | Counselor level PEMULA high; unit ?. Manager managedRoles/unit ?. Mentor usrahIds ?. | Confirm whether manager handles NAQIB, KONSELOR or both; units and default role. |
| Fatimah | manajer-pengasuhan, guru, mentor, naqib | MANAJER; teacher/mentor proposal; NAQIB or NAQIBAH requires confirmation | Earlier user identified Putri management; proposed manager unit PUTRI, managedRoles ?. Generic Guru domain ?, usrahIds ?. | Old naqib conflicts with potential Putri assignment; confirm NAQIBAH explicitly. Do not infer unit from a name. |
| Alamanda | manajer-pendidikan, guru, mentor, naqib | MANAJER; GURU_PONDOK proposed; mentor proposal; NAQIB/NAQIBAH unresolved | Earlier user identified Manajer Pendidikan Putri and combined Putri teaching groups; proposed manager unit PUTRI, managedRoles [GURU_PONDOK], domain KEPONDOKAN, pending confirmation. | Confirm exact assignment/domain, independent Guru scope, usrah IDs, NAQIBAH conversion. Preserve combined teaching groups. |
| Meilisa | guru, konselor-pemula | KONSELOR; teacher role unresolved | Counselor level PEMULA high; counselor unit ?. Guru domain ?. | Confirm unit/domain and default role. |
| Kamal | naqib | NAQIB | High role match; NAQIB intrinsically PUTRA. | Confirm production identity and any narrower program/santri assignment. |
| Favian | naqib | NAQIB | High role match; NAQIB intrinsically PUTRA. | Confirm production identity and narrower scope, if any. |
| Khaizuran | naqib | NAQIB | High role match; NAQIB intrinsically PUTRA. | Confirm production identity and narrower scope, if any. |
| Faiq | guru | GURU_PONDOK or GURU_PKBM | Unresolved domain. | Explicit teaching-domain assignment required. |
| Rosyidin | guru | GURU_PONDOK or GURU_PKBM | Unresolved domain. | Explicit teaching-domain assignment required. |
| Rahiel | guru | GURU_PONDOK or GURU_PKBM | Unresolved domain. | Explicit teaching-domain assignment required. |
| Naqieb | guru | GURU_PONDOK or GURU_PKBM | Unresolved domain. | Do not interpret the name Naqieb as role NAQIB. |
| Multazam | ALL legacy list | DIREKTUR; other roles require separate approved assignment | DIREKTUR high, explicitly identified by user. Existing Guru work suggests GURU_PONDOK but no automatic ALL conversion. | Explicit role list/defaultRole; each manager/supervisor/mentor/counselor assignment; legacy all-rank counselor grant cannot choose a single level. |
| Dini | ALL legacy list | Unresolved explicit role list | Legacy ALL is not a canonical grant. | Confirm all intended roles and their independent assignments. |

Feny Ayu Anggraeni was explicitly described as Kepala Sekolah PKBM in prior instructions but is not a user key in this static override table. Organizational responsibility does not automatically establish GURU_PKBM. Confirm the actual account and whether MANAJER with managedRoles [GURU_PKBM], programDomain PKBM is intended.

No Wali child IDs, Mentor usrah IDs, or operational-role account assignments were fabricated. These must come from the corresponding authoritative account/link records.

## Compatibility mapping rules

| Legacy evidence | Suggestion | Assignment requirements |
|---|---|---|
| Mu'allim / Mu'allimah; explicit Guru Pondok | GURU_PONDOK | KEPONDOKAN; no unit inferred from spelling |
| Explicit Guru PKBM | GURU_PKBM | PKBM |
| Guru | unresolved unless assignment explicitly specifies programDomain | Never infer from account name |
| Naqib / Naqib Operasional | NAQIB; explicit PUTRI assignment proposes NAQIBAH | Unit and narrower assignment must be reviewed |
| Naqibah | NAQIBAH | PUTRI |
| Konselor Pemula / Muda | KONSELOR | level PEMULA / MUDA; unit must be explicit |
| Konselor Utama / generic Konselor | KONSELOR concept only | Level unresolved; UTAMA is not a V2 level |
| Mentor Usrah | MENTOR_USRAH | usrahIds required |
| Generic Mentor / Mentor Quran | unresolved | Do not collapse mentoring types automatically |
| Manajer, Manager, legacy Manajer Pendidikan/Pengasuhan/Pembinaan | MANAJER concept | managedRoles + unit + programDomain where relevant; no automatic old-role scope guess |
| Supervisor variants | SUPERVISOR concept | supervisedRoles + unit; division strings alone are insufficient |
| Direktur | DIREKTUR | Current strategic policy; assignments explicit where narrower |
| Health / Dapur / Sarpras / Media legacy aliases | Matching canonical operational role | Preserve any existing authoritative unit assignment |
| Keamanan & Kebersihan | LAYANAN_KEBERSIHAN proposal | Confirm old security duties are not accidentally broadened |
| Wali | WALI_SANTRI | Existing profile child link, primarily namaAnak. Previous studentIds requirement cancelled. |
| Admin / Observer / ALL / hybrid role strings / unrelated finance/cashier roles | unresolved | No automatic privilege conversion |

## Migration gates

1. Review account IDs and assignments; resolve every ambiguous item.
2. Implement and test assignment-aware feature adapters for the account's routes. The foundation holds unadapted scoped routes behind an unavailable message.
3. Verify server-side authorization separately before granting production scope; Firebase Rules are unchanged here.
4. Apply reviewed canonical profiles through an approved account-management workflow, then verify login, switching, feature access and data visibility.
5. Remove old aliases/branches only when no production user or route depends on them.

This task stops at foundation and reporting. No rows above were written into Firebase or a name-based V2 grant table.
