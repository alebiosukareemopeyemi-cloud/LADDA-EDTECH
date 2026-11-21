# Ladda design system: trail map and passport

Ladda is a skill roadmap with verifiable credentials. The roadmap is a contour-map trail. Each skill is a waypoint. The end of the trail is a signed credential shown as a paper passport page.

The UI is dark forest and black. The credential is the only light surface in the product. That contrast is the point: the passport is the thing you carry out of the app.

This replaces the Division 1 "Neon forest, glass and depth" direction. Pages are not rebuilt yet. Where an old page still uses a retired class or motion preset, it keeps working and shows no animation.

## Colour

| Token | Hex | Use |
| --- | --- | --- |
| night | #050B08 | Page |
| understory | #0B1812 | Surfaces |
| line | #16301F | Hairlines |
| line-strong | #2B4A39 | Raised edges (decorative only) |
| moss | #047857 | Gradient start |
| volt | #BEF264 | Verified, primary accent, focus ring |
| lake | #7FD8C4 | Known |
| kola | #F2A93B | Seal, needs work |
| ember | #FF6B57 | Invalid, error |
| paper | #E9EDDF | Credential only |
| text | #EDF2E4 | Text |
| text-soft | #C9D6CC | Secondary text |
| text-mute | #A7B8AB | Hints |
| node-mute | #6E8A7A | Todo and locked nodes, input edges |

Primary CTA: `linear-gradient(100deg, #22A06B, #BEF264)` with text `#04110A`. Everything else is flat. No glow, no glass.

## Type

- Display: Barlow Condensed 500, 600, 700 (`--font-display`). Headlines at 700, line height 0.95 to 1.05. Waypoint names at 600, 22px.
- Body: Barlow 400, 500, 600 (`--font-body`). All app text, 17px, line height 1.6.
- Serif: Newsreader, variable, normal and italic (`--font-serif`). The credential page only.
- Data (hashes, IDs, hours) uses the system monospace stack. No fourth webfont.

Max line length 65ch (`measure`). Sentence case everywhere. No all-caps labels, no tracked eyebrows.

All fonts come from `@fontsource` packages through `next/font/local`. Nothing is fetched at build or run time.

## Layout per register

- Roadmap: full-bleed contour map (`contour` utility). A dotted trail winds across it; the finished stretch is solid volt with a soft glow. Waypoints sit on the trail.
- App screens: a flat sticky top bar (56px, in the page flow so it never covers content), left-aligned content on night, panels on understory with a hairline.
- Credential: a centred paper page (`passport`), near-sharp 6px corners, serif text, kola seal top right.

## Node markers

`components/NodeMarker.tsx`, SVG. Shape carries the meaning; colour only backs it up.

| State | Shape |
| --- | --- |
| Verified | r17 filled circle (gradient), dark check, planted flag above |
| Known | r17 circle with a dashed lake edge, cairn of three bars inside |
| In progress | r22 ring, volt progress arc driven by percent, centre dot, beacon ring |
| Not started | r15 hollow circle, thin node-mute edge |
| Locked | rotated diamond, hatched fill, lock icon, 85% opacity |

`selected` adds a dotted volt halo (r84) and a dotted leader line to the label. Labels are Barlow Condensed 600 at 22px.

`lib/node-shapes.ts` lists each state's silhouette, edge, glyph and fill. `npm run test:greyscale` fails if any two states differ in fewer than two of those features. `/design` has a greyscale toggle for a visual check.

`components/Trail.tsx` draws the route: dotted base, then the finished part in solid gradient over a blurred glow.

## Motion

Three moments, and no others. All of them are off under `prefers-reduced-motion`.

1. The trail draws itself (stroke-dashoffset, `trailDraw`).
2. The unlock chain: the next nodes light up in sequence (`unlockChain`, `unlockStep`).
3. The seal stamps onto the credential (`sealStamp`: scale 1.7 and rotate -16 to rest, 0.55s, `cubic-bezier(.2, 1.5, .4, 1)`).

Allowed exceptions that are state, not decoration: the beacon ring on an in-progress marker (part of the marker spec; frozen to a faint static ring under reduced motion), and the loading shimmer. No fade-up entrances, no hover-lift on cards.

`usePlay()` and `usePlayProps()` in `lib/motion.ts` gate each moment. `MotionProvider` also sets `reducedMotion="user"`. Old presets (`fadeUp`, `pop`, `container`, `hoverLift`, pulses) are exported as inert no-ops until each page is rebuilt.

## Components

- Buttons: pills, 48px (`btn`) or 54px (`btn-lg`). `btn-primary` (gradient), `btn-secondary` (outlined), `btn-ghost`.
- Inputs: `field`, pill, edge in node-mute so it reaches 3:1. Textareas use a small radius.
- Chips: `chip`, `aria-pressed` for selected.
- Badges: `badge-verified|known|progress|todo|locked|needs-work|invalid`. Each carries an icon or a dashed edge, not colour alone.
- Focus: 2px volt ring, 3px offset, on every interactive element.

Radius follows hierarchy: pills for controls, 20px for panels, 12px for inner blocks, 6px for the passport.

## Rules

1. No repeated identical card grids.
2. No all-caps tracked eyebrow labels.
3. No numbered markers unless the content is a sequence.
4. No arrow appended to buttons.
5. No single highlighted word in a headline.
6. No fade-up on sections. Motion is the three moments above.
7. Glow only where the CTA gradient already is. Nothing glows else.
8. Serif only on the credential.

## Accessibility

Contrast computed on the real tokens (all text 4.5:1 or better):

- text on night 17.4, on understory 16.0; text-soft 12.1; text-mute 8.7 on understory
- `#04110A` on the CTA gradient start `#22A06B` 5.8, on volt 14.8
- volt on understory 13.9, lake 10.9, kola on night 9.9, ember 6.5 to 7.1
- node-mute on night 5.3, on understory 4.8 (needs 3 for edges and icons)
- passport: ink on paper 15.3, ink-soft 7.3, ink on the kola seal 9.1

`line` and `line-strong` are decorative hairlines (1.9:1) and never the only sign of a control's edge.

Focus is always visible. Reduced motion disables CSS animation, transitions and all framer-motion moments. Markers expose `role="img"` with the name, state and percent.

Known gap: the slide-out menu has `role="dialog"` but no focus trap.
