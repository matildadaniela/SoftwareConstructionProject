# Vibe Coding and SDD scope comparison

Original comparison: 2026-10-27; structure update: 2026-10-29. Evidence: an earlier inspection of Vibe `game.js` and `index.html`; these application files are absent from the current checkout. The behavior comparison is historical source evidence, not a fresh source review or executed browser result. `spec.md` is the SDD requirements baseline. No gameplay requirements or Vibe source have been changed.

## Confirmed implementation structure

The user confirmed on 2026-10-29 that SDD must be implemented independently of Vibe, deriving behavior from the specification, with application files at the repository root. Documentation stays in `specs/001-browser-flappy-bird/`; no separate `sdd/` directory is planned. Root `/` will serve SDD. This does not authorize copying, refactoring, moving or overwriting Vibe code. Structure and independence are settled; D-01–D-03 are now resolved below.

## Historical observed differences (before 2026-10-29 scope confirmation)

| Area | Existing Vibe behavior | Current SDD specification | Planning consequence |
|---|---|---|---|
| Current score | One point after pipe right edge passes bird x; pair has a passed flag | FR-06 strict whole-bird clearance, once per pair | Similar passing threshold; collision priority differs below |
| High score | BEST HUD and game-over best; updates on each new best; saved in localStorage under `flappy-pixel-high-score`; loaded across reloads; retained on restart; storage exceptions fall back to playable in-memory behavior | A-01 explicitly excludes saved high scores; only current-round score is modeled | D-01: confirm intended scope; do not silently remove or add persistence |
| Gameplay controls | Space and ArrowUp keydown (repeat ignored); canvas pointerdown handles mouse/touch/pen | FR-01 requires Space; NFR-06 explicitly excludes mobile/touch; spec does not require ArrowUp or mouse flap | D-02: decide control parity; pointer restart remains required regardless |
| Start/restart | Gameplay input from game over resets and immediately starts/flaps; Restart button resets to ready | FR-04/FR-07 and confirmed clarification require Restart then Space; Space at game over is ignored | Explicit SDD behavior; preserve confirmed decision unless user revises spec |
| Focus/visibility | No explicit pause/resume handlers; capped dt on return; visible unfocused play may continue | FR-11 confirmed pause on blur/hidden, fresh Space resumes with one flap, no time-away simulation | Required new SDD behavior |
| Ceiling | Going above top ends round; exact y=0 alone does not | FR-10 nonfatal clamp; A-04/A-08 identify this as provisional | D-03: confirm provisional boundary choice versus Vibe parity |
| Collision geometry | Five-pixel inset on bird for pipes, exclusive comparisons; pipe caps extend beyond collision width | FR-05 contact/overlap ends round; A-03 defers exact geometry to planning | Proposed SDD full visible bounds; independent tuning and playability checks required |
| Collision/scoring order | Each pipe can score before its collision is checked; ground checked afterward | FR-05/FR-06 all collision takes priority over all points in that update | Required new SDD ordering |
| Ready/ended animation | Ready bird bobs; background, ground and particles keep animating outside play | Ready bird stationary; game over stops motion; gravity only during play | New stationary ready view and frozen gameplay; no requirement for decorative parity |
| Obstacles/determinism | Math.random openings, variable frame-scaled dt capped at two nominal frames | NFR-03 equal conditions/sequences/inputs must match across cadence; delayed frames must not tunnel | Small fixed-step simulation with controllable random sequence for tests; no code reuse |
| Presentation | Pixel art, clouds, sun, mountains, trails/confetti, score pop, scanlines, title and decorative star eyebrow | FR-08 title/icon, play area, score, instructions, restart; responsive interface; no mandated Vibe artwork/effects | D-03: confirm whether any visual effects are expected features; fresh simple drawing proposed |
| Verification | No automated suites or recorded browser checks present in inspected root files | NFR-01–06 automated core checks, four desktop browsers, 60-second FPS records, 100 cycles and mandatory 100 ms reset bound | Plan new tests/evidence independently; no claim Vibe was browser-tested here |

## Confirmed decisions — 2026-10-29

This section supersedes the open planning consequences in the historical comparison above. The table records the earlier specification, not the revised requirements.

- **D-01 — Resolved**: Current-round scores only. No saved best score, storage or Vibe data migration.
- **D-02 — Resolved**: Space, ArrowUp, mouse click and touch tap on the game. Ready also has a start button below. Each initiating action starts with one flap; repeats and touch/mouse compatibility events must not duplicate input. After game over, both “Restart game” below and “Tap to try again” on screen immediately start fresh. Keyboard gameplay alone after loss remains ignored. After focus/visibility pause, gameplay input or “Resume game” resumes the preserved round with one flap, without simulating time away.
- **D-03 — Resolved**: Ceiling contact is fatal. Desktop browsers only, including desktop touchscreens; mobile platforms are excluded. Independently drawn vintage arcade presentation with strong colors and animations is required.

Status: **Resolved**. The user explicitly confirmed immediate retry and preserved-round pause resume in a follow-up. The specification and design now supersede earlier reset-to-ready, nonfatal ceiling and Space-only requirements. No additional product decision is awaiting confirmation. Exact tuning and hardware/browser measurements remain implementation and validation work. No application implementation or runtime validation is claimed.
