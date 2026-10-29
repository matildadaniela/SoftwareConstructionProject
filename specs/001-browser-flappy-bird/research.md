# Research: Browser Flappy Bird

**Date**: 2026-10-29. Scope: FR-01–FR-11, NFR-01–NFR-06. This revision uses the specification and constitution for design. The earlier inspection of Vibe files establishes historical observable differences only; it is not a source for implementation reuse. Scope decisions D-01–D-03 were confirmed on 2026-10-29 in [scope-comparison.md](scope-comparison.md). These are proposed design decisions, not implemented test results.

## 1. Native rendering and code organization

**Decision**: Write new HTML/CSS and simple Canvas 2D drawing at the repository root; use gameplay and renderer modules plus input/timing functions in the browser entry point. Preserve a 400×600 logical world with CSS scaling. Keep collision rectangles and visible artwork aligned, fitting pipe caps within width 64 and bird art within 34×28; omit visual rotation that extends beyond its bounds.

**Rationale**: A small browser game needs readable state, focused functions and direct tests, not a framework or generic adapter architecture. Vibe source, art and CSS will not be reused; the current checkout contains no Vibe application files. No Vibe relocation or overwrite is part of this plan.

**Alternatives considered**: A framework, game engine, WebGL, bundler, or scene/entity framework adds maintenance without a specified need; a monolithic script prevents isolated functionality tests. Device-dependent physics dimensions change gameplay on resize.

## 2. Deterministic time and delayed frames

**Decision**: Use fixed 1/120-second simulation ticks with an animation-frame timestamp accumulator. Limit processing to 30 steps per callback while retaining visible-time backlog. Queue inputs by tick and compare replays at equal ticks. Reset clock origin/backlog on pause, start, resume and restart. Only active visible/focused play advances simulation.

**Rationale**: The platform schedules animation callbacks; callback frequency is not a gameplay timestep. See the [HTML animation-frame standard](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#animation-frames). Fixed steps separate simulation from paint cadence. Retaining backlog avoids silently removing visible elapsed time; the work budget bounds individual callbacks.

**Alternatives considered**: Existing capped variable dt changes outcomes with cadence and discards time. One large delayed step risks missed contacts. Unbounded catch-up can block the UI; a worker adds unnecessary coordination.

## 3. Collision and scoring

**Decision**: Inclusive axis-aligned rectangles with swept relative-displacement checks, initial-overlap checks and zero-velocity cases; include a fatal ceiling plane. Contact with ceiling, either pipe rectangle or ground ends play. Evaluate every collision before awarding any point for the tick. Score only after strict whole-bird/whole-pair clearance, once per pair.

**Rationale**: These choices follow FR-05/FR-06/FR-10 and prevent delayed-frame tunneling without assuming a velocity bound. Full shared bounds make visible contacts understandable. Fixed steps alone do not prove absence of tunneling.

**Alternatives considered**: Existing inset/exclusive hitboxes do not meet contact rules and ignore wide pipe lips. Endpoint-only checks miss crossings. Pixel collision adds complexity and makes decorative pixels alter gameplay. Scoring pair-by-pair before checking every hazard can award points in a fatal step.

## 4. Input and lifecycle

**Decision (confirmed 2026-10-29)**: Space, ArrowUp, mouse and touch on desktop. One action per distinct press or click/tap; ignore key repeats and suppress compatibility mouse duplicates and button bubbling. Ready starts via gameplay input or Start game. Paused resumes the same round via gameplay input or Resume game. Game over retries via Tap to try again or Restart game, immediately entering a fresh playing round. Each initiating action supplies one flap. Restart game during play also starts fresh. Space/ArrowUp alone after loss is ignored.

**Rationale**: These are the user's confirmed behaviors, superseding the earlier reset-to-ready design. Both blur and hidden visibility pause and clear input/backlog; focus return alone never resumes. Use native buttons and preserve Tab/Enter behavior while preventing gameplay-key defaults. Test actual desktop touch hardware as well as fake event targets and native browser behavior.

**Alternatives superseded**: Space-only gameplay, a separate starting press after retry, automatic resume, or discarding progress on pause resume.

## 5. Tuning and procedural obstacles

**Decision**: Start with gravity 1512 px/s², flap -450 px/s, pipe speed 156 px/s, width 64, gap 164, first spawn and subsequent interval 210 ticks (1.75 s). Gaps range 75..287, changing by at most 60 px per pair. Use a named nonzero initial seed (0x1A2B3C4D), a documented unsigned 32-bit xorshift32 sequence (shifts 13,17,5, unsigned result divided by 2^32), and restore that seed on restart. Cosmetic randomness is separate. Tests can inject known obstacle random values.

**Rationale**: The prior plan selected numbers matching converted Vibe tuning. They remain provisional numeric proposals only; implement and assess them against the specification, independently of Vibe and without reusing its algorithms. An approximately 67 px flap rise, 0.59 s level-flight flap cycle and 273 px pair spacing support traversal. Limiting gap changes avoids large random jumps. This is an analytical starting point; a scripted collision-free traversal through allowed transitions must confirm playability during implementation.

**Alternatives considered**: Unseeded Math.random prevents reproducible rounds; sharing randomness with particles changes obstacle outcomes when artwork changes. Unconstrained random heights complicate reachability. Increasing speed/difficulty is outside the specification.

## 6. Dependency-free unit tests

**Decision**: Use Node 22 built-in `node:test` and `node:assert/strict`, ES modules and a minimal private package.json with a test command and no installed dependencies. Test simulation directly, then input/loop through injected event targets, clock and scheduler. Add a plain browser integration harness for production modules.

**Rationale**: Core assertions and deterministic execution need no third-party library. Node officially provides a [built-in test runner](https://nodejs.org/api/test.html); use only baseline test/assert functionality available in the local Node 22.15.0 runtime. Node does not ship to players. Real rendering and browser defaults remain browser checks.

**Alternatives considered**: Vitest/Jest, jsdom and browser automation packages add installation, configuration and maintenance not justified for this scope. Browser-only unit testing makes repeatable command-line core verification harder; manual-only checks do not satisfy the constitution.

## 7. Confirmed scope and browser validation

**Decision**: Root-level SDD implementation independent of Vibe. Current-round scores only, no storage. Fatal ceiling, desktop platforms including mouse and touchscreen input. Independently drawn vintage arcade presentation with strong colors and animations. Cosmetic animation must not mutate gameplay or obstacle randomness and may continue while gameplay is frozen.

**Rationale**: D-01–D-03 and retry/resume behavior were explicitly confirmed on 2026-10-29. Earlier exclusions of touch, nonfatal ceiling and simple unanimated presentation are superseded.

**Validation decision**: Record actual hardware, OS, display, browser versions and viewport. Obtain real desktop touch evidence; emulation does not establish touch hardware behavior. The proposed Apple Silicon/macOS/60 Hz baseline is a candidate, not a measured result. Use production rendering and collision rules in 60-second runs, visible-frame evidence for all 100 immediate retries, and visual review for arcade presentation and animation.

## Resolution summary

No product-scope question remains open. Tuning and exact validation environment remain implementation/measurement work. No tests or runtime measurements are claimed. Keep the existing `sdd-development` branch; feature metadata is not a branch-switch instruction.
