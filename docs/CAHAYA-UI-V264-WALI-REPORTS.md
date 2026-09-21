# CAHAYA UI V264 — reference update and Wali reports

## Visual contract

The user-attached navy reference replaces the earlier light/glossy Home reference.
Mobile Homes share one fixed-viewport renderer: navy/teal mosque masthead, white
identity chip, date card, up to four coloured quick actions, and compact secondary
tiles. Role-specific authoritative routes/permissions are unchanged. Simple roles
retain their two functions rather than receiving invented actions. Extra menus
remain available through the existing drawer. Short viewports show fewer secondary
tiles instead of shrinking touch targets or overlapping content.

Staff bottom navigation is now visually ordered Beranda, Jadwal, KPI, Pesan,
Lainnya, retaining the same actions. Wali retains its own report-oriented navigation.
Browser/phone status bars and outer phone decorations are not copied into the app.

Feature pages and their sheets use the same navy heroes, white/light-blue canvas,
colourful icon tiles, rounded cards and blue/teal controls, with ordinary scrolling.
Desktop Homes retain their established composition with the updated palette.
The existing small mosque asset is reused; the presentation adds no data reads.

Shared implementation: `js/mobile-home-v2.js`, `css/mobile-home-v2.css`,
`js/cahaya-ui-v2.js`, `css/cahaya-feature-theme-v264.css`.
The entry cache version is 264 on 147 guarded HTML entrypoints. Production changes
are mirrored to `docs/`. No Firebase Rules, scoring or staff workflow changes.

## Wali information architecture

- Portal wording is about reports and ananda, never a personnel workspace.
- Kabar Ananda and Laporan Mentoring Pekanan are quick actions. Existing permitted
  academic reports and Perizinan are also accessible; desktop has the two new
  explicit shortcuts without replacing its existing report content.
- Informasi Penting is split into Kalender Wali, Jadwal Pembelajaran, Program
  Harian, Perizinan Khusus, Penitipan Barang and Tata Tertib Pesantren.
- These six routes reuse `informasi-penting.html?section=…`. The old aggregate
  permission grants its six children, and the old URL still works as a bookmark.
  The tab strip is hidden in a section route and unrelated schedule reads are
  not started. Existing administrator permissions are preserved.

## Laporan Mentoring Pekanan

Route: `wali/dashboard/mentoring-pekanan.html` (read-only, canonical Wali guard).
Source remains `cahaya_app/log_mentoring_naqib`; no new database or writes.
The linked child comes from `CahayaWaliSession` and the existing account profile,
never URL parameters. Records are projected through
`js/wali-mentoring-model-v2.js` and exact normalized child matching.

Displayed: date, child, usrah, Mentor, clarified CAHAYA with the authoritative
indicator/options registry, optional dimension clarification notes, gratitude,
PERBAIKI/TINGKATKAN, growth target, strong why, strategy and existing target result.
Internal `catatanMentor` and unrelated fields are deliberately not displayed.
Missing legacy data remains explicitly unavailable, never fabricated or scored.

Compatibility: `namaSantri` / `santri` / `studentName`, `tanggal` / `mentoringDate`
/ timestamp, current/legacy target fields and `checkinCahaya`. IDs are deduplicated
when the same session matches more than one alias query. `hasilTarget` is read from
the existing session, not copied into a separate report record.

Calendar defaults to the first day of the current month through today. Pekan Ini
means Monday through today. Dates are inclusive and normalized in Asia/Jakarta;
timestamps just after midnight WIB do not shift to the previous date.

## Read strategy and limitations

Three child-equality queries (up to six when stored name capitalization differs)
are issued only after opening the report and validating Wali scope. Each query is
on an existing child-name field. Calendar filtering is local over that child's
records, since RTDB cannot combine a name equality and a separate date range in
one query on the existing flat schema. It never deliberately reads the entire
pesantren mentoring root without a child predicate. Data is cached for the open
page only; reopen/refresh reloads it.

Firebase production access/index configuration was not changed or live-tested.
Rules must permit the existing child-scoped reads; errors remain visible and are
not misrepresented as an empty history. Older records with no supported child
identity, or nonmatching historical spelling, cannot safely be inferred.
Client guards do not replace server-side Firebase Rules.

## Verification (offline browser fixtures, never production writes)

- All role menu routes load the shared theme without runtime errors.
- 22 staff role/assignment Home variations at 409×720 and 456×720: no document
  overflow, no intersecting cards, text remains inside cards, one bottom nav,
  zero operational Home reads, working role switching and existing feature links.
- Representative feature pages, forms and dialogs at 409, 456 and 1440 pixels:
  no horizontal overflow; 13 feature destinations exercised.
- Legacy and Role V2 Wali sessions: six separate information routes, Kabar sheet,
  linked-child mentoring, other-child exclusion even with malformed fixture data,
  query-parameter spoof resistance, denied-read error state, explicit date filter,
  internal Mentor note exclusion and no writes.
- Pure contract tests cover legacy field adaptation, date boundaries/WIB,
  same-record result projection and root/docs synchronization.

The fixture coverage is not a claim of live Firebase permission verification or
pixel-identical rendering on every device/font setting.

The broader legacy `role-v2-entry-guards.cjs` suite did not finish: its Naqib
attendance fixture still expects the removed `pickProgram` function and
`#loading.show` selector. The current attendance page uses the V2 scene engine.
No attendance business logic was altered to satisfy this obsolete fixture.
The dedicated Wali unauthorized-access browser test and 19 canonical role
contract tests passed independently.
