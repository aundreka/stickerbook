# Sticker Book Puzzle — Room Decor (Playable Ad)

A lightweight, self-contained HTML5 playable ad built with **Phaser 3** + **Vite** +
**TypeScript**. The player fills an empty line-art room with colored stickers by
dragging them from a bottom tray onto their matching outlines; the room is
revealed in full color as a payoff, then a **PLAY NOW** end card appears.

Built as **3 iterations** (different end-card trigger) × **8 ad networks** = 24
single-file outputs, each a self-contained `.html` (or `.zip`) under **5 MB** with
no runtime network requests.

---

## Gameplay / Controls

- **Drag** a sticker from the bottom tray onto its matching outline in the room.
  Each sticker and its slot share a **number badge**, so you match #N to slot #N.
  Correct → it snaps in place with a sparkle + sound and becomes part of the
  scene. Wrong → it slides back to the tray.
- Each **round** shows 3 numbered outlines + 3 numbered tray stickers. Place all
  3 to reveal the next set. 50 stickers across 17 rounds fill the whole room. The
  full layout (positions + scale) matches the provided reference image.
- **Onboarding:** an animated hand + dimmed overlay isolates the first sticker
  and shows where to drag it. After **5 s** of inactivity an idle hand hint
  reappears.
- **End:** when the iteration's condition is met, the room crossfades to full
  color and the end card shows. **Tapping anywhere** on the end card opens the
  store.

## Iterations (end-card trigger)

| Length  | End card appears after        |
|---------|-------------------------------|
| `10clk` | 10 successful placements      |
| `60sec` | 60 seconds (from display)     |
| `full`  | the whole room is completed   |

## Networks

Applovin (`al`), Google (`gg`), Ironsource (`is`), Mintegral (`mtg`),
Facebook (`fb`), Unity (`un`), Vungle (`vu`), Moloco (`mo`) are built. TikTok
(`tt`) is prepared in the pipeline but not emitted (`included: false`).

---

## Setup & Build

Requires Node 18+ (developed on Node 22).

```bash
npm install          # installs phaser, vite, sharp, ffmpeg-static, jszip, …
```

The repository already includes the optimized assets in `src/assets-webp/`. To
regenerate them from the source art in `src/assets/`:

```bash
npm run assets       # PNG -> WebP (sharp):  src/assets/Sprites -> src/assets-webp/Sprites
npm run audio        # MP3 downmix/trim (bundled ffmpeg via ffmpeg-static)
```

Develop / build:

```bash
npm run dev          # local dev server (full iteration)
npm run build        # single self-contained dist/index.html (full iteration)
npm run build:all    # ALL 24 variants -> dist/<length>/<Network>/
npm run typecheck    # tsc --noEmit
```

### Editing the sticker layout (visual tool)

`tools/sticker-editor.html` is a drag-and-drop editor for every sticker's
position, number-label position, z-index and scale.

```bash
npm run tool         # opens the editor in the browser
```

Select a sticker (dropdown or click), **drag it to move**, **scroll over it to
scale**, drag its number to move the label, or use the sliders. Then **Download**
the JSON (saves `layout.json`) and apply it:

```bash
npm run layout       # reads ./layout.json -> rewrites src/game/layout.ts
npm run build:all    # rebuild
```

The layout shipped here is matched to the reference image; the editor lets you
fine-tune any sticker (`{ id, x, y, labelX, labelY, zIndex, scale }`).

### Output layout (`npm run build:all`)

```
dist/
  index.html                          # standalone full single-file (quick open)
  10clk/  Applovin/ …_al.html  Google/ …_gg.zip  Ironsource/ …_is.html  …
  60sec/  …
  full/   …
```

Filenames follow the studio convention:
`sbp_mip_hpl_roomdecorvar1_01_cartoon_na_noseason_en_<length>_na_<tag>`
(3-letter code `sbp`, vendor `hpl`, concept `roomdecorvar1`). Naming fields live
in `scripts/build-all.mjs` (`NAMING`).

Every output begins with a line-1 network tag comment, e.g.
`<!-- ad-network: Applovin | al -->`. Google/Mintegral/Vungle are emitted as
`.zip` (one `index.html` at the zip root). Applovin/Ironsource/Unity inject
`<script src="mraid.js">`; Google injects `exitapi.js`; Mintegral adds
`onload="gameReady()"`; Vungle sets `window.__VUNGLE__`; Unity rewrites the
literal `window.top` → `window.self` (Luna static-scan requirement).

### The single self-contained file

`dist/index.html` (or any `…_fb.html` / `…_mo.html` variant) is fully
self-contained — all images (WebP) and audio (MP3) are inlined as base64, no
`type="module"`/`crossorigin`, no `console.error`, no external requests — and
runs by opening it directly in a browser (`file://`).

---

## Tech notes

- **Phaser config:** `Scale.NONE`, `transparent`, `antialias: true`. The canvas
  is sized to viewport × DPR each frame; the 1080×1920 design space is FIT
  (contain) into it so every sticker + the tray stay fully visible in portrait
  and landscape. Letterbox bands are filled by a wall/floor backdrop matched to
  the room so it still reads full-bleed.
- **Single WebGL context only** (background is a plain image in the one game) —
  avoids the iOS WKWebView 2nd-context black-screen issue.
- **Bundling:** Vite IIFE + `vite-plugin-singlefile` + a huge `assetsInlineLimit`.
  A post-build step neutralizes Phaser's internal `console.error` and strips
  `type="module"`/`crossorigin`. `main.ts` is gated on `DOMContentLoaded` and
  creates the `#game` element at runtime (passes the element, not a selector).
- **MRAID 3.0** (`networks.ts`): `initMraid()` is awaited before the Phaser game
  is created and self-resolves after a timeout; it polls for late injection and
  registers `ready` / `stateChange` / `exposureChange` / `viewableChange` /
  `audioVolumeChange` / `error`. Viewability and host volume drive pause/mute.
- **Lifecycle stubs** (`gameReady/gameStart/gameEnd/gameClose`) are exposed on
  `window` (only if no SDK provides them) and called at the right moments.
- **CTA** runs an 11-step fallback chain (ExitApi → FbPlayableAd → Luna →
  playableSDK → Mintegral → … → MRAID `open` → `window.open`).
- **Audio** is muted until the first `pointerdown`; it suspends the AudioContext
  on `visibilitychange` / ad-hide.

## Source layout

```
src/
  main.ts            bootstrap, DPR sizing, rotation poll, MRAID gating, lifecycle stubs
  constants.ts       design coords, depths, store URLs, timings, room colors
  networks.ts        triggerCTA(), initMraid(), bindLifecycle(), notifyGameX()
  analytics.ts       trackEvent() facade
  iteration.ts       VITE_ITERATION -> { mode, limit }
  assets.ts          inlined WebP/MP3 manifest (id-keyed per role)
  utils/responsive.ts  sx()/sy()/sd() (FIT)
  scenes/  BootScene.ts  GameScene.ts (orchestrator)  cta.ts (end card)
  game/    layout.ts (50-slot table + rounds) RoomBackground StickerSlot SlotManager
           Tray DragController MatchSystem StarBurst HandHint ProgressTracker SoundManager
scripts/  build-all.mjs  convert-assets.mjs  convert-audio.mjs  _calib/ (optional QA)
```

`game/` modules never call ad-SDK functions; `GameScene` / `cta.ts` are the SDK boundary.

---

## Known limitations / deviations

- **Store URLs are placeholders** (`src/constants.ts`) — the practice-task PDF's
  store links were not resolvable here. Replace `STORE_URL.ios` / `.android`
  before launch.
- **End-card redirect** fires on a **tap anywhere on the end card** (and via the
  network SDK), rather than auto-redirecting *before* the card is shown. Auto-
  redirecting navigates the user away before they see the end screen (and the ad
  correctly backgrounds/pauses when the store opens), and many networks reject
  non-user-initiated redirects. The colored-room payoff + end card are always
  shown first; the tap then triggers the full CTA chain.
- **`mraid.js` 404 when opened via `file://`:** the `al`/`is`/`un` variants
  request `mraid.js`, which only exists inside the network's MRAID container.
  Opened standalone it logs a resource 404, but the game still boots
  (`initMraid()` times out gracefully). Use a `fb`/`mo` variant or
  `dist/index.html` for offline preview.
- The `scripts/_calib/` smoke tests use `puppeteer-core` against a Windows Chrome
  path; they are optional QA helpers, not part of the build.

## Assets

Source art/audio in `src/assets/` (Sprites: 50 colored stickers, 50 outline
silhouettes, 50 tray draggables, 2 room backgrounds, end-card logo/CTA, hand,
star-burst, tray; Audio: BGM + correct/wrong/finished SFX). Optimized WebP/MP3 in
`src/assets-webp/`.
