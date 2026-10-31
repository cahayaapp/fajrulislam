# Home mobile CAHAYA — v262

Reference: user attachment `codex-clipboard-28b18dc1-7131-4bd0-87f9-9524fe5cf5f0.png`.

## Presentation contract

- One shared mobile Home renderer: `js/mobile-home-v2.js`, with `css/mobile-home-v2.css`.
- Enabled at widths up to 768px, injected by the existing presentation layer into authorized Home pages. Desktop compositions and feature-page forms remain unchanged.
- Light-blue luminous canvas, existing CAHAYA logo and real account identity, mosque hero, glossy blue/teal/purple quick actions, two-column white menu cards, inspirational banner and the existing single bottom navigation.
- No phone frame, fake status bar, fake avatar, fake unread badge or new business action.
- Menus come from the existing Role V2 menu model. Role-specific priorities are local presentation preferences, never additional permissions. Existing Guru schedule, leave and activity sheets are reused.
- Wali retains its own authorized sidebar, navigation and `namaAnak` mapping. Only already-visible Wali destinations are used.
- At 409×720 and 456×720 the Home itself is fixed without scrolling. At most eight secondary cards are presented; capacity decreases on shorter screens. All authorized destinations remain available through **Lihat Semua / Lainnya**. The expanded menu may scroll independently.
- Long identity names use two lines; their supporting sentence is omitted to preserve the role chip and date. Full name remains in the title attribute. Role switch reuses the existing parent picker.
- No Firebase calls are added by this renderer. Existing Wali Home data-loading behavior is unchanged.

## Artwork

Production asset: `assets/cahaya-app/home-mosque-v262.webp`, mirrored in `docs/assets/cahaya-app/`. Approximately 49 KB; shared by hero and banner. Generated with the built-in imagegen tool, then encoded as 1200px WebP for delivery. Existing branding was not replaced.

Final generation prompt:

> Use case: stylized-concept. Asset type: production background illustration for a premium Indonesian Islamic school mobile app Home hero, not a UI mockup. Create a very wide 3:1 landscape with majestic elegant white mosque domes, slender minarets and palm trees concentrated in RIGHT HALF, luminous powder-blue morning sky with pearlescent clouds, serene light rays, tiny gold architectural details. LEFT HALF predominantly soft pale blue and white airy mist with ample quiet empty space for readable navy UI text to be overlaid later. At bottom right only add an elegant curving deep azure/teal Islamic arabesque ribbon edged with very fine gold trim. Luxurious polished realistic illustration; airy bright blue-white palette, soft bloom, beautiful detailed building. Absolutely no letters, text, logos, watermark, people, interface, cards or phone frame. This will match the supplied user's CAHAYA Home reference through its mosque scene, luminous blue tones and decorative lower-right flourish.

## Verification

`tests/mobile-home-v2-browser.cjs`: staff roles and assignment variants, fixed-screen geometry, horizontal/vertical overflow, card/content/banner boundaries, identity/date separation, minimum card touch height, one navigation, local Home read count, drawer interaction, card routing, Home return, role switching and desktop preservation.

`tests/wali-role-v2-browser.cjs`: canonical and legacy Wali fixture, both mobile widths, original child linkage and academic access regression. Firebase is mocked; no production writes.

The screenshot is a visual reference, not a pixel-identical fixed bitmap: menu content, names, permission-dependent destinations and density adapt to the active role and usable viewport. Desktop remains the existing interface.
