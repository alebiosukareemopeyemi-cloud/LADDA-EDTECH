# Ladda design system

Ladda helps Nigerian students and graduates prove backend skills with verified projects and a signed credential that employers can check without an account. The design has one job: make "verified" feel earned and trustworthy.

Direction (locked): keep the Neon forest identity, gradient #047857 to #BEF264 on near-black. Elevated layout plus bold dark glass and depth.

## 1. Audit of the previous system

What felt generic:

- Bricolage Grotesque, Instrument Sans and JetBrains Mono: a fashionable startup trio with no link to the product.
- Near-black plus one acid lime accent is the most common dark-mode look. The only second colour was destructive red, so "needs work" had no voice.
- Every surface was the same `card` colour with the same ~28px radius. Buttons, chips, cards and inner blocks differed only in size.
- `tag-label` was all-caps, tracked, mono, and sat above almost every block ("Rung 01", "Exhibit A").
- Numbered pins and "No. 001" tags appeared where content was not a sequence.
- The design page repeated one card in a grid of five.
- Hardcoded hex in AppShell (#BEF264, #0B100D, white/10) instead of tokens.
- Glow and gradient were on hero text, CTA and cards alike, so nothing was special.
- Hero headline used the one-gradient-word trick ("Get hired.").
- No surface levels, so depth came only from borders.
- Dark-mode `--border` was a faint alpha with no elevation story.

## 2. Plan

### Colour (six names)

| Name | Hex | Role |
| --- | --- | --- |
| Pitch | #050E0A | Page background. Near-black tinted green. |
| Canopy | #0C1B14 | Raised surfaces. Cards and panels sit on this. |
| Moss | #047857 | Gradient start, links on dark, verified edges. |
| Volt | #BEF264 | Gradient end, primary action, focus, in-progress. |
| Kola | #F2A93B | Needs work, and the credential seal. Named for the kola nut. Only warm colour. |
| Bone | #EDF2E4 | Text. Warm green-white, never pure white. |

Gradient (Moss to Volt) is reserved for: verified fill, primary CTA, the credential seal ring. Nowhere else.

Surface levels: s0 Pitch (page), s1 Canopy (panels), s2 lifted (inner blocks, inputs), s3 overlay (menus, popovers, opaque). Each step is lighter and gets a crisper top edge highlight rather than a bigger shadow.

### Type (two families plus data)

- Display: Anybody, a variable face with a width axis. Headlines are set wide (`wdth` 125) and heavy with tight tracking. Section titles go narrower (`wdth` 100). Width is the design move, not colour.
- Body and UI: Onest, a quiet grotesque with good small-size forms. 400, 500, 600.
- Data: the system monospace stack, only for hashes, IDs, hours, scores. No download, no third webfont.

Scale (rem): 0.8, 0.9, 1, 1.125, 1.375, 1.75, 2.5, 3.5, 5.5 (hero, clamp). Body line-height 1.55. Max line length 68ch (`measure` utility). Headings 1.0 to 1.1.

### Layout per register

Landing. Left-aligned, asymmetric. A thin vertical "rail" runs down the left of the page; sections hang off it at different offsets, like rungs. The hero headline is set huge and wide on the left, and the ladder scene sits right, overlapping the headline's last line slightly. Sections never share a layout: one wide statement, one split, one list with a pinned label, one single founder card.

```
| rail
|  Pick right.            [ ladder scene ]
|  Learn real.
|  Get hired.   (wide, heavy)
|--- statement, full width, one sentence
|--- split: sticky label | list
```

App screens. Left-aligned. Floating glass pill nav, centred at the top, detached from the edge. Below it one dominant surface (the next step) and a quieter rail of secondary items at lower contrast. Density rises on the right.

```
        ( menu | Ladda | Roadmap Opportunities | avatar )   glass pill
  [ your next step: large s1 surface        ]  [ quiet rail ]
  [ the road: full bleed                    ]
```

Credential and verify page. Centred single column, the only centred layout. A near-sharp (4px) glass document on a faint grid, amber seal at the top right, result stated first (Valid, Revoked, Invalid), then the AI summary, then evidence, hashes in mono at the foot.

```
        +--------------------------------+
        | Ladda credential        (seal) |
        | Valid                          |
        | summary                        |
        | evidence ...                   |
        | signature  a91f...             |
        +--------------------------------+
```

### Principles

1. Verified is the only thing that glows. Everything else is flat and crisp.
2. Depth comes from surface level, not drop shadows everywhere.
3. Headlines are shapes. Width and weight do the work, not an accent word.
4. Amber means a human looked: needs work, or sealed.
5. One orchestrated motion moment per page. Responses to the user's actions can animate.
6. Words say what happens. Sentence case. No decoration.

## 3. Review against generic defaults, and what changed

Checked each part against "what I would produce for any dark gradient edu-tech page":

| Draft | Problem | Change |
| --- | --- | --- |
| Display face Sora or Syne | Both are the agency default for dark sites | Anybody with the width axis, used as a headline device |
| Mono for labels and hours | Common tell for "technical" brands | Mono only for hashes, IDs, hours and scores. Labels are Onest |
| Amber as a general second accent | Becomes decoration | Restricted to needs-work and the seal only |
| Glass on cards and menus | The "glassmorphism kit" | Glass on three surfaces only: floating nav, tour narrator card, credential |
| Hero stat row (big number, small label) | Default hero treatment | Dropped. Hero is the headline and the ladder scene |
| Even three-column feature grid | Identical cards | Replaced by varied layouts per section |
| Gradient border on all cards | Decorative gradient | Gradient only on verified, primary CTA and seal ring |
| Menus as translucent blur | Glass overuse | Menus are opaque s3 |
| Centred hero | Default | Left-aligned. Only the credential page is centred |

## 4. Anti-template rules

1. No repeated identical card grids. If three items sit together they differ in size or form.
2. Radius follows hierarchy: pills for controls (buttons, chips, inputs), large (28px) for main surfaces, small (12px) for inner elements, near-sharp (4px) for the credential.
3. No all-caps tracked eyebrow labels. A label exists only when it names something the reader needs.
4. No numbered markers unless the content is a sequence (road nodes, how it works).
5. No arrow appended to buttons or links.
6. No single highlighted word in a headline.
7. No fade-up on every section. One entrance moment per page. Hover transitions only on things that act.
8. Glass on 2 or 3 surfaces only: floating nav, tour narrator card, credential.
9. Glow only on the hero and primary CTAs.
10. Line length under 80 characters (`measure` is 68ch).
11. No middle-dot meta strings, no "WORD — fragment" labels.
12. Monospace only for real data.

## 5. Tokens

Defined in `app/globals.css`. Use the token, never a hex.

- Colour: `--pitch --canopy --moss --volt --kola --bone` plus semantic `--background --card --primary --border`.
- Surfaces: `surface-0` to `surface-3` utilities.
- Radius: `--r-control` (pill), `--r-surface` (28px), `--r-inner` (12px), `--r-seal` (4px).
- Glass: `glass` utility. Three surfaces only.
- Glow: `glow` utility. Hero and primary CTA only.
- Motion: `lib/motion.ts`. Micro 150ms, standard 300ms, big 700ms, stagger 60ms.

## 6. Components

The glass secondary button is tint and hairline edge only, with no blur, so it does not count as a glass surface.

Button: `btn btn-primary`, `btn btn-glass`, `btn btn-ghost` (+ `btn-sm`). Inputs: `field`. Chips: `chip`, `chip-on`. Badges: `badge badge-verified|known|progress|todo|locked|needs-work`. Node states via `node` + `node-*`. Shell: `components/shell/AppShell.tsx`.

Node states:

| State | Look |
| --- | --- |
| Verified | Gradient fill, dark mark, the only glowing node |
| Known | Mint tint, outline |
| In progress | Volt ring with pulse |
| Todo | Muted outline |
| Locked | Dimmed, lock icon |

## 7. Microcopy

Sentence case. Verbs first. The same action keeps one name through its flow.

- Buttons: "Start free", "Sign in", "Check a credential".
- Statuses: Verified, Known, In progress, Not started, Locked, Needs work.
- Not built yet: "Coming soon". No "Soon" shorthand in new UI.
- Errors say what happened and what to do next.

## 8. Accessibility

Contrast computed for both themes (WCAG 2.1 AA). Dark: Bone on Pitch 17.2:1, on Canopy 15.6:1; muted text 6.7:1 at worst; Volt on Canopy 13.6:1; Kola on Canopy 8.9:1; Pitch on Volt 15:1. Light: muted 6.1:1 at worst, Moss on white 5.5:1, Kola text (#8A5200) on white 6.4:1.

Fixes from the review:
- Dark text on the gradient failed at the Moss end (3.6:1). Surfaces that carry text (`btn-primary`, `badge-verified`) use `--brand-gradient-text`, the same gradient shifted lighter, now at least 6:1.
- Input and chip borders were 1.7:1. `--input` is raised to about 3.3:1 in both themes (WCAG 1.4.11).
- The locked badge text uses the muted foreground, not the dimmed node colour.

Rules: focus ring is Volt (Moss in light), 3px, always visible. Default controls are 44px tall; `btn-sm`, chips and nav links are 36px (above the 24px AA minimum). `prefers-reduced-motion` disables CSS transitions and, through `MotionProvider`, all framer-motion transforms.

Known follow-up (behaviour, so out of scope here): the slide-out menu has `role="dialog"` but no focus trap or `aria-modal`.
