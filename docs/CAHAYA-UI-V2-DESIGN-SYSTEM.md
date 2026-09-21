# CAHAYA UI V2 — shared visual system (release 260)

## Scope and integration

Presentation only. `css/cahaya-ui-v2.css` owns tokens and responsive components;
`js/cahaya-ui-v2.js` adapts existing markup without replacing business IDs, handlers,
forms, permission checks, or data contracts. The existing parser-blocking
`js/role-entry-v2.js` loads this local layer. Its authorization verdict and inert
denial mechanism are unchanged. All 146 existing HTML entry imports are versioned
to `260`; their existing docs mirrors are synchronized.

No Firebase SDK calls, network queries, session writes, scoring, record migration,
or timers are introduced by the presentation adapter. No new image/font library.
Original role styles remain as compatibility fallbacks; the new layer is explicitly
namespaced under `html.cahaya-v2` rather than globally replacing generic classes.

## Audit / adaptation map

| Existing family | Shared treatment | Deliberately preserved |
| --- | --- | --- |
| Guru / Naqib hub | Brand, hero, readable 2-column mobile cards, icons, menu rhythm | Existing buttons, menu IDs, schedules, role semantics |
| `me-*`: Managers / Supervisor / Director workspace | Compact headers, filters, record cards, evidence metrics, sheets | All queries, mutations, finding contracts, escalation ownership |
| Director `exec-*` | Restrained white primary cards and wider executive whitespace | Four priorities and six secondary destinations |
| Counselor `ks-*` | Queue cards, buttons, forms, calendar controls, modal | Case routing, privacy, points and ownership |
| Mentor `mu-*` | Two-feature Home, progressive forms, history / result sheet | All CAHAYA definitions and optional dimension notes |
| Dapur / Media `dv-*` | Home, logbook, checklist, target cards, forms | Draft/Final, daily/weekly upserts, authoritative storage |
| Supervisor permit `sp-*` | Feature header, review controls, decision sheet | Target-role permission, actual permit decisions |
| Naqib `c2-*` / `nq-*` / attendance | Shared surfaces, touch-size input choices, readable roster | Status choices, program whitelist, point values, occurrence identity |
| Guru Mukim, local legacy journal/checklist/stock/media | Scoped wrappers, fields, buttons, horizontally scrollable tables | IDs, original roster/settings/attendance and save handlers |
| Sarpras / Kesehatan / Layanan Home fallback | Identity/brand + existing role-workspace guide | No new Home route, operational grants or business features |
| Wali | Existing standalone portal retained; safe shared tokens/controls where present | `namaAnak` mapping and own portal navigation |

Two historical fixed-screen styles used 6–9px labels. They are overridden with
normal document flow, readable cards and vertical scrolling. Horizontal page
overflow is not allowed; wide tables scroll inside their own accessible region.

## Tokens

| Token family | Decision |
| --- | --- |
| Canvas / surface | `#f5f9fe` / white; subtle light-blue gradient |
| Heading / text / muted | `#12345b` / `#34516f` / `#647b95` |
| Primary | `#176bda` |
| State colors | Green success, amber attention, red rejection/error, blue information, gray neutral |
| Spacing | 4, 8, 12, 16, 20, 24, 32px |
| Radius | 12px controls, 20px cards, 28px large surfaces |
| Typography | Local Inter/system stack; body 14px, caption 12px, page 24px, section 20px, Home 27–30px |
| Weights | 400 body, 500–600 supporting labels, 700 headings, 800 brand only |
| Touch | 44px controls; 58px bottom-nav items |
| Navigation | 76px plus safe-area inset, one shell-owned nav |
| Width | 1080px feature cap, 1000px Home, 1120px executive Home |
| Breakpoints | 480px mobile; 768px tablet; desktop grids above 768px; existing shell sidebar breakpoint retained |
| Motion | 180ms microinteractions; respects reduced-motion |

Execution pages prioritize readable actions/forms. Management uses more compact
operational cards. Director uses restrained white cards and wider desktop spacing.

## Shared component behavior

- Brand/header and local identity require no operational reads. Existing avatar
  actions remain wired. Redundant name/role chips are hidden only visually.
- The shell's existing role picker is reused, not rebuilt. Owned canonical roles,
  active assignment updates, cached-frame disposal and routes remain authoritative.
- Role picker: bottom sheet on mobile, centered desktop, active selection marked,
  Escape/backdrop close, focus containment and restoration.
- Single-role label remains disabled without a false chevron.
- Bottom nav routes are untouched. A presentation-only current marker prevents
  two highlighted items when legacy global shortcuts share a fallback destination.
- `ui-*` adapters cover cards, icon tiles, form fields, buttons, states, filters,
  tables, overlays/dialogs, toasts and evidence metrics. Primary navigation uses
  inline stroke SVGs, not an external icon package.
- Toasts use live-region semantics. Loading/error/success surfaces get a visual
  tone without changing stored status values. Existing retry actions are preserved.
- Shared dialog focus management delegates dismissal to existing close handlers;
  no business submission handler is intercepted.
- `CahayaUIV2.confirm({title,message,confirmLabel,danger})` returns a boolean Promise.
  It is used by the existing Media URL deletion action. Batal, Escape, backdrop,
  pagehide or role suspension resolve false. Concurrent confirmation requests fail
  closed. No native synchronous confirm is globally overridden.
- Existing modal controls, save button states and form validation remain owned by
  each feature. Browser zoom restrictions are removed for accessibility.

## Tests and visual review

`tests/global-ui-v2-browser.cjs` captures 13 Home states and 13 representative
feature states at **409×720, 456×720, 1440×720**, using isolated Chrome contexts and
mocked external/Firebase requests. It checks document width, interactive-element
bounds, a single nav, current Home marker and accessible modal bounds. Home bottom
sections are also captured. All 13 Home fixtures log zero operational reads.

Feature samples: Manager evidence KPI, findings, directory, coaching + modal;
Mentor calendar history; Dapur logbook/checklist; Media targets/legacy URL + cancel
confirmation; Guru Mukim table; Counselor queue; Supervisor permit review;
Director KPI evidence. No real permits, cases or personnel records were changed.

Artifacts: `/tmp/cahaya-ui-v2/` (screenshots, before/after JSON, contact sheets).
Use `UI_BEFORE=1` to capture the old CSS baseline with the shared layer disabled.
Use `UI_FEATURES=1` to run feature sampling. All traffic outside the local fixture
server is mocked. Do not run these fixtures against a production browser session.

Passing regression coverage during this patch:

- Role-switch browser test: owned roles, single-role label, correct Homes,
  assignment, old-frame disposal, bottom KPI, Escape, three picker viewport sizes.
- Manager Education stability at 409 and 456: findings and Guru Mukim round-trip;
  Home=0 reads, control=3, Mukim initial=3 / refresh=1, KPI=3 in its populated fixture.
- Naqib Home: exact 4 quick + 7 secondary, zero operational network.
- Naqib attendance: 16 approved programs, scoped roster, local-only Hadir Semua,
  numeric zero points, duplicate-safe saved occurrence and denied zero-read.
- Mentor session/result saves, Counselor routing/escalation/higher-authority
  response, Dapur Draft/Final/checklist, Media daily/weekly upsert and URL behavior.
- Role System V2 19 authorization/assignment tests; Manager routing and contracts;
  findings normalization; Supervisor, Director, permit, Dapur, Media and Mentor
  contract tests; shared UI no-data-write / mirror checks.

Older date-sensitive browser fixtures use `tests/fixture-calendar.cjs` as a preload
to keep their mocked 18 September 2026 calendar deterministic. Production date
helpers are not modified. The old Naqib one-screen assertions were updated to the
new readable, scrollable visual contract; data assertions were retained.

## Known limitations / manual review

- Sarpras, Kesehatan and Layanan still use the existing generic Home/workspace.
  The role guard still returns `ASSIGNMENT_ADAPTER_REQUIRED` for certain legacy
  operational routes (for example Sarpras checklist and Layanan ledger). This UI
  task does not grant access or implement missing role adapters.
- `tests/role-v2-entry-guards.cjs` contains an obsolete expectation that NAQIBAH
  must be denied `pusat-asesmen/santri.html`; the current existing role contract
  correctly permits it. That old test times out at this assertion. Permissions
  were not changed to satisfy the stale test.
- 146 entrypoints inherit shared UI, but every historical data/print/export state
  was not visually exercised. Review legacy operational pages once their valid
  role adapters/sessions exist, especially wide populated tables and print views.
- Wali's independent portal and external embeds retain their own specialized
  layout; a full Wali redesign was intentionally not attempted.
- Native confirmations on other unreviewed legacy pages remain native. Async
  callers can adopt the shared confirm without changing business semantics later.
- Tests are local/mock QA, not a new live Firebase audit; user had paused live QA.

## Maintenance

Run `node tools/sync-global-ui-v2.cjs` for mechanical entry cache-version and
root/docs synchronization. Run `node tests/global-ui-v2-contract.cjs` to verify
mirrors, versioned entries, no presentation data/session writes, and the final
Manager Character menu placement. Do not add selectors that clear user inputs,
replace form IDs, fetch data, or infer permissions.
