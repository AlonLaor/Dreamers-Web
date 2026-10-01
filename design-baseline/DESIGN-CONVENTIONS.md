# Existing visual identity

Recorded 2026-09-22 from the production page source and browser baseline. These are preservation constraints, not a new design system.

## Typography and direction

- Hebrew content and RTL layout are foundational. Keep visual order, icon direction, and carousel movement consistent with RTL.
- Heebo is the main font, loaded from Google Fonts in weights 300 through 900. Playfair Display is used for selected accent/quotation treatments.
- Typical section headings use `.h3d`: weight 900, line-height 1.2, layered text shadows. The homepage uses `clamp(1.9rem, 3.5vw, 2.9rem)` for these headings.
- Supporting copy commonly uses a 1.9 line-height. Preserve explicit Hebrew line breaks and intentional emphasis.
- `text-wrap: pretty`, balanced headings, and `no-orphans.js` affect line endings. Do not remove them during a shared-style extraction.
- Desktop CSS requests a 17px root above 768px, but the accessibility widget overrides it with 100% on load. Preserve the captured appearance until that issue is addressed separately.

## Palette

| Role | Value |
| --- | --- |
| Primary blue | `#004378` |
| Dark blue | `#002952` |
| Teal | `#48d9d3` |
| Light teal | `#7de8e4` |
| Gold | `#f5a623` |
| Light gold | `#ffd166` |
| Main text | `#1a2d3e` |
| Secondary text | `#4a637c` |
| Muted text | `#7a99b0` |
| White / cool / warm surfaces | `#ffffff` / `#f6faff` / `#fffbf3` |
| Thinking / acting / relating / meaning | `#2dc0d2` / `#79b850` / `#7791cc` / `#faa33a` |

Main blue gradient: 140deg, `#002952` at 0%, `#004378` at 55%, `#0c6080` at 100%.
Teal and gold gradients run at 135deg using their base and light colors.
Homepage-specific green `#1b7226` and cyan `#66ffff` are intentional exceptions.

## Layout and shape

- Main `.wrap` commonly has max-width 1240px and 2rem horizontal padding.
- Large section padding is usually 6 to 8rem. Individual sections and mobile layouts override this; do not normalize all values blindly.
- Cards use rounded corners, commonly 18 to 26px, and soft shadows. Buttons use pill shapes, commonly 50px radius. Carousel controls are circular.
- Preserve dark translucent navigation, white branding, teal navigation CTA, blue/gold action buttons, and existing hover elevation.
- Preserve the large wave hero, photographic crops, star backgrounds, original poster artwork, and logo/slogan proportions. Do not recreate branded artwork as approximate CSS.
- Maintain existing section sequence and generous whitespace.

## Shared patterns to preserve during later refactoring

Navigation and mobile accordion; footer branding/social links; `.wrap`, `.h3d`, `.sub`, `.btn`; card and testimonial treatments; contact form fields and multi-select; virtue boards; carousel arrows and pagination dots; scroll reveal.

The shared appearance currently comes from copied CSS/HTML. Extract unchanged declarations first, maintaining cascade order and intentional page variations.

## Responsive behavior

- 1024px: intermediate navigation/grid adjustments.
- 768px: mobile menu and stacked content, form rows, and footer.
- 520 to 640px: phone gutters, cards, and carousel changes.
- Additional section breakpoints include 600, 620, 720, and 900px.
- Program artwork swaps around 861px. Desktop uses original artwork while alternate markup is visually hidden; mobile exposes the live layout.
- Carousel counts can be driven by `--car-per-view` and `--fac-per-view`. Keep CSS and JavaScript in agreement.

## Motion and interactions

Scroll reveal uses `.rev` and `.in`. Existing motion includes hero video, gold particles, parallax, counters, card tilt, virtue flips, and carousel transitions. Preserve character and timing unless explicitly changing motion/accessibility. Reduced-motion handling is currently partial.

## Review checklist

- Same logo, slogan, imagery, palette, shadows, radii, and button treatment.
- Same Hebrew text wrapping and hierarchy at matching viewport sizes.
- No accidental horizontal overflow or clipped menu/form controls.
- Desktop and mobile retain their existing content order and image crops.
- Refactors do not silently change default font size, container width, or spacing.
- New sections reuse the closest existing pattern and palette.
