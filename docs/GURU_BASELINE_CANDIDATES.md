# Guru Baseline Candidates

Audit date: 2026-09-16  
Status: **REPORT ONLY — NO RESTORE PERFORMED**

## Executive conclusion

There is **no single recoverable Git snapshot** that satisfies all requested conditions exactly.

- The last demonstrably clean/responsive Guru implementation is `ef26257` and remains byte-identical for Guru files through `aa92614` and `b667435`.
- The last commit **before Manager Pendidikan development** is `aa92614`.
- The required global bottom labels `Jadwal | KPI | Beranda | Pesan | Lainnya` first appear in the uncommitted V193 snapshot (`cdc27d2`), but that same snapshot contains the shell/header overrides associated with the broken preview.
- No stash, dangling commit, reflog entry, branch, tag, or archived HTML version was found containing a clean intermediate V193 Guru state.

**Best historical baseline candidate:** `aa92614c8fb72e108cb4edeb22936aa94171fb78` (`origin/main`).  
Its Guru implementation is the finalized `ef26257` UI and it is the exact repository boundary immediately before Manager development began at `e320eb3`.

Important limitation: its Guru bottom navigation is `Kaldik | Absen | Beranda | Pesan | Lainnya`, not the later `Jadwal | KPI | Beranda | Pesan | Lainnya`. If approved, restoration should use `aa92614` for the Guru visual/functional baseline; the desired nav labels/resolvers should then be applied as a small isolated shell change, without importing the V193 global shell overrides.

## Timeline boundary

| Commit | Date | Meaning |
|---|---|---|
| `ef26257` | 2026-09-11 11:09 | `Finalkan UI responsif halaman guru` |
| `aa92614` | 2026-09-11 11:22 | `Samakan UI ruang kerja pendidikan`; last commit before Manager rebuild |
| `e320eb3` | 2026-09-12 09:54 | `Bangun Education Command Center`; Manager Pendidikan development begins |
| `4a7ad54`–`1f77e43` | 2026-09-12 | Manager home/scope/navigation iterations |
| `b667435` | 2026-09-12 10:26 | Manager page reverted; tracked Guru shell returns to pre-Manager content |
| `cdc27d2` | backup snapshot 2026-09-16 | Full dirty working tree containing V193/V194; visually broken, archive only |

## Candidate A — `ef26257`

**Commit:** `ef2625702691acacd64e9316b5738e84cf4c57e7`  
**Message:** `Finalkan UI responsif halaman guru`

### Relevant differences

- Introduces `guru/guru-ui-final-v190.css`.
- Adds that final responsive stylesheet to:
  - `home-guru.html`
  - `guru/absenguru.html`
  - `guru/absensiPembelajaran.html`
  - `guru/capaian-materi.html`
  - `guru/gurumenulis.html`
  - `guru/inputNilaiUjian.html`
  - `guru/inputSetoranTahfiz.html`
  - `guru/lapor-pelanggaran.html`
  - `guru/laporan-murojaah.html`
  - `guru/tindak-lanjut.html`
- The stylesheet constrains Guru content to a mobile-safe width, protects text/icon sizing, normalizes cards/buttons, supplies bottom safe-area padding, and prevents horizontal overflow.
- Guru Home uses its original premium `hero-greeting`, two-column summary cards, readable Menu Guru grid, KPI cards, and compact activity card.

### Assessment

- **Guru UI clean:** Yes. This is the explicit finalized responsive Guru commit.
- **Overlapping/compressed cards:** Protected by the final responsive stylesheet and original Guru Home grid rules.
- **Excessive blank area:** No V193 header replacement or global-shell forcing is present.
- **Global shell duplication:** No V193 global role/header layer. One shell-owned mobile bottom nav is rendered by `main-dashboard.html`; `home-guru.html` does not render another bottom nav.
- **Guru functionality intact:** Yes. This commit changes visual CSS/linking only; existing Firebase/data logic remains.
- **Bottom navigation requirement:** Partial. It has one bottom nav, but Guru labels are `Kaldik | Absen | Beranda | Pesan | Lainnya`.

### Recommendation

Strong source for canonical Guru UI files and CSS. It is one commit earlier than the pre-Manager boundary but semantically the clearest “final Guru” checkpoint.

## Candidate B — `aa92614` (recommended)

**Commit/remote:** `aa92614c8fb72e108cb4edeb22936aa94171fb78`, currently `origin/main`  
**Message:** `Samakan UI ruang kerja pendidikan`

### Relevant differences from `ef26257`

- **No Guru page, Guru CSS, KPI module, master data, or schedule data changed.**
- Adds `css/pendidikan-ui-v191.css` for Education workspaces.
- Changes only Education/Manager/Supervisor page styling and cache-version routes in `main-dashboard.html`.
- `home-guru.html`, all audited `guru/*` feature files, `guru/guru-ui-final-v190.css`, `pendidikan/kpi-guru.html`, and `js/guru-kpi-v144.js` are byte-identical to `ef26257`.

### Assessment

- **Guru UI clean:** Yes; identical to Candidate A.
- **Overlapping/compressed cards:** No known regression relative to Candidate A.
- **Excessive blank area:** No V193 shell/header override.
- **Global shell duplication:** No V193 global shell. One mobile bottom nav owned by `main-dashboard.html`.
- **Guru functionality intact:** Yes; Guru feature and data-source files are unchanged from finalized responsive version.
- **Bottom navigation requirement:** Partial, same label mismatch as Candidate A.
- **Historical fit:** Best. This is the final commit immediately before `e320eb3` starts Manager Pendidikan development.

### Recommendation

**Recommended baseline candidate.** It gives the correct historical cutoff while preserving the finalized Guru implementation byte-for-byte.

## Candidate C — `b667435`

**Commit/current HEAD:** `b667435defb770159883dbdf763959c016dbf9dd`  
**Message:** `Kembalikan halaman Manajer Pendidikan ke versi awal`

### Relevant differences

- Occurs after six Manager Pendidikan commits.
- Its tracked `main-dashboard.html` blob is exactly the same as `ef26257`.
- Its tracked `home-guru.html`, Guru feature pages, final Guru CSS, KPI page/module, master data, and schedule snapshot are identical to both Candidate A and Candidate B.
- Relative to `aa92614`, it removes Education UI V191 and reverts Education cache-version routes; these are not Guru logic changes.

### Assessment

- **Guru UI clean in committed tree:** Yes, equivalent to Candidate A.
- **Global shell duplication in committed tree:** No V193 layer.
- **Guru functionality intact:** Yes.
- **Bottom navigation requirement:** Partial, same label mismatch.
- **Historical fit:** Weaker than Candidate B because it is after Manager experimentation, even though the relevant Guru blobs are clean.

### Recommendation

Useful as a byte-equivalent confirmation, but not the preferred historical baseline.

## Candidate D — V193/V194 backup `cdc27d2` / current working tree

**Branch/tag:**

- `backup/pre-operational-manager-rebuild`
- `backup-pre-operational-manager-rebuild-20260916`
- commit `cdc27d23e932072ab454c6d5b3d8d6417c8f373d`

This backup remains valuable as an archive of uncommitted work but **must not be treated as a canonical Guru baseline**.

### Relevant differences from stable tracked Guru

- `home-guru.html` replaces the proven `hero-greeting` with a new `intro` header and adds a large V193 override block.
- `main-dashboard.html` adds approximately 285 changed lines, global role-modal code, global route resolvers, and forces `director-role-shell` more broadly.
- The premium shell condition changes from role-scoped toggle behavior to unconditional shell classes in several paths.
- V193 changes Guru navigation to the desired `Jadwal | KPI | Beranda | Pesan | Lainnya`.
- V194 adds Manager routes/styles on top of that shell.
- `pendidikan/kpi-guru.html` is also modified in the dirty snapshot.

### Assessment

- **Guru UI clean:** No. Live preview demonstrates compressed/overlapping cards, undersized Menu Guru, and large blank vertical regions.
- **Global shell duplication:** Logical duplication/competition exists: the iframe Guru layout and global Director-style shell/header overrides both control layout. There is still one literal mobile-nav container, but multiple shell rule sets compete for sizing and home state.
- **Guru functionality intact:** Core `guru/*` files are mostly unchanged, but the shell/home/KPI integration changed enough that end-to-end behavior cannot be accepted as stable.
- **Bottom navigation requirement:** Yes for labels/order, but at the cost of the visual regression.

### Recommendation

Reject as baseline. Keep only as forensic reference for the desired nav resolver and role mapping. Do not restore V193/V194 wholesale.

## Earlier candidates

### `c19f128` — `Tambah manajemen kelas dan rentang Tahsin`

- Guru features are functional and include the Tahsin range work.
- Predates `guru/guru-ui-final-v190.css`, so it lacks the final responsive protection.
- Not recommended because `ef26257` contains the same functional lineage plus the finalized UI.

### `0ece72f` — `Rapikan kartu nilai dan tambah rentang surat`

- Useful functional milestone for multi-surat work.
- Also predates final responsive Guru UI and subsequent management-class/Tahsin refinements.
- Not recommended as the complete Guru baseline.

## Archived/versioned source audit

Inspected:

- Git branches: `main`, `origin/main`, `backup/pre-operational-manager-rebuild`, `upgrade-total-29-juli-2026`
- Tag: `backup-pre-operational-manager-rebuild-20260916`
- Full reflog around 9–16 September 2026
- Git stash: empty
- Unreachable commits: none
- Archived build/QA notes including `BUILD-V153` through `BUILD-V193` and `QA-V193-GLOBAL-APP-SHELL.txt`
- Versioned source names including `index-v126.html`, `index-v127.html`, and `guru/guru-ui-final-v190.css`
- Root and `docs/` mirrors

`BUILD-V193-GLOBAL-APP-SHELL.txt` and its QA note confirm the desired five nav labels, but no separate pre-regression V193 HTML snapshot exists in Git. The only recoverable V193 implementation is part of the rejected dirty backup/current tree.

## Functional integrity comparison

Across `ef26257`, `aa92614`, and `b667435`, the following relevant blobs are identical:

- `home-guru.html`
- `guru/guru-ui-final-v190.css`
- `guru/absensiPembelajaran.html`
- `guru/capaian-materi.html`
- `guru/inputNilaiUjian.html`
- `guru/inputSetoranTahfiz.html`
- `guru/tindak-lanjut.html`
- `pendidikan/kpi-guru.html`
- `js/guru-kpi-v144.js`

Therefore Jadwal, Presensi Santri, Materi, Nilai, Tindak Lanjut, Tahsin/Tahfiz, KPI, and their Firebase/data behavior are preserved equally by Candidates A–C. The regression is concentrated in the later uncommitted global shell/home integration, not in the core Guru feature pages.

## Final recommendation

Use `aa92614` as the **historical baseline candidate**, with these future restoration boundaries after explicit approval:

1. Restore only the stable Guru shell/home/CSS behavior from `aa92614`/`ef26257`.
2. Preserve current core Guru feature/data files where they are already identical.
3. Do not restore V193 global header/shell overrides.
4. Reimplement only the five-item nav contract (`Jadwal | KPI | Beranda | Pesan | Lainnya`) as a narrowly scoped Guru shell change, with a mobile regression check.
5. Do not touch Manager UI or Firebase schemas during baseline restoration.

No restoration, checkout, reset, or application-file modification has been performed by this audit.
