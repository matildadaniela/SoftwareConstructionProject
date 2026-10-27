# Research: Browser Flappy Bird

**Date**: 2026-10-27. Scope: FR-01–FR-11, NFR-01–NFR-06. This revision uses the specification and constitution for design. Inspection of root Vibe files establishes observable differences only; it is not a source for implementation reuse. Scope questions D-01–D-03 remain open in [scope-comparison.md](scope-comparison.md). These are proposed design decisions, not implemented test results.

## 1. Native rendering and code organization

**Decision**: Write new HTML/CSS and simple Canvas 2D drawing under `sdd/`; use gameplay and renderer modules plus input/timing functions in the browser entry point. Preserve a 400×600 logical world with CSS scaling. Keep collision rectangles and visible artwork aligned, fitting pipe caps within width 64 and bird art within 34×28; omit visual rotation that extends beyond its bounds.

**Rationale**: A small browser game needs readable state, focused functions and direct tests, not a framework or generic adapter architecture. Vibe source, art and CSS will not be reused; root files remain unchanged.

**Alternatives considered**: A framework, game engine, WebGL, bundler, or scene/entity framework adds maintenance without a specified need; a monolithic script prevents isolated functionality tests. Device-dependent physics dimensions change gameplay on resize.

## 2. Deterministic time and delayed frames

**Decision**: Use fixed 1/120-second simulation ticks with an animation-frame timestamp accumulator. Limit processing to 30 steps per callback while retaining visible-time backlog. Queue inputs by tick and compare replays at equal ticks. Reset clock origin/backlog on pause, start, resume and restart. Only active visible/focused play advances simulation.

**Rationale**: The platform schedules animation callbacks; callback frequency is not a gameplay timestep. See the [HTML animation-frame standard](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#animation-frames). Fixed steps separate simulation from paint cadence. Retaining backlog avoids silently removing visible elapsed time; the work budget bounds individual callbacks.

**Alternatives considered**: Existing capped variable dt changes outcomes with cadence and discards time. One large delayed step risks missed contacts. Unbounded catch-up can block the UI; a worker adds unnecessary coordination.

## 3. Collision and scoring

**Decision**: Inclusive axis-aligned rectangles with swept relative-displacement checks, initial-overlap checks and zero-velocity cases; split motion at a ceiling clamp. Contact with either pipe rectangle or ground ends play. Evaluate every collision before awarding any point for the tick. Score only after strict whole-bird/whole-pair clearance, once per pair.

**Rationale**: These choices follow FR-05/FR-06/FR-10 and prevent delayed-frame tunneling without assuming a velocity bound. Full shared bounds make visible contacts understandable. Fixed steps alone do not prove absence of tunneling.

**Alternatives considered**: Existing inset/exclusive hitboxes do not meet contact rules and ignore wide pipe lips. Endpoint-only checks miss crossings. Pixel collision adds complexity and makes decorative pixels alter gameplay. Scoring pair-by-pair before checking every hazard can award points in a fatal step.

## 4. Input and lifecycle

**Decision**: Distinct Space presses only; track held keys and ignore repeats while preventing Space defaults. Use both blur and visibilitychange. A fresh Space resumes only when visible and focused. Restart clears all state and renders immediately, keeping one animation chain.

**Rationale**: Visibility and focus are separate conditions in the [HTML interaction standard](https://html.spec.whatwg.org/multipage/interaction.html#page-visibility). The game specification defines pause, explicit resume and button behavior more narrowly than platform defaults. Unit tests use fake event targets; actual native keyboard/button interactions require browser checks.

**Alternatives considered**: Automatic resume, simulated absence time, Space-to-restart contradicts confirmed restart behavior. Additional controls require D-02 resolution; lack of a requirement alone is not a confirmed removal decision. Relying only on animation callback suspension misses focus loss while visible. Rebinding listeners after every restart risks duplicate actions.

## 5. Tuning and procedural obstacles

**Decision**: Start with gravity 1512 px/s², flap -450 px/s, pipe speed 156 px/s, width 64, gap 164, first spawn and subsequent interval 210 ticks (1.75 s). Gaps range 75..287, changing by at most 60 px per pair. Use a named nonzero initial seed (0x1A2B3C4D), a documented unsigned 32-bit xorshift32 sequence (shifts 13,17,5, unsigned result divided by 2^32), and restore that seed on restart. Cosmetic randomness is separate. Tests can inject known obstacle random values.

**Rationale**: The prior plan selected numbers matching converted Vibe tuning. They remain provisional numeric proposals only; implement and assess them independently from the specification, without reusing Vibe algorithms. An approximately 67 px flap rise, 0.59 s level-flight flap cycle and 273 px pair spacing support traversal. Limiting gap changes avoids large random jumps. This is an analytical starting point; a scripted collision-free traversal through allowed transitions must confirm playability during implementation.

**Alternatives considered**: Unseeded Math.random prevents reproducible rounds; sharing randomness with particles changes obstacle outcomes when artwork changes. Unconstrained random heights complicate reachability. Increasing speed/difficulty is outside the specification.

## 6. Dependency-free unit tests

**Decision**: Use Node 22 built-in `node:test` and `node:assert/strict`, ES modules and a minimal private package.json with a test command and no installed dependencies. Test simulation directly, then input/loop through injected event targets, clock and scheduler. Add a plain browser integration harness for production modules.

**Rationale**: Core assertions and deterministic execution need no third-party library. Node officially provides a [built-in test runner](https://nodejs.org/api/test.html); use only baseline test/assert functionality available in the local Node 22.15.0 runtime. Node does not ship to players. Real rendering and browser defaults remain browser checks.

**Alternatives considered**: Vitest/Jest, jsdom and browser automation packages add installation, configuration and maintenance not justified for this scope. Browser-only unit testing makes repeatable command-line core verification harder; manual-only checks do not satisfy the constitution.

## 7. Scope reconciliation and browser validation

**Decision**: Preserve Vibe unchanged. Treat current-round-only scoring and Space gameplay as the current specification baseline, with high-score and control parity explicitly unresolved under D-01/D-02. D-03 covers remaining provisional behavior/presentation defaults. Do not implement scope changes until explicitly decided and, where necessary, specified.

**Rationale**: A-01 excludes saved scores and NFR-06 excludes mobile/touch, while Vibe provides these behaviors. A plan cannot silently resolve this difference by deleting features or importing them into SDD. Confirmed restart and focus behavior remain binding.

**Alternatives considered**: Automatically preserving every Vibe feature would silently expand requirements. Automatically removing features would assume approval for reduced scope. Neither follows specification-guided development.

**Validation decision**: Record actual machine, OS, display, browser versions and viewport before execution. Previously proposed Apple Silicon/macOS/60 Hz details are a candidate baseline, not a measured result. Use the production renderer/rules for 60-second runs and visible-frame evidence for all 100 reset measurements.

## Resolution summary

D-01–D-03 require scope clarification before affected implementation; no external integration is currently specified. Runtime APIs are native; development tooling adds no package dependency. Exact installed browser versions, hardware details and measured outcomes are execution evidence to collect, not unknown design choices. The existing branch is `sdd-development`; setup-plan's `001-browser-flappy-bird` BRANCH field is treated as feature metadata, not an instruction to switch branches.
