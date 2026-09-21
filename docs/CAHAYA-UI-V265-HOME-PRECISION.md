# Home V265 — header, date card, Wali and desktop

- Header has separate, explicit rows for branding and greeting. The date card
  straddles the lower edge of the navy banner, with space reserved before actions.
- Only one title per section: Akses Cepat Hari Ini and Menu Lainnya (Laporan Ananda
  for Wali). Repeated uppercase eyebrow titles were removed from the markup.
- Desktop now uses the same shared Home renderer, scaled to its available width:
  navy banner and date above, quick actions and secondary tiles alongside each other.
  Legacy Home composition is hidden, not duplicated or deleted. Feature controllers,
  dialogs, routes, permission checks and all Firebase logic remain unchanged.
- Wali bug reproduced: `js/cahaya-responsive-v24.js` assigned `cahaya-grid-fix`
  to the new masthead, whose decorative overflow triggered its legacy width repair.
  The associated auto-fit grid changed the header into columns at wider widths.
  Home now declares one masthead column and explicit branding/greeting rows, with
  full-width sizing that overrides that legacy repair. Names remain white.
- Cache release 265: Home assets and UI loader plus existing guarded entrypoints.
  Production files are mirrored in docs. Feature theme V264 remains unchanged.

Verification uses local Chrome and mocked Firebase only, with no production writes.
Browser checks cover mobile/desktop sizes, header-row order, floating date geometry,
single section titles, card intersections, overflow, existing navigation, Wali
reports/child scope and role switching. See the existing browser test scripts for
the assertions. No claim of live Firebase or pixel-identical font/device rendering.
