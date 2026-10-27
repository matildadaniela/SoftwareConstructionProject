# Implementation Plan: Browser Flappy Bird

**Branch**: `sdd-development` (actual working branch) | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md)

**Feature ID**: `001-browser-flappy-bird`; setup-plan reports this feature ID as BRANCH, while Git and the specification identify the existing branch as `sdd-development`. Continue on the existing branch; no branch creation is required.

## Summary

Develop a new SDD game independently from the specification, using HTML/CSS/JavaScript, a small gameplay module, a Canvas 2D renderer, and one browser entry point. Do not refactor, copy, import, or extract the Vibe Coding implementation or its assets. Implement ready/playing/paused/game-over behavior, the currently specified Space gameplay (additional controls pending D-02), exact collision-before-scoring rules, and immediate reset. Use dependency-free Node unit tests for functionality and recorded checks in desktop Chrome, Firefox, Edge, and Safari for browser behavior. This plan covers FR-01–FR-11 and NFR-01–NFR-06 and ends at design; implementation tasks are generated separately.

## Technical Context

**Language/Version**: HTML5, CSS, JavaScript ES modules using features available in all four supported desktop browsers; Node.js 22.15.0 available for development tests.

**Primary Dependencies**: Native CanvasRenderingContext2D, requestAnimationFrame, performance, keyboard/focus/visibility events. No framework, package dependencies, bundler, external images, fonts, or runtime service. Node built-in `node:test` and `node:assert/strict` provide test tooling; Python 3 standard-library HTTP server serves ES modules locally. Tool runtimes are development prerequisites, not shipped dependencies.

**Storage**: The current specification defines in-memory round state only (A-01). Saved high scores are a scope decision requiring clarification (D-01 in [scope-comparison.md](scope-comparison.md)); this plan does not authorize their removal from Vibe or their addition to SDD. Do not access or delete Vibe browser data.

**Testing**: Pure simulation tests, injected-clock loop tests, and input-adapter tests using small event-target fakes; native browser integration harness plus recorded manual checks. Test names include requirement IDs. No DOM emulation or test library required.

**Target Platform**: Desktop stable Chrome, Firefox, Edge, Safari installed at validation; exact versions recorded then. The current specification requires Space gameplay and pointer or Tab/Enter restart; mobile/touch is excluded. Confirm desired ArrowUp and canvas pointer parity under D-02 before finalizing input scope.

**Project Type**: Static browser game, one page, no backend/build step.

**Performance Goals**: Target 60 rendered FPS; record 60-second collision-free run per browser. Every reset visibly complete within 100 ms, including all 100 lifecycle cycles. No numerical FPS acceptance threshold.

**Constraints**: Fixed 400 × 600 logical playfield with ground at y=526; responsive CSS scaling must preserve gameplay coordinates. Fixed 1/120-second simulation steps independent of render cadence. Contact is fatal except at the top. No scoring in any collision step. Focus loss pauses without replaying elapsed absence.

**Scale/Scope**: One player, one round, bounded on-screen obstacle list, current score only. New source lives under `sdd/`; existing root Vibe files remain unchanged and independently runnable.

**Proposed representative validation baseline (verify actual environment before use)**: Apple Silicon desktop/laptop, macOS 26.3.1, 60 Hz display, window large enough to show the full interface, mains power and no unrelated heavy workload. The prior plan recorded arm64/macOS 26.3.1; this revision has not verified those environment details. Before measurements, record exact machine/chip, memory, display refresh rate, browser versions and viewport in `validation.md`; this is a selected measurement baseline, not a hardware guarantee. Cross-platform functional checks may supplement it.

## Constitution Check

Gate evaluated before research and after design against constitution v1.0.0.

| Principle | Pre-design | Post-design evidence |
|---|---|---|
| I. Specification-guided implementation | PASS: clarified spec has stable FR/NFR IDs | OPEN: design follows current spec; D-01–D-03 scope decisions require explicit resolution before affected tasks |
| II. Readable and maintainable code | PASS: boundaries identified | PASS: gameplay and rendering have focused modules; input and timing are small functions in the entry point; named constants and one collision definition |
| III. Tested core functionality | PASS: required suites planned | PASS: test matrix below covers all core rules; browser guide covers rendering and complete journeys; persistence tests are conditional on D-01 resolution |
| IV. Minimal dependencies | PASS: native stack selected | PASS: built-in test/assert modules and static server suffice; no third-party tooling |
| V. End-to-end traceability | PASS: requirements available | PASS: mapping below links requirements to proposed files and verification; subsequent tasks must retain IDs and completion references |

No constitutional exceptions requested. Scope reconciliation remains open: do not mark the design ready for affected implementation until D-01–D-03 are resolved. These are design checks, not implementation test results.

## Project Structure

### Documentation (this feature)

```text
specs/001-browser-flappy-bird/
├── spec.md
├── plan.md
├── scope-comparison.md       # observed differences and unresolved decisions
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── browser-game.md
├── validation.md             # implementation-time execution evidence
└── tasks.md                  # generated later by speckit-tasks
```

### Source Code (independent SDD implementation; proposed)

```text
index.html, style.css, game.js # existing Vibe version; leave unchanged
sdd/
├── index.html                # new semantic page, heading/icon, canvas, HUD, restart
├── style.css                 # new responsive styling and visible keyboard focus
├── package.json              # private ES modules, built-in test command, no dependencies
├── game.js                   # browser setup, input handlers, timing and reset
├── config.js                 # named gameplay constants
├── simulation.js             # plain round state and gameplay functions
├── renderer.js               # Canvas draws from round state
└── tests/
    ├── simulation.test.js
    ├── browser.test.js       # input/timing functions with small event/clock fakes
    └── browser/
        ├── index.html        # native integration/measurement harness
        └── validation.js
```

**Structure Decision**: Use plain objects and focused functions. Keep input and timing in `sdd/game.js`; testable exported helpers are sufficient without adapter classes, service/controller layers, an event bus, or a generic engine. The browser harness imports production modules and is never imported by the game. No production SDD file imports Vibe source. Existing code was inspected only to identify observable feature differences, not as an implementation blueprint. Review provenance and requirement references during implementation.

## Phase 0: Research decisions

See [research.md](research.md). Resolve simulation timing, collision geometry, procedural openings, input ownership, testing, and measurement without additional dependencies. Scope decisions remain open in [scope-comparison.md](scope-comparison.md); technical proposals do not resolve product scope.

## Phase 1: Design

### Simulation and gameplay tuning

Use top-left coordinates and unrotated axis-aligned collision rectangles. Bird: x=90, y=248, width=34, height=28. Ground: y=526. Pipes: full width 64, gap 164; gap top initially ranges from 75 through 287 inclusive. Render pipe caps within the same rectangle and keep bird artwork inside its collision rectangle; visual rotation must not imply a different collision boundary. Implement specification-derived full contact bounds and a stationary ready bird independently; do not reuse Vibe collision or drawing code.

Initial tuning in pixels and seconds: gravity=1512 px/s², flap velocity=-450 px/s, obstacle speed=156 px/s, spawn interval=1.75 s, first spawn at 1.75 active seconds, spawn x=400. Use semi-implicit Euler at 1/120 s: apply flap, advance velocity, then position. These are provisional SDD tuning values, not requirements or a parity commitment. The prior plan chose values matching converted Vibe tuning; shared numbers must not be treated as a reason to copy its algorithms. Validate these values independently against A-03 and the acceptance scenarios and revise if necessary. Maximum ideal rise is about 67 px; a level repeating flap interval is about 0.59 s. Each pair is 273 px apart (1.75 s), providing roughly three flap opportunities between pairs. Limit successive gap-top changes to 60 px within global bounds, including the first gap relative to the starting bird-centered opening. This keeps adjacent openings reachable without increasing difficulty. Add a deterministic scripted traversal check through extreme allowed transitions before implementation acceptance; tuning changes must update config, tests and these recorded choices together.

Simulation receives a seeded random function for obstacles only; separate cosmetic randomness cannot affect the obstacle sequence. Use xorshift32 with nonzero seed 0x1A2B3C4D (shifts 13,17,5 and unsigned normalization) in production and known streams in tests. Restart restores the configured initial seed for repeatable rounds. Generate each gap from the intersection of global bounds and previous gap ±60. Retire a pair only after its right edge is strictly left of x=0. Use integer simulation ticks (210 per spawn) to avoid timer drift.

Each step: consume one pending flap, integrate proposed movement, spawn/move pairs, evaluate swept collisions for all hazards and ground, then award each newly passed pair at most once and retire offscreen pairs. Contact counts, using inclusive comparisons; passing is strictly bird.left > pair.right. Swept AABB checks use relative displacement of bird and each rectangular pipe segment from previous to proposed position so crossing a hazard between endpoints cannot tunnel. Check initial overlap and zero relative velocity. On first collision set game-over once, retain score, suppress every point for that step and stop later steps. Clamp at top y=0 with upward velocity reset to zero; split the swept path at top contact when needed so the clamped path is tested accurately. Top contact itself is nonfatal.

### Timing and lifecycle

One requestAnimationFrame chain owns rendering. Accumulate monotonic active time and execute complete fixed steps; render current state afterward without mutating it. Process at most 30 steps per callback and retain remaining backlog for later visible frames, never replacing it with a large variable step or dropping elapsed visible time. This bounds callback work while swept collisions preserve hazard detection. Inputs enter a FIFO tick queue; each accepted press is applied once at the next unprocessed step. Replay tests supply the same tick-indexed input stream; compare equal simulation ticks, not arbitrary paint times.

Ready, paused and game-over states never advance simulation or decorative animation. Blur or hidden visibility pauses only an active round; clear held keys and pending inputs and discard loop timing backlog. Focus/visibility restoration never resumes automatically. Resume requires both visible and focused plus a fresh Space press, resets the wall-clock origin, and queues one flap. Restart from every state immediately replaces the round and input/loop state, updates DOM and draws the complete ready frame in the same event handler; it does not create another animation chain. Start/resume similarly reset the time origin. See [data-model.md](data-model.md) and [contracts/browser-game.md](contracts/browser-game.md).

### Independent implementation and scope reconciliation

Build `sdd/` from the specification and acceptance scenarios. Write new markup, styling, drawing functions, gameplay, input handling and tests; do not extract or translate existing functions, reuse CSS/artwork, or change root Vibe files. Canvas and native browser APIs are stack choices, not reuse of Vibe implementation. Pixel-art parity is not a specification requirement; a simple independently drawn presentation is sufficient pending D-03.

See [scope-comparison.md](scope-comparison.md) for observed differences and D-01–D-03. Do not add saved scores or extra controls, remove Vibe features, or treat current exclusions as newly confirmed decisions. Resolve affected scope with the user; any changed requirement must be recorded in `spec.md` with acceptance criteria before task generation/implementation for that behavior. Unaffected design work may proceed.

### Verification and requirement mapping

| Requirements | Proposed implementation | Required verification |
|---|---|---|
| FR-01, FR-02 | simulation.js, game.js, config.js | Start includes one flap; held/repeated keys do not repeat; distinct presses work; gravity, apex/descent, frozen inactive states; Space prevents default |
| FR-03 | simulation.js, config.js | Seeded bounded gaps and reachable transitions; first/recurring spawn ticks; fixed speed/spacing, removal and no stale hazard; scripted traversal |
| FR-04, NFR-02 | simulation.js, game.js | Reset every lifecycle state, rapid reset, empty queue/backlog and obstacle list; browser measures complete reset paint for each of 100 cycles |
| FR-05 | simulation.js | Pipe body/opening-edge/ground contact and overlap, initial overlap, fast crossing, zero relative velocity; game-over once, freeze all progression |
| FR-06 | simulation.js, renderer.js, game.js | Equality gives zero, strict pass gives one, never twice; 0/1/10 pairs; collision anywhere in step suppresses all step scoring; HUD by next render |
| FR-07, FR-09 | simulation.js, renderer.js, index.html | Legal state transitions, Space after loss ignored, preserved final score; distinguishable overlays and status in browser |
| FR-08 | index.html, style.css, game.js, renderer.js | Title/icon placement, score, instructions, restart below; native Tab/Enter and pointer; focused-button Space does not restart; responsive layout |
| FR-10 | simulation.js, renderer.js | Top clamps without loss, upward speed clears, descent resumes; accurate clamped sweep and artwork bounds |
| FR-11 | simulation.js, game.js | Blur/hidden clears input and freezes state; all focus/visibility return orders; fresh visible/focused Space resumes once, no elapsed-away catch-up; reset while paused |
| NFR-01 | game.js, renderer.js, browser harness | Per-browser 60-second collision-free run; average rendered FPS and stutter observations/investigation, exact baseline recorded |
| NFR-03 | simulation.js, game.js, browser harness | Same tick inputs/seed under 30/60/120/144 Hz, jitter and delayed callbacks; 100 start/play/end/reset cycles, matching outcomes and no stale state/errors |
| NFR-04 | all source modules | Review meaningful names, focused boundaries, config constants, no duplicated rules/dependencies |
| NFR-05 | sdd/tests/*.test.js, validation.md, future tasks.md | ID-labelled test names and task-to-file/test references; all core tests pass; recorded browser results |
| NFR-06 | game.js, renderer.js | Complete acceptance journeys in installed stable Chrome/Firefox/Edge/Safari, exact versions recorded |

Tests assert observable state and outputs rather than reproducing the algorithms. Inject scheduler/clock, seeded randomness and event targets; do not depend on real sleeps, production global state, DOM emulation, or screenshots for unit assertions. Browser measurements complement unit assertions; unit tests cannot establish paint latency or browser compatibility.

### Delivery order and acceptance

Resolve affected scope decisions first. Subsequent tasks should create new `sdd/` files and implement constants/pure state first, then movement/obstacles/collision/scoring and their tests, then input/loop and their tests, then integrate rendering/HTML/CSS and browser harness, and finally record cross-browser functional/performance results and traceability. Each completed task must identify actual files/functions and verification. `quickstart.md` defines validation commands and acceptance evidence. No implementation or test execution is claimed by this planning run.

## Complexity Tracking

No exceptions requested. Four small JavaScript files suffice. The fixed-step loop and collision checks serve NFR-03 and the delayed-frame edge case; they are local functions, not a reusable engine. Do not add abstraction layers or generalized replay infrastructure beyond what required verification needs.
