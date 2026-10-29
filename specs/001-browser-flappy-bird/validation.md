# Implementation validation: Browser Flappy Bird

## Scope and environment

Date: 2026-10-29, 08:52 UTC. Authorized scope: Phase 1, T001–T002 only.
Branch: `sdd-development`. Base commit: `458fc86b48c855338bd84db4b88baf19aa8028e9`.
Evidence describes setup changes in the working tree on that base, not a new commit.

Verified with version commands: Node `v22.15.0`, npm `10.9.2`, Python `3.13.3`.
`uname -sm` reports Darwin arm64; `sw_vers` reports macOS 26.3.1, build 25D2128.
`system_profiler SPDisplaysDataType` reports Apple M1, built-in GPU with 7 GPU cores and Metal support, but no display mode/refresh rate.
`sysctl -n hw.model hw.memsize` was denied with `Operation not permitted`; model and memory remain unavailable. This does not block setup.
Display refresh rate, viewport, exact browser versions, power/workload conditions and actual desktop touchscreen hardware remain pending browser-validation tasks. No measured 60 Hz baseline is claimed.

## T001 — ownership and provenance

Initial `git status --short` was empty. Root inspection and `git ls-files` showed only planning documents, tooling and README. Every proposed root application path in plan.md was absent: `index.html`, `style.css`, `package.json`, `game.js`, `config.js`, `simulation.js`, `renderer.js`, and `tests/`, including both test files, browser index and validation script. This validation log was also absent. No ownership conflicts or overwritten application files.

Read spec.md, plan.md, tasks.md, research.md, data-model.md, contracts/browser-game.md, quickstart.md and constitution v1.0.0. Setup is newly authored from these documents. No Vibe source, artwork, other checkout or other branch was opened, copied, moved or modified. No gameplay or artwork is delivered in Phase 1. Repeat provenance review for later source additions.

The requirements checklist has 16 checked items and zero unchecked items; checklist markers remain unchanged. `.specify/extensions.yml` is absent; no pre/post implementation hooks are registered.

T001 complete: this log records actual environment, ownership, provenance, and pending task/requirement/evidence mappings (NFR-04–NFR-06). Functional/browser acceptance of those requirements remains pending.

## T002 — dependency-free verification scaffold

Actual files:

- `package.json`: private ES modules, no dependency declarations, exact test script `node --test tests/*.test.js`.
- `tests/simulation.test.js`: comment-only scaffold; assertions begin at T004.
- `tests/browser.test.js`: comment-only scaffold; input/loop assertions begin at T006.
- `tests/browser/index.html`: native HTML placeholder explicitly stating that the harness is pending T025. No production imports or build step.
- `.gitignore`: Node dependencies/build output/log/environment patterns plus common OS/editor temporary files, required by setup verification.

No Docker, ESLint, Prettier, Terraform, Helm or npm-publishing configuration is present; no additional ignore files are needed. No package installation, lockfile or third-party dependencies.

Executed `npm test` with the runtimes above: exit 0, 2 file-level passes, 0 failures. These are empty-file discovery results, not gameplay assertions or behavioral coverage. `git diff --check` passed. T002 setup is complete (NFR-04, NFR-05); core test coverage remains pending.

## Pending requirement and evidence mapping

Each row links requirements to planned implementation and verification; no functional requirement is accepted by Phase 1. Actual functions, assertion names and browser evidence must be added when the corresponding tasks are executed. Detailed task descriptions in tasks.md remain authoritative.

| Requirements | Planned implementation | Pending evidence |
|--------------|------------------------|------------------|
| FR-01, FR-02 | config.js, simulation.js, game.js | Start/flap, input deduplication, gravity and inactive-state tests; browser input journeys |
| FR-03 | config.js, simulation.js | Seeded spawn/gap/movement/retirement assertions and extreme-gap traversal |
| FR-04, NFR-02 | simulation.js, game.js, browser harness | Immediate fresh retry tests; both controls; 100 visible reset-frame measurements at most 100 ms |
| FR-05, FR-10 | simulation.js, renderer.js | Inclusive/swept pipe, ceiling and ground boundaries; collision priority and matching artwork bounds |
| FR-06 | simulation.js, game.js, renderer.js | Strict once-only points, 0/1/10 pairs, collision precedence and HUD update |
| FR-07, FR-09 | simulation.js, game.js, renderer.js, index.html | Lifecycle assertions, retained final score and distinguishable overlays/controls |
| FR-08 | index.html, style.css, game.js, renderer.js | Native Tab/Enter, real desktop touch, layout, independent arcade art and animation |
| FR-11 | simulation.js, game.js | Blur/hidden pause, both restoration orders, preserved-round resume and no catch-up |
| NFR-01 | game.js, renderer.js, browser harness | Four 60-second runs, actual baseline and stutter observations/investigation |
| NFR-03 | simulation.js, game.js, renderer.js, browser harness | Equal-tick cadence replays, separate RNG, 100 lifecycle cycles and stable loop/listener counts |
| NFR-04 | All planned source modules | Naming/constants/boundary/dependency review; setup evidence above is partial only |
| NFR-05 | tests/*.test.js, browser harness, this log | Requirement-labelled assertion names, full task/function/test traceability and browser evidence |
| NFR-06 | game.js, renderer.js, browser harness | Exact stable Chrome/Firefox/Edge/Safari versions and full journeys including actual desktop touch |

## Pending task register

T003–T006 are complete as recorded below. T005/T006 deliver red tests only; gameplay implementation and T007–T031 remain pending. The descriptions below retain planned files and requirement references.

| Task | Planned work / requirement references | Evidence |
|------|--------------------------------------|----------|
| T003 | Add named constants and construction validation in `config.js`: 400×600 world, ground 526, step 1/120 s, bird (90,248,34,28), gravity 1512, flap -450, pipe width 64, gap 164, speed 156, spawn 210 ticks, gap range 75..287, max change 60 and seed 0x1A2B3C4D. Preserve data-model constraints verbatim: "Immutable named values; positive sizes/speed, gap larger than bird height, valid opening within ground; shared by simulation/rendering/tests" (FR-02, FR-03, NFR-04). | Complete: `config.js` (`CONFIG`, `createConfig`); Phase 2 configuration tests below. |
| T004 | Add constructor/configuration assertions in `tests/simulation.test.js`, then implement plain fresh-round creation in `simulation.js`, including independent collections and round-owned RNG. Preserve constraints: "phase is ready/playing/paused/game-over; tick and score nonnegative integers; owns one bird and zero or more pairs; only playing advances tick; ready has zero score/tick and empty pairs"; bird "x remains fixed; top-left origin; full unrotated rectangle defines contact; y >= 0; ceiling or ground contact causes loss". Define how fatal proposed positions resolve without leaving an invalid stored bird position (FR-02, FR-07, FR-10, NFR-03). | Complete: `simulation.js:createRound`, `tests/simulation.test.js`; Phase 2 construction tests below. |
| T005 | [P] [US1] Add requirement-labelled tests in `tests/simulation.test.js` for start with one flap, gravity/apex/descent, frozen inactive states, seeded bounded/reachable openings, first and recurring spawn ticks, constant movement/spacing, retirement, exact contact/overlap/swept crossings of pipes/ceiling/ground, initial overlap and zero relative velocity, one terminal transition and legal pause/resume preservation (FR-01–FR-03, FR-05, FR-07, FR-10, FR-11). | Complete (tests only): `tests/simulation.test.js`; Phase 3 red-test evidence below. |
| T006 | [P] [US1] Add contract/input/loop tests in `tests/browser.test.js` using small event-target and injected-clock/scheduler fakes: all starts and resumes yield one flap; per-key hold/repeat suppression; FIFO tick queue, including two distinct inputs before one tick with both consumed in FIFO order, no accumulated impulse and no delayed flap; pointer compatibility/button deduplication; gameplay defaults prevented while Tab/Enter work; focus-and-visibility guards; both restoration orders; pause clears backlog/input; 30-step callback cap retains visible backlog; one animation chain; disposal removes listeners (FR-01, FR-02, FR-07, FR-08, FR-11, NFR-03; contracts/browser-game.md). | Complete (tests only): `tests/browser.test.js`; Phase 3 red-test evidence below. |
| T007 | [US1] Implement start/flap, fixed-step movement and legal pause/resume transitions in `simulation.js`; consume all queued inputs for the tick in FIFO order before semi-implicit Euler movement, setting flap velocity for each without accumulating impulse or carrying inputs into later ticks, advance active ticks only during play, preserve world/RNG on pause, and ignore gameplay keys after game over (FR-01, FR-02, FR-07, FR-11). | Complete; see T007 evidence below |
| T008 | [US1] Implement round-seeded obstacle generation/movement/retirement in `simulation.js`: unsigned xorshift32 shifts 13/17/5 divided by 2^32, injectable known streams, first spawn tick 210 at x=400, recurring interval 210, gap intersection with previous ±60 initialized from clamped bird-centered opening. Preserve pair constraints: "Unique within round; top rectangle spans y=0..gapTop, bottom spans gapTop+gapHeight..526; inclusive edges; scored may change false→true once; remove after right edge <0". Keep cosmetic randomness separate (FR-03, NFR-03). | Complete; see T008 evidence below |
| T009 | [US1] Implement inclusive swept relative-displacement AABB checks in `simulation.js` for both moving pipe rectangles, ceiling and ground, including initial overlap and zero velocity; integrate proposed movement/spawn/movement before collision, terminate once before any scoring, discard remaining collision-step time and stop subsequent backlog steps after loss (FR-05, FR-10). | Pending |
| T010 | [US1] Implement exported input and loop helpers plus guarded browser initialization in `game.js` so Node imports need no DOM. Preserve InputState rules: "Each queue item targets an unprocessed simulation tick, FIFO within tick; all inputs for a tick consumed before integration, each setting flap velocity without accumulated impulse or carryover; repeats ignored; blur, hidden and restart clear held flag and queue; Space/ArrowUp and pointer input require visible/focused page; one action per click/tap, no compatibility duplicates". Preserve LoopState rules: "Infrastructure, outside round; monotonic clock; null timestamp on reset/resume; paused/inactive time is never accumulated; one scheduled chain". Use 1/120 s steps, at most 30 per callback with retained backlog, render afterward, clear input/backlog on blur/hidden, and resume with a fresh clock origin (FR-01, FR-02, FR-07, FR-08, FR-11, NFR-03). | Pending |
| T011 | [P] [US1] Create semantic `index.html` and responsive `style.css` with title and independently drawn icon above the 400×600 logical canvas, readable score/status/instructions, below-game native Start/Resume/Restart button, accessible on-screen retry control and visible keyboard focus; preserve logical coordinates under CSS scaling (FR-07–FR-09). | Pending |
| T012 | [P] [US1] Implement read-only `renderer.js` with independent vintage arcade bird, pipes, ground, strong colors, decorative animation and distinct ready/paused/game-over overlays; keep all hazard/artwork bounds aligned and no gameplay mutation or obstacle-PRNG use. Preserve View constraints: "Derived from round only, no independent gameplay truth; score and state update no later than next render; restart enters playing with one flap and draws immediately"; complete restart integration in US3 (FR-05, FR-07–FR-10, NFR-03). | Pending |
| T013 | [US1] Compose production simulation, input, loop, renderer, HUD/status and state-specific controls in `game.js`; make start/resume visible with one initiating flap, pause visibly on blur/hidden, leave restoration paused, freeze gameplay after loss and retain final score; pass T005/T006 before marking complete (FR-01–FR-03, FR-05, FR-07–FR-11). | Pending |
| T014 | [US1] Serve via `python3 -m http.server 8000 --bind 127.0.0.1`, perform US1 browser smoke checks for each start/resume method, repeat/scroll prevention, native Tab/Enter, layout/art/animation, collision overlays and no catch-up, and record actual browser/device, outcomes and console errors in `specs/001-browser-flappy-bird/validation.md`; full four-browser and real-touch acceptance follows in US4 (FR-01–FR-03, FR-05, FR-07–FR-11). | Pending |
| T015 | [P] [US2] Extend `tests/simulation.test.js` for equality and either side of the pass boundary, upper/lower pair counting once, repeated steps, multiple pairs, retired hazards and collision with one pair while another could score; verify 0/1/10-pair outcomes and nonnegative integer score (FR-05, FR-06, SC-02). | Pending |
| T016 | [P] [US2] Extend `tests/browser.test.js` with fake-render/HUD contract checks for score update by the next render, final score preservation and render operations leaving simulation/obstacle RNG unchanged (FR-06–FR-09, NFR-03). | Pending |
| T017 | [US2] Implement scoring in `simulation.js` only after all hazards are checked: strict bird.left > pair.right, one point per unscored pair, no points anywhere in a fatal tick, and retirement after scoring. Keep score in memory only (FR-05, FR-06). | Pending |
| T018 | [US2] Connect current/final score to `game.js` HUD and `renderer.js` without a second source of truth, pass T015/T016, and record browser observations for controlled 0/1/10 scores and collision precedence in `specs/001-browser-flappy-bird/validation.md` (FR-06, FR-07, FR-09, SC-02). | Pending |
| T019 | [P] [US3] Extend `tests/simulation.test.js` for fresh-round restart from ready/playing/paused/game-over, restoring initial seed, IDs, spawn schedule, prior gap and initial bird motion, clearing score/obstacles/ticks, then immediate initiating flap velocity at the starting position with zero elapsed ticks, no queued duplicate initiating flap and normal subsequent controls (FR-01, FR-04, FR-07, NFR-03). | Pending |
| T020 | [P] [US3] Extend `tests/browser.test.js` for each retry action including pointer and native button activation, rapid restart, stale held/pointer/queued-input/backlog clearing, synchronous complete reset render in activation handler with starting position, applied flap velocity, zero elapsed ticks and no queued duplicate initiating flap, and constant listener/animation-chain counts (FR-01, FR-04, FR-08, NFR-02, NFR-03; contracts/browser-game.md). Treat these as logic checks, not proof of visible paint latency. | Pending |
| T021 | [US3] Implement one fresh-round restart action in `game.js` using `simulation.js`, shared by below-game restart and accessible on-screen retry; replace round/RNG, clear input/timing, enter playing and immediately apply initiating flap velocity without advancing position or simulation time or queuing it again, synchronously draw all reset content and retain one listener set/animation chain. Keep pause resume separate and preserve its progress (FR-01, FR-04, FR-07, FR-08, FR-11, NFR-02). | Pending |
| T022 | [US3] Pass T019/T020 and record browser smoke checks for both retry controls, restart from every state, rapid activation, subsequent controls and native Tab/Enter in `specs/001-browser-flappy-bird/validation.md`; capture preliminary reset-visible-frame evidence without claiming the final 100-cycle latency acceptance (FR-04, FR-08, NFR-02, NFR-03). | Pending |
| T023 | [P] [US4] Add deterministic scripted traversal to `tests/simulation.test.js` through extreme allowed gap transitions, using legal flaps and normal collision/scoring, and assert reachable openings against the implemented simulation before browser acceptance. If provisional tuning fails, adjust `config.js` and synchronize tuning/tests with `specs/001-browser-flappy-bird/plan.md` and `specs/001-browser-flappy-bird/research.md` together; do not relax collisions or specified rules (FR-03, A-03, NFR-03). | Pending |
| T024 | [P] [US4] Add equal-tick replay tests to `tests/browser.test.js` at 30/60/120/144 Hz, jitter and delayed visible callbacks, with fixed seed and tick-indexed input; compare bird motion, obstacle sequence, collision tick and score, including backlog retention and pause-away exclusion. Run 100 complete start/play/end/restart cycles with real losses and scoring trajectories, asserting matching outcomes and no stale input/pair flags, duplicate points, loops or listeners (NFR-03, NFR-05). | Pending |
| T025 | [US4] Implement minimal native `tests/browser/index.html` and `tests/browser/validation.js` importing production modules with equivalent DOM/HUD/rendering, known fixtures and tick-indexed controls. Report assertions, errors, cycle/outcome comparisons, rendered FPS/frame intervals and restart activation marks; provide valid collision-free 60-second trajectory and 100-cycle scoring/loss/retry mode. Keep harness out of production imports and add no collision bypass, global production cheats or generalized replay framework (FR-01–FR-11, NFR-01–NFR-03, NFR-05). | Pending |
| T026 | [US4] Run `npm test` and all `specs/001-browser-flappy-bird/quickstart.md` functional journeys in desktop stable Chrome, Firefox, Edge and Safari; record actual versions, hardware/OS/display/viewport and per-browser outcomes in `specs/001-browser-flappy-bird/validation.md`. Include both focus restoration orders, all starts/resumes/retries, boundary fixtures, 0/1/10 scoring, Tab/Enter, responsive art/animation and actual desktop-touchscreen checks with device/browser evidence; report unavailable environments as incomplete (FR-01–FR-11, NFR-05, NFR-06, SC-01, SC-02). | Pending |
| T027 | [US4] Run the browser harness for 100 real start/play/end/restart cycles per supported browser and record matching terminal ticks, obstacle sequences, scores/collisions and zero unexpected errors/stale state/duplicate points in `specs/001-browser-flappy-bird/validation.md`. Measure all 100 restart activations against first presented complete-reset image using correlated activation timestamps and performance/screenshot or screen-capture evidence; record resolution and every result, require each ≤100 ms, and refine any uncertainty crossing the bound. An animation callback alone is insufficient paint evidence (NFR-02, NFR-03, SC-04, SC-05). | Pending |
| T028 | [US4] Measure a focused visible 60-second collision-free run in each supported browser using production rules/rendering and valid controls; record exact baseline, duration, rendered frame count, average FPS, intervals, workload and stutter observations/investigation/actions in `specs/001-browser-flappy-bird/validation.md`. Verify the proposed plan baseline before using it; report actual differences. Compare with 60 FPS as a target without inventing a numerical pass threshold (NFR-01, NFR-06, SC-03). | Pending |
| T029 | [US4] Complete requirement-to-task-to-implementation-function-to-unit/browser-evidence mappings in `specs/001-browser-flappy-bird/validation.md`, including all FR-01–FR-11, NFR-01–NFR-06 and SC-01–SC-06; record failures, fixes and reruns, and leave missing evidence explicitly incomplete (NFR-04, NFR-05, SC-06). | Pending |
| T030 | [P] Update `README.md` with dependency-free prerequisites, static-server and test commands, game/harness URLs, desktop controls, current-round-only scope and links to `specs/001-browser-flappy-bird/quickstart.md` and `specs/001-browser-flappy-bird/validation.md` (FR-01, FR-04, FR-11, NFR-04, NFR-05). | Pending |
| T031 | Review `index.html`, `style.css`, `config.js`, `simulation.js`, `renderer.js`, `game.js` and `tests/` for independent authorship, named constants, focused functions, consistent formatting, shared collision definitions and no unused dependencies/storage; record constitution I–V review in `specs/001-browser-flappy-bird/validation.md`. Fix confirmed defects with regression tests, rerun affected automated/browser checks, and close only when required evidence passes (NFR-04–NFR-06, SC-06). | Pending |

## Constitution review and remaining limitations

I: Existing specification/plan followed; only Phase 1 authorized and implemented.
II: Minimal focused setup files; gameplay boundaries remain planned.
III: Test discovery verified; no behavioral or browser coverage claimed before later test tasks.
IV: Zero package dependencies or build tools.
V: T001/T002 map to actual files/checks above; all remaining tasks and requirements have pending evidence references.

No browser, HTTP serving, gameplay, performance, visible restart latency or 100-cycle checks were run. Future evidence must include actual function/test names, browser/device details, defects and rerun references, FPS/frame records, cycle outcomes and visible reset measurements. Phase 1 completion does not establish full feature acceptance.

## Phase 2 — T003–T004 (2026-10-29)

Scope: only foundational configuration and fresh ready-round construction. Root
`config.js` and `simulation.js` were absent before this work and independently
authored from the feature artifacts; no Vibe source or assets were used.

T003: `config.js` exports immutable `CONFIG` and `createConfig(overrides)`.
Construction rejects nonfinite/unknown values, nonpositive sizes/speed/time,
invalid integer spawn ticks and nonzero uint32 seed, invalid opening/ground bounds,
non-upward flap velocity and an initial bird touching or outside fatal boundaries.
The existing `.gitignore` covers this dependency-free ES-module setup; no other
ignore files or dependencies are needed.

T004: `simulation.js:createRound(config)` validates configuration and returns a
plain ready round with zero tick/score, stationary bird, independent empty pairs,
next ID 1, configured spawn tick, clamped bird-centered previous gap and its own
numeric seed. Creation does not consume random values. RNG advancement remains
T008. The source preserves the model constraints and defines T009's fatal-position
policy: test the full proposed swept path before committing; on boundary loss
clamp stored y to [0, groundY - bird.height], keep x fixed and discard remaining
step time. Contact remains fatal. Collision detection, state transitions and
movement are deliberately deferred to their tasks; this policy is not runtime
collision evidence.

Executed on Node v22.15.0: `npm test` first failed with
`ERR_MODULE_NOT_FOUND` for the not-yet-created simulation module after the
constructor assertions were written. After implementation it passed: 6 reported
passes, comprising 5 behavioral tests and the existing empty browser-test file;
0 failures. `git diff --check` passed.

Actual tests in `tests/simulation.test.js`:

- `FR-02 FR-03 NFR-04: named configuration matches planned tuning and is immutable`
- `FR-02 FR-03 FR-10: construction rejects invalid numeric, bird and opening bounds`
- `FR-07 FR-02 NFR-03: fresh round has ready state, bird, schedule and owned RNG`
- `NFR-03 FR-07: fresh rounds do not share bird, pairs or random state`
- `FR-03 NFR-03: constructor uses configured seed and clamps bird-centered opening`

Constitution I–V review for this scope: follows the specified Phase 2 constants
and state; two focused native modules with named configuration; construction
coverage passes; zero added dependencies; task/function/test references recorded
above. Full requirements acceptance remains pending. No gameplay, browser,
performance or restart measurements were performed. `.specify/extensions.yml`
is absent at both pre- and post-execution checks, so no hooks were registered.

## Phase 3 — T005–T006, tests only (2026-10-29)

Authorized scope: T005 and T006 only. Both are marked complete for authoring
requirement-labelled tests and confirming missing behavior fails. T007–T031
remain unchecked; no production modules or dependencies were added or changed.
This is the deliberate red stage, not a passing US1 checkpoint or implementation
acceptance. Existing `.gitignore` covers this private native ES-module project;
no additional ignore tooling is applicable. Branch remains `sdd-development`.
The requirements checklist has 16 checked and zero unchecked criteria.

T005: `tests/simulation.test.js` retains five passing construction tests and adds
36 gameplay tests. Helpers `api`, `step`, `playing`, `pair`, `near` and `cruise`
create fixtures, invoke production functions and assert observable state; they
implement no substitute physics, random generation or collision detection.
Requirement-labelled names map to:

| Requirements | Actual test names / parameterized families |
|---|---|
| FR-01/02/07 | `start supplies one flap before gravity and position integration`; `flap rises, reaches an apex, then descends under gravity`; `ready/paused/game-over freezes every round field even with step inputs` |
| FR-07/11 | `pause/resume preserves world, tick, score and RNG; illegal transitions are inert` |
| FR-03, NFR-03 | `first spawn at tick 210, recurring tick 420, fixed movement and 273px spacing`; `equal seeds yield equal openings and advance only round-owned RNG`; `known extreme samples obey global and previous-gap reachability bounds`; `retire only when pair right edge is strictly negative` |
| FR-05/10 | `pipe upper/lower exact contact/overlap/clear`; ceiling/ground exact/crossing/initial-overlap/clear fixtures; horizontal leading/trailing edge equality and either side; moving-pipe and upward-bird sweep fixtures; `swept AABB` initial-overlap/zero-relative-velocity/perpendicular-separation cases; relative crossing and nonconcurrent-axis cases |
| FR-05/07/10 | `one terminal transition freezes all subsequent steps and inputs` |

The tests document proposed production seams: `startOrFlap(round)` selects
playing from ready/paused; the caller supplies one `{ type: 'flap' }` for the
next tick. `pauseRound(round)` is legal only during play.
`stepRound(round, config, inputsForTick, random?)` consumes the supplied inputs
before integrating, with optional known obstacle random samples.
`sweptAabb(a, b, displacementA, displacementB)` returns inclusive swept contact.
These signatures make the contract executable; equivalent future signatures
may update test call sites while preserving assertions. The first spawned pair
is checked at 398.7 after the spawn-then-move tick (spawn origin 400), following
the plan's per-step ordering. Seed fixture 3388403996 is the first unsigned
xorshift32 state from 0x1A2B3C4D. Extreme samples verify the specified bounded
60px transition rule; full legal trajectory reachability remains T023.

T006: `tests/browser.test.js` adds 32 tests with small local `target`,
`inputFixture`, `gesture`, `scheduler` and `loopFixture` helpers. No DOM emulator,
real sleeps, third-party tooling or fake production implementation is used.
The event fake supports listeners, cancellation and bubbling; the scheduler
uses explicit timestamps and tracks outstanding callbacks.

| Requirements | Actual test names / parameterized families |
|---|---|
| FR-01/02/07/08/11 | Space/ArrowUp/mouse/touch/button starts and resumes (10 cases); preservation of paused progress and one flap applied through the bound gameplay action |
| FR-01/02/08 | `held keys suppressed independently, repeats ignored, release allows next press`; gameplay defaults with native Tab/Enter; pointer compatibility/button bubbling; secondary-button/cancelled-pointer handling |
| FR-11 | focus-first/visibility-first guards and explicit restoration; blur/hidden clearing of held/pointer state and pause/clear callbacks |
| FR-01/02, NFR-03 | `two distinct inputs target one tick, preserve FIFO, drain once and do not accumulate impulse`; `future tick input is neither consumed early nor carried past its tick`; two actual distinct key events before one frame entering FIFO |
| FR-07/11, NFR-03 | pause backlog/input clearing and fresh origin; inactive ready/paused/game-over excludes elapsed time; input-focus-loss wiring actually clears loop backlog and pending input |
| FR-05/07, NFR-03 | 30-step cap retains 120 visible steps across callbacks; terminal step stops the same callback; one animation chain through repeated start/reset; loop and listener disposal |

Proposed browser seams are documented at the top of the test file:
`bindInput(targets, { gameplay, pause, clear }, { isFocused, isVisible })`
returns a disposer; `createLoop` accepts injected step/render/clock/scheduler
and `isPlaying`, and exposes start/dispose/resetTiming/enqueue/clearInput.
Queue targets are one-based simulation ticks; step receives FIFO items and may
return false on loss. These tests import production modules. Missing `game.js`
is caught narrowly to allow individual assertions naming absent exports;
syntax errors and other missing imports are not suppressed. Future composition
of state-specific controls/DOM remains T013; native rendering, native button
activation and real touchscreen behavior require later browser evidence.

Executed with Node v22.15.0: `npm test` reports 73 tests, 5 pass, 68 fail,
zero skipped/cancelled/todo. All 68 failures explicitly identify missing
production exports: simulation `stepRound` (29), `sweptAabb` (6),
`startOrFlap` (1), `pauseRound` (1); game `bindInput` (20), `createLoop` (11).
This confirms red assertions for absent T007–T010 behavior; downstream assertions
cannot yet execute and will require validation during implementation. No tests
were skipped or weakened to turn the suite green. `node --check` passes for
both test files; `git diff --check` passes.

Issues/limitations: the full suite intentionally exits nonzero until gameplay
and browser helpers are implemented. Bounded opening tests are not full traversal
proof; no real-browser, touch-device, rendering, scoring, restart, determinism
acceptance, latency or performance results are claimed. Constitution I–V:
specification-derived test scope, focused dependency-free fakes, explicit red
coverage pending implementation, no added dependencies and requirement/task/test
traceability recorded here. `.specify/extensions.yml` is absent at pre- and
post-execution checks, so no hooks are registered.

## Phase 3 — T007 only (2026-10-29)

Authorized scope: only T007. `simulation.js:startOrFlap` changes ready/paused
into playing and leaves playing/game-over unchanged; the caller supplies the
initiating normalized flap for the next step, as specified by T005 and the
browser contract. `pauseRound` changes only playing into paused, preserving all
world fields, score, tick, collections and RNG. `stepRound` ignores inactive
rounds and returns false; active steps consume supplied tick inputs in FIFO
order, set (rather than add) flap velocity for each, apply configured gravity
then position using the fixed step, increment activeTick once and return true.
Inputs are never stored or replayed by the simulation. Tick queue ownership and
focus/visibility handling remain T010. Obstacle generation, swept collision,
fatal-position resolution and scoring remain their assigned later tasks.

Verification on Node v22.15.0, branch `sdd-development`:

- Before implementation, the six existing T007 start/motion/frozen/lifecycle
  tests failed for missing production exports.
- After implementation, the following targeted command passed 12 tests with
  zero failures: `node --test --test-name-pattern='named configuration|construction rejects|fresh round|constructor uses|start supplies|tick inputs are|flap rises|freezes every|pause/resume preserves' tests/simulation.test.js`.
- Actual T007 tests in `tests/simulation.test.js`: `start supplies one flap
  before gravity and position integration` (FR-01/02/07); `flap rises, reaches
  an apex, then descends under gravity` (FR-02); the three `ready/paused/game-over
  freezes every round field even with step inputs` cases (FR-02/07);
  `pause/resume preserves world, tick, score and RNG; illegal transitions are
  inert` (FR-07/11); and the added `tick inputs are consumed FIFO without
  accumulated impulse or carryover` (FR-01/02, NFR-03). The added test observes
  both input reads in order, one flap's velocity/displacement, and subsequent
  gravity without replaying either input. Five construction tests also pass.
- `npm test`: 74 tests, 18 pass, 56 fail, zero skipped/cancelled/todo. Remaining
  failures concern T008 obstacle generation/movement/retirement, T009 collisions
  and T010 input/loop exports. Passing clear-hazard fixtures alone do not prove
  collision handling. No later task is marked complete.
- `git diff --check` passes. Existing `.gitignore` covers the private ES-module
  project; no other ignore tooling applies. No dependencies were added.

Constitution I–V review: specified T007 scope, focused native simulation
functions and named configuration, passing relevant core tests, no additional
dependencies, and requirement/function/test traceability above. Implementation
was independently authored from the feature documents; no Vibe code/assets used.
No browser or complete gameplay acceptance is claimed. Requirements checklist:
16 checked, zero unchecked. `.specify/extensions.yml` is absent at pre- and
post-execution checks, so there are no hooks to dispatch.

## Phase 3 — T008 only (2026-10-29)

Authorized scope: only T008, preserving the prior T007 changes. Implemented in
`simulation.js`: `nextObstacleRandom(round)` advances round-owned xorshift32
with left 13, unsigned right 17, left 5 shifts, stores the unsigned result and
divides by 2^32. `spawnPair(round, config, random)` samples the intersection of
global gap bounds and the previous opening ±maxGapChange, creates an unscored
pair with a unique round ID and configured geometry, updates the prior opening
and advances the integer spawn schedule. `stepRound` accepts an optional known
random stream, spawns at the configured world width on the scheduled active
tick, moves all pairs by pipeSpeed × stepSeconds, and retires only pairs whose
right edge is strictly negative. No cosmetic randomness is used. Injected
streams do not consume the round-owned RNG. Existing fresh-round construction
initializes the previous opening from the clamped bird-centered opening.

FR-03 / NFR-03 verification in `tests/simulation.test.js`:

- `first spawn at tick 210, recurring tick 420, fixed movement and 273px spacing`
- `equal seeds yield equal openings and advance only round-owned RNG`
- `known extreme samples obey global and previous-gap reachability bounds`
- `retire only when pair right edge is strictly negative`
- Added `obstacle samples are drawn only on active spawn ticks and injection
  preserves RNG`: verifies no draw before spawn or while paused, exactly one
  draw at spawn, complete new-pair geometry/flags, preserved seed and schedule.

The four existing obstacle tests failed before implementation and pass afterward.
On Node v22.15.0, the targeted construction/T007/T008 command passed 17 tests,
zero failures: `node --test --test-name-pattern='named configuration|construction rejects|fresh round|constructor uses|start supplies|tick inputs are|flap rises|freezes every|pause/resume preserves|first spawn|equal seeds|known extreme|retire only|obstacle samples' tests/simulation.test.js`.
`npm test` reports 75 tests: 23 pass, 52 fail, zero skipped/cancelled/todo.
Remaining failures cover collision handling (T009) and input/loop helpers (T010).
`git diff --check` passes. T008 alone is newly marked complete; collision,
scoring, full reachability traversal and browser acceptance remain future tasks.
Retirement will need to follow collision/scoring when those tasks are integrated.

Constitution I–V review: specification-derived native simulation helpers,
named configuration, passing scoped core tests, no new dependencies and explicit
requirement/function/test mapping above. Source was independently authored;
no Vibe source/assets used. Existing ignores cover this private native ES-module
project; no additional ignore tooling applies. Branch: `sdd-development`.
Checklist: 16 checked, zero unchecked. `.specify/extensions.yml` is absent at
pre- and post-execution checks, so no hooks are registered. No browser,
performance, restart or full gameplay acceptance is claimed.
