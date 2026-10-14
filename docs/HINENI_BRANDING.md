# HINENI visual identity

Implemented 2026-10-13 in the existing Next.js app. The named `hineni-brand-reference.png` was not present in the workspace; the attached reference image guided the original vector geometry. No backend logic, database schema, environment values, deployment, or user data were changed.

## Assets

All exports live in `apps/web/public/branding/`:

- `hineni-logo-horizontal.svg`, `hineni-logo-dark.svg`: transparent horizontal logo for dark surfaces.
- `hineni-logo-light.svg`: horizontal logo for light surfaces, with darker gold for readability.
- `hineni-logo-vertical.svg`, `hineni-logo-vertical-light.svg`: symbol, Hebrew, English, meaning and tagline.
- `hineni-hebrew.svg`: Hebrew-only wordmark.
- `hineni-symbol.svg`, `hineni-symbol-light.svg`: detailed arch, radiant light, mountains and winding path.
- `hineni-favicon.svg`: simplified arch/star only, with no text.
- `hineni-app-icon.svg`, `hineni-app-icon.png` (1024), `hineni-icon-512.png`, `hineni-icon-192.png`, `apple-touch-icon.png` (180): native/PWA artwork, with opaque square canvases for platform masking.
- `favicon-16.png`, `favicon-32.png`, `favicon.ico` (16/32/48): small simplified icon exports.
- `hineni-og.svg`, `hineni-og.png` (1200×630): social sharing artwork.
- `fonts/NotoSerifHebrew.ttf`, `fonts/OFL.txt`: open-license Hebrew font and its required license notice. Font is embedded in SVG exports; Hebrew remains valid Unicode text rather than traced reference lettering. Raster rendering may use the platform serif fallback if the SVG engine does not support embedded fonts.

The exact spelling is `הִנֵּנִי`: Hebrew letter order he, nun, nun, yod with the supplied niqqud. SVG uses `direction="rtl"`, `unicode-bidi="embed"` and centered text anchoring. The raster previews were inspected for right-to-left letter order and mark visibility. No distorted reference-image lettering was traced.

Regenerate assets using `node scripts/generate-hineni-branding.mjs`. This uses the already installed Sharp dependency, without additional image-processing packages. The generator writes standard ICO entries with PNG payloads. Keep the font license when distributing assets. Source SVG geometry and generator color values should be updated together when the approved identity changes.

## Application integration

`packages/shared/src/branding.ts` centralizes runtime asset paths, brand names, meaning, taglines and approved navy/gold/ivory/white. Shared palette tokens consume those colors. Light-theme gold text retains a darker contrast-safe gold variant.

`components/branding/brand-logo.tsx` chooses dark/light assets through CSS with stable server/client markup, preserving intrinsic aspect ratios. Small phone headers use the symbol; wider headers use the horizontal lockup.

Integrated in header, footer, mobile navigation drawer, homepage hero, sign-in/registration card, and locale loading screen. Existing Bible, music, narration, authentication and API components remain connected.

Locale metadata includes HINENI titles, SVG/PNG/ICO favicon links, Apple touch icon, manifest and social images. `/icon.svg` redirects to the new simplified symbol. `/manifest.webmanifest` is a real Next.js manifest; it does not add offline caching or a service worker.

`apps/mobile/` exists but is empty: no native project/app configuration was available to update. The 1024 PNG and vertical SVG are ready for later native app and splash integration.

## Validation and remaining review

Created source files: `scripts/generate-hineni-branding.mjs`, `apps/web/src/components/branding/brand-logo.tsx`, `apps/web/src/app/[locale]/loading.tsx`, `apps/web/src/app/manifest.ts`, and this document. Generated files are listed above.

Modified source files: `packages/shared/src/branding.ts`, `packages/shared/src/tokens.ts`, `apps/web/src/components/layout/site-header.tsx`, `site-footer.tsx`, `nav-links.tsx`, `apps/web/src/components/auth/auth-card.tsx`, `apps/web/src/app/[locale]/page.tsx`, `apps/web/src/app/[locale]/layout.tsx`, and `apps/web/src/app/icon.svg/route.ts`. Progress recorded in `docs/IMPLEMENTATION_STATUS.md`.

- TypeScript, ESLint, all 54 current unit tests and production build passed.
- Raster previews of the dark/light logo, app icon and magnified 16px favicon were inspected. Hebrew text order and small-icon simplification were checked.
- 19 asset HTTP checks passed, with verified PNG sizes, no text elements in the favicon SVG, standard three-image ICO structure, manifest identity/theme, and logo/social metadata on six English/Mongolian/Hebrew/authentication/Bible pages.
- Interactive browser access was unavailable. Actual desktop/mobile layout, CSS theme switching, logo-font rendering in target browsers and install/share previews still need browser/device review. No claim of complete accessibility or worldwide brand/legal clearance is made.
