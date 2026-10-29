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

## Phase 1 historical requirement and evidence mapping

Historical setup snapshot; the Phase 6 traceability table below supersedes these pending statuses. Each row links requirements to planned implementation and verification; no functional requirement is accepted by Phase 1. Actual functions, assertion names and browser evidence must be added when the corresponding tasks are executed. Detailed task descriptions in tasks.md remain authoritative.

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

## Phase 1 historical task register

T003–T006 are complete as recorded below. T005/T006 deliver red tests only; gameplay implementation and T007–T031 remain pending. The descriptions below retain planned files and requirement references.

| Task | Planned work / requirement references | Evidence |
|------|--------------------------------------|----------|
| T003 | Add named constants and construction validation in `config.js`: 400×600 world, ground 526, step 1/120 s, bird (90,248,34,28), gravity 1512, flap -450, pipe width 64, gap 164, speed 156, spawn 210 ticks, gap range 75..287, max change 60 and seed 0x1A2B3C4D. Preserve data-model constraints verbatim: "Immutable named values; positive sizes/speed, gap larger than bird height, valid opening within ground; shared by simulation/rendering/tests" (FR-02, FR-03, NFR-04). | Complete: `config.js` (`CONFIG`, `createConfig`); Phase 2 configuration tests below. |
| T004 | Add constructor/configuration assertions in `tests/simulation.test.js`, then implement plain fresh-round creation in `simulation.js`, including independent collections and round-owned RNG. Preserve constraints: "phase is ready/playing/paused/game-over; tick and score nonnegative integers; owns one bird and zero or more pairs; only playing advances tick; ready has zero score/tick and empty pairs"; bird "x remains fixed; top-left origin; full unrotated rectangle defines contact; y >= 0; ceiling or ground contact causes loss". Define how fatal proposed positions resolve without leaving an invalid stored bird position (FR-02, FR-07, FR-10, NFR-03). | Complete: `simulation.js:createRound`, `tests/simulation.test.js`; Phase 2 construction tests below. |
| T005 | [P] [US1] Add requirement-labelled tests in `tests/simulation.test.js` for start with one flap, gravity/apex/descent, frozen inactive states, seeded bounded/reachable openings, first and recurring spawn ticks, constant movement/spacing, retirement, exact contact/overlap/swept crossings of pipes/ceiling/ground, initial overlap and zero relative velocity, one terminal transition and legal pause/resume preservation (FR-01–FR-03, FR-05, FR-07, FR-10, FR-11). | Complete (tests only): `tests/simulation.test.js`; Phase 3 red-test evidence below. |
| T006 | [P] [US1] Add contract/input/loop tests in `tests/browser.test.js` using small event-target and injected-clock/scheduler fakes: all starts and resumes yield one flap; per-key hold/repeat suppression; FIFO tick queue, including two distinct inputs before one tick with both consumed in FIFO order, no accumulated impulse and no delayed flap; pointer compatibility/button deduplication; gameplay defaults prevented while Tab/Enter work; focus-and-visibility guards; both restoration orders; pause clears backlog/input; 30-step callback cap retains visible backlog; one animation chain; disposal removes listeners (FR-01, FR-02, FR-07, FR-08, FR-11, NFR-03; contracts/browser-game.md). | Complete (tests only): `tests/browser.test.js`; Phase 3 red-test evidence below. |
| T007 | [US1] Implement start/flap, fixed-step movement and legal pause/resume transitions in `simulation.js`; consume all queued inputs for the tick in FIFO order before semi-implicit Euler movement, setting flap velocity for each without accumulating impulse or carrying inputs into later ticks, advance active ticks only during play, preserve world/RNG on pause, and ignore gameplay keys after game over (FR-01, FR-02, FR-07, FR-11). | Complete; see T007 evidence below |
| T008 | [US1] Implement round-seeded obstacle generation/movement/retirement in `simulation.js`: unsigned xorshift32 shifts 13/17/5 divided by 2^32, injectable known streams, first spawn tick 210 at x=400, recurring interval 210, gap intersection with previous ±60 initialized from clamped bird-centered opening. Preserve pair constraints: "Unique within round; top rectangle spans y=0..gapTop, bottom spans gapTop+gapHeight..526; inclusive edges; scored may change false→true once; remove after right edge <0". Keep cosmetic randomness separate (FR-03, NFR-03). | Complete; see T008 evidence below |
| T009 | [US1] Implement inclusive swept relative-displacement AABB checks in `simulation.js` for both moving pipe rectangles, ceiling and ground, including initial overlap and zero velocity; integrate proposed movement/spawn/movement before collision, terminate once before any scoring, discard remaining collision-step time and stop subsequent backlog steps after loss (FR-05, FR-10). | Complete; see T009 evidence below |
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

## T009 — swept collision and terminal freeze

Scope: T009 only, 2026-10-29. Implemented independently from the feature specification and plan; no Vibe code/assets accessed. Requirements checklist: 16/16 checked, unchanged. Existing `.gitignore` covers the detected private dependency-free Node project; no additional ignore files needed. `.specify/extensions.yml` is absent at pre/post checks, so no hooks apply.

Implementation: `simulation.js:sweptContactTime` intersects inclusive per-axis time intervals using relative displacement, including initial contact/overlap and zero relative velocity. Exported `sweptAabb` provides the boolean test seam. `firstCollisionTime` checks both full pipe rectangles and ceiling/ground planes, selecting the earliest contact across all hazards. `stepRound` consumes inputs, computes proposed semi-implicit movement, advances the active tick and spawns before checking the full proposed sweep. It commits bird/pipe movement only through first contact, clamps stored bird bounds, sets game-over once and returns before scoring/retirement. Subsequent backlog calls return false without mutation. Existing score and pair scoring flags remain unchanged. Browser-loop scheduling remains T010.

Verification: before implementation, `node --test tests/simulation.test.js` reported 23 passes and 21 collision/helper failures. After implementation and additional collision regressions it reports **47 passes, 0 failures**. Existing FR-05/FR-10 tests cover exact/near edges, initial overlap, zero relative velocity, ceiling/ground, upward and moving-pipe tunneling, disjoint axis-time intervals and terminal freeze. Added tests:

- `FR-05 FR-10: earliest contact discards remaining movement and preserves score` — hazard order independence, fractional pipe movement, unchanged score/flags and inert backlog calls.
- `FR-05 FR-10: ground contact stops bird and pipes at the same fractional time` — shared first-contact position and discarded remaining step time.
- `FR-05: newly spawned lower pipe can sweep through bird before retirement` — spawn-before-collision and detection before a fast hazard can retire.

`npm test`: 78 tests, 47 passed, 31 failed; all failures are browser tests requiring absent `game.js` (pending T010 and later integration). No browser implementation or acceptance claimed. `git diff --check` passes. T009 alone marked complete; other task markers unchanged. Constitution I–V review: specified behavior, focused numeric helpers/shared bounds, requirement-labelled automated collision coverage, no added dependencies and task/function/test evidence above.


## T010 — exported input, fixed-step loop and browser initialization gate

Scope: T010 only, 2026-10-29, on `sdd-development`, Node v22.15.0.
`game.js` was absent and independently authored from the feature artifacts;
no Vibe source/assets accessed. Requirements checklist: 16 checked, zero
unchecked, unchanged. Existing `.gitignore` covers the private native ES-module
project; no additional ignore tooling or dependencies apply.

Implementation in `game.js`:

- `bindInput` owns per-key held state, focus/visibility guards, pointer state,
  default prevention and listener disposal. Click is the single pointer/button
  activation path; compatibility mouse events have no activation listeners and
  button clicks stop bubbling. Tab/Enter retain native behavior. Blur/hidden
  clear held/pointer state and call pause/clear actions; restoration does not
  activate gameplay. The returned disposer exposes `clear()` for later restart
  composition without rebinding listeners.
- `createLoop` uses the shared 1/120-second configuration and injected monotonic
  clock/scheduler. Tick-indexed queues drain FIFO once before each step. Past or
  noninteger tick targets are rejected. Each callback processes at most 30 steps,
  retains visible backlog and renders afterward. Inactive states and terminal
  steps clear timing/input; explicit reset establishes a null clock origin.
  Repeated start maintains one chain; dispose cancels it. `clearInput(1)` allows
  later fresh-round composition to rebase tick targets while preserving the
  existing chain. Clock regression cannot replay elapsed time.
- `initializeBrowser` guards absent documents and waits for DOMContentLoaded
  when necessary, with a cancellable listener. Node import has no DOM access or
  scheduling side effects. Actual page/renderer/HUD composition remains T013;
  this task supplies its initialization gate only.

Verification: before implementation, `node --test tests/browser.test.js` failed
all 31 existing browser-helper tests for missing exports. After implementation,
all existing tests passed. Added requirement-labelled regressions in
`tests/browser.test.js`: `browser initialization is DOM-safe and waits for page
readiness`; `clock regression cannot replay elapsed time; stale tick inputs are
rejected`; `explicit input reset clears held keys and rebases fresh-round tick
queue`. The first added test initially ran before the test file's awaited module
import; moved its registration after that import and reran successfully.
Final `npm test`: **81 passed, 0 failed**, zero skipped/cancelled/todo, including
34 input/loop/initialization tests and 47 simulation tests. Existing T006 tests
verify all start/resume inputs, repeat/default prevention, FIFO and nonaccumulated
flaps, pointer/button deduplication, both restoration orders, pause/backlog
clearing, inactive time, 30-step cap, terminal-step stopping and disposal.
`git diff --check` passes.

Constitution I–V: specified T010 scope, focused native helpers/shared timing
constant, requirement-labelled passing tests, zero dependencies and explicit
function/test traceability above. Only T010 is newly marked complete. No page,
renderer, score/restart integration, real-browser/touch, performance or complete
US1 acceptance is claimed. `.specify/extensions.yml` is absent at pre- and
post-execution checks; no hooks are registered.


## T011 — Semantic page and responsive styles (2026-10-29)

Requirements: FR-07–FR-09. Created new root `index.html` and `style.css`
from the specification; no existing application paths were replaced and no Vibe
source/assets were used. The inline SVG bird icon is independently drawn.

- `index.html`: semantic main/header/section/footer, title and icon above the
  playfield; current-round score output, polite atomic status, persistent control
  and hazard instructions, native below-game `game-button` initially labelled
  Start game, and native on-screen `retry-button` initially hidden. Stable IDs
  support later state-specific Start/Resume/Restart labels, status and retry
  visibility. Canvas fallback and noscript text explain browser requirements.
- `style.css`: strong arcade colors, system fonts, responsive centered layout,
  wrapping HUD, readable instructions, large native controls, hover/active styles
  and explicit focus-visible outline. Canvas width scales with its container;
  height auto and 2:3 aspect ratio preserve intrinsic 400×600 logical coordinates.
  Retry positions relative to the playfield and remains removed from display
  and keyboard navigation while hidden. No dependencies or external resources.

Verification: dependency-free Python HTMLParser inspection passed unique IDs,
all ARIA ID references, native button types, initially hidden retry, intrinsic
400×600 canvas and existing local stylesheet/module paths. Static CSS review
confirmed proportional canvas scaling and focus styles. `npm test`: 81 passed,
0 failed. These existing tests cover gameplay/helpers, not rendered layout.
`git diff --check` passed. No browser visual, zoom, native keyboard or touchscreen
verification is claimed; US1 browser smoke checks remain T014. Renderer T012,
DOM composition/state-specific updates T013 and retry behavior T021 remain
pending, so this page alone is not yet a playable game.

Constitution I–V: scoped specification-derived markup/styles, focused files,
existing tests pass, no dependencies, and requirement/file/check references
recorded above. Existing .gitignore covers required JavaScript/universal
patterns; no additional ignore files are applicable. Only T011 newly completed.
`.specify/extensions.yml` absent at pre/post checks; no hooks to dispatch.

## T013 — Production composition (2026-10-29)

Requirements: FR-01–FR-03, FR-05, FR-07–FR-11. Only T013 completed.
`game.js` now exports `mountGame(page, options)` and invokes it through
`initializeBrowser` in a browser. It owns one fresh round, binds the existing
input adapter once, steps production `stepRound` through `createLoop`, and
draws production `renderer.render` with cosmetic clock time. `updateView`
derives score, status, instructions, control labels and retry visibility directly
from the round. Unchanged accessible status text is not rewritten every frame.
Start/resume changes phase visibly immediately and queues one initiating flap
for the next tick. Pause draws immediately, clears input/backlog, and restoration
does not resume. Loss stops further simulation and retains the round/final score.
The returned disposer removes input listeners and cancels the animation chain.

Scope: state-specific Restart game and on-screen retry controls are displayed
but disabled pending T021. Scoring implementation remains T017; browser smoke
checks remain T014. No later task or browser acceptance is claimed.

Verification: six new requirement-labelled composition tests in
`tests/browser.test.js` initially failed because `mountGame` was absent (34
existing browser tests passed). After implementation, `npm test` passed **90
tests, 0 failed**, including all T005/T006 tests. Five parameterized tests
`FR-01 FR-02 FR-07 FR-11: composed … start and resume render and apply one flap`
cover Space, ArrowUp, mouse, touch and native-button click paths, HUD labels,
preserved paused state, one flap, fresh resume clock, and disposal. The test
`FR-03 FR-05 FR-07 FR-10 FR-11: composed hidden pause and loss freeze the rendered round`
uses production simulation to reach a fatal boundary, checks hidden/restored
pause, final score/status/retry visibility, ignored post-loss input and one
animation chain. These use tiny event targets and an injected scheduler/draw
recorder; actual browser input, rendering and native defaults await T014.
`git diff --check` passed.

Constitution I–V: specification-derived composition, focused existing module
boundaries, tests written before implementation, zero added dependencies, and
requirement/function/test links above. Existing JavaScript/universal ignore
patterns are sufficient; no other ignore tooling applies. Checklist
requirements.md passed 16/16 without modification. `.specify/extensions.yml`
absent at pre/post checks; no hooks to dispatch.


## T012 — Read-only arcade renderer (2026-10-29)

Requirements: FR-05, FR-07–FR-10, NFR-03. Added independently authored
`renderer.js`; no Vibe code or artwork used and no dependencies added.

- `render(context, round, config = CONFIG, timestamp = 0)` draws a complete
  logical frame synchronously. Optional milliseconds drive decoration only;
  the renderer reads no clock, randomness, DOM or storage and retains no state.
  The caller can pass RAF time. Score and lifecycle messages come directly from
  the supplied round on every call. A replacement playing round draws without
  a prior overlay; actual restart and HUD composition remain later tasks.
- `drawBird` fills and clips to the full unrotated bird contact rectangle, with
  an animated inset wing and no positional bobbing. `drawPipe` fills and clips
  each shared upper/lower collision rectangle; highlights and caps stay inside.
  `drawGround` begins at configured groundY. `drawSky` adds moving pixel clouds,
  a sun and a skyline; inset ground lights animate independently of gameplay.
- `drawOverlay` supplies distinct ready/start, paused/resume and game-over/final
  score/retry messages. The existing native retry button remains owned by later
  page composition; no canvas-only interactive control is introduced.

Verification: wrote `tests/renderer.test.js` first; initial execution failed with
ERR_MODULE_NOT_FOUND for the absent renderer. After implementation, `npm test`
passed **84 tests, 0 failed**, including these three new tests:

- FR-07–FR-09: each render derives overlay and score from the current round.
- FR-05/FR-10: bird and pipe artwork uses full shared collision rectangles.
- FR-08/NFR-03: cosmetic time changes drawing without mutating frozen round or
  consuming RNG (deep-frozen round and before/after state, including rngState).

The recording-context tests inspect drawing commands, not rasterized appearance.
Browser visual/layout/animation evidence remains T014 after T013 composition;
no browser compatibility, presented-frame latency or completed US1 acceptance
is claimed. `git diff --check` passed. Existing .gitignore covers the required
JavaScript/universal patterns; no other ignore tooling applies to this private,
dependency-free static project.

Constitution I–V: scoped specification-derived renderer, focused drawing helpers
and shared configuration, requirement-labelled tests, zero dependencies, and
function/test traceability above. Only T012 newly marked complete.
`.specify/extensions.yml` absent at pre/post checks; no hooks to dispatch.

## T014 — Phase 3 browser smoke and native-click correction (2026-10-29)

Scope: remaining Phase 3 work only, on `sdd-development`. Requirements checklist
passes 16/16, unchanged. No extension hooks are configured. No packages added.

Environment: macOS 26.3.1 / Apple M1 (previous environment verification), Node
22.15.0, installed Chrome **156.0.8078.48**, headless, via Chrome DevTools Protocol.
Viewports 1100×1100 and 360×900, scale factor 1. An isolated temporary Chrome
profile and focus emulation were used. `python3 -m http.server 8000 --bind
127.0.0.1` initially hit sandbox restrictions; the approved retry found port 8000
already occupied. The existing server served the current root page and modules
successfully. Browser navigation used `http://127.0.0.1:8000/`.

Evidence in [evidence/phase3/](evidence/phase3/):
`flappy-smoke.mjs` is the dependency-free Node/CDP smoke driver (requires Chrome
on debugging port 9222 and the local server); `flappy-smoke-results.txt` records
the successful run. `flappy-ready.png`, `flappy-loss.png`, and
`flappy-narrow.png` were captured in Chrome and visually inspected.
The driver saves screenshots under `/private/tmp`; the committed copies preserve
this run. Real waits are confined to this external browser smoke driver, not
unit tests. This is an incremental smoke check, not final browser acceptance.

Observed browser outcomes:

- Ready status and zero score; title/icon, strong arcade colors, native controls,
  instructions and readable ready/game-over overlays visible. Ready screenshots
  at different times have different canvas pixels, verifying cosmetic animation.
- Space, ArrowUp, mouse click, emulated touch tap, native Start button and native
  Tab/Enter independently start and resume. Native Tab focuses Start and its
  computed focus outline is visible. Each method's rendered status changes to
  Flying. Exact one-flap/FIFO semantics are covered by production unit tests.
- A dispatched window blur pauses immediately. A 1.4-second wait followed by
  dispatched focus leaves the page paused; explicit activation resumes and the
  page remains Flying after the next callbacks, without away-time catch-up.
  These lifecycle events were dispatched in the real browser; physical tab
  switching and OS focus changes were not exercised in this headless session.
  Visibility handling and both restoration orders pass the existing unit tests.
- Native repeated Space and ArrowUp events do not prolong flight: both reach
  natural ground loss. Every gameplay keydown is default-prevented and scrollY
  remains unchanged. Tab and Enter keep their native behavior.
- Natural ground collision shows Game over, final score 0, on-screen retry and
  Restart game. Space after loss leaves game-over unchanged. Exact pipe/ceiling
  and swept hazard cases remain covered by the simulation tests rather than
  claimed as manual browser journeys in this run.
- The narrow layout has no horizontal overflow and preserves the 2:3 canvas
  aspect ratio. Both screenshots show readable artwork and controls.
- **Zero runtime JavaScript exceptions** captured through Runtime.exceptionThrown.
  Chrome's process emitted macOS CVDisplayLink and allocator diagnostics in
  headless mode; these are not game-console exceptions. No FPS claim is made.

The first native mouse check exposed an actual defect: Chrome's completed click
had `button: 0` and `isPrimary: false`, so `bindInput.activate` rejected it.
Added `FR-01 FR-08: native clicks activate even when isPrimary is false` in
`tests/browser.test.js`; it failed before the fix (0 actions vs 2 expected).
`game.js:bindInput` now filters completed clicks by mouse button and availability,
without requiring pointer-primary metadata. The regression covers both playfield
and native-button activation, including bubbling deduplication. Pointerdown's
primary-pointer check remains. The complete Chrome run then passed.

Final verification: `npm test`: **91 passed, 0 failed**, no skipped/cancelled/todo;
`git diff --check` passed. T005–T014 are complete for this MVP increment. Scoring,
restart implementation, performance/100-cycle validation, four-browser journeys,
physical desktop touch and OS/tab lifecycle acceptance remain in later phases.
No physical touchscreen, presented-frame timing or cross-browser pass is claimed.

Constitution I–V reviewed: scoped specification-derived fix; focused input
boundary; failing-then-passing regression plus browser evidence; no dependencies;
requirement/task/function/test traceability recorded here. No Vibe code or assets
were accessed or changed. Pre/post extension-hook checks: extensions.yml absent.

## Phase 4 — Fair current-round scoring, T015–T018 (2026-10-29)

Requirements: FR-05–FR-09, SC-02, NFR-03. Branch `sdd-development`.
Requirements checklist passed 16/16, unchanged. Existing `.gitignore` covers
this private native ES-module project; no other ignore tooling applies.
`.specify/extensions.yml` is absent at pre/post checks; no hooks to dispatch.
No dependencies or persistence introduced; no Vibe code/assets accessed.

- **T015** — `tests/simulation.test.js`: strict boundary tests cover equality
  and ±0.001 px; one paired upper/lower hazard counts once across repeated
  steps and retirement; simultaneous unscored pairs count separately, already
  scored pairs stay inert, and offscreen passes score before retirement.
  Pipe/ceiling/ground collision tests suppress all potential points with both
  hazard orders and preserve an existing score through inert later steps.
  `FR-06 SC-02: controlled legal trajectory clears exactly … pairs` covers
  0/1/10 using normal physics/collision and generated openings with injected
  legal sample 0.5, then natural loss, asserting integer/nonnegative scores.
- **T016** — `tests/browser.test.js`: `FR-06 FR-07 FR-09 NFR-03: HUD and canvas
  show … by next render and preserve final score` covers 0/1/10. Uses production
  `mountGame`, loop, simulation and renderer with tiny event/scheduler/Canvas
  command recorders. Checks score on the first rendered scoring tick, matching
  HUD/canvas values, final status/overlay and unchanged state/RNG after drawing.
  `pageFixture` accepts an optional draw observer; no production test hook added.
- **T017** — `simulation.js:stepRound` now awards each unscored strictly passed
  pair once, after collision's terminal early return and before retirement.
  The round remains the only score owner. Inclusive contact and fractional
  fatal movement are unchanged. Existing scored flags and score freeze on loss.
- **T018** — Existing `game.js:mountGame/updateView` and `renderer.js:render`
  already derive current/final score from the round; their production code
  needed no changes. The new contract tests verify the integration.

TDD evidence: after adding tests and before scoring, `npm test` reported
**98 passed, 7 failed** (105 total). Failures exposed missing strict-pass,
once-only/multiple-pair, nonzero trajectory and HUD scoring behavior. After
implementation **105 passed, 0 failed**, no skipped/cancelled/todo. Node
v22.15.0; no sleeps or DOM-emulation dependencies in unit tests.
`git diff --check` passed.

Browser evidence: [evidence/phase4/scoring-smoke.mjs](evidence/phase4/scoring-smoke.mjs),
[results](evidence/phase4/scoring-results.txt), and
[score-10 screenshot](evidence/phase4/scoring-final-10.png).
Chrome 156.0.8078.48 headless on the local macOS workspace; 1100×1100 viewport,
scale 1, isolated temporary profile. Served current modules via the existing
localhost:8000 server; the attempted server launch reported the port occupied.
Local socket/Chrome checks required approved sandbox escalation.

The native-browser driver imported production modules and traversed legal fixed
opening streams to 0/1/10, then allowed natural loss: terminal ticks 69/553/2455.
Each resulting round was supplied as a controlled fixture to a separately
mounted production view on native DOM/Canvas with injected frame scheduling.
Observed HUD and final status 0/1/10, repeated-render state preservation, and
collision precedence (score 2 retained with the potential new point unawarded).
Screenshot visually confirms readable HUD, canvas score and final overlay 10.
Zero captured runtime JavaScript exceptions. These are controlled browser
fixtures, not human-played trajectories or real-time performance measurements;
next-render integration is also asserted by the automated composition tests.
Full supported-browser/device journeys and measurements remain later tasks.

Constitution I–V reviewed: specified scoring semantics; focused change within
existing module boundaries and shared geometry; failing-then-passing core tests
plus native-browser evidence; zero dependencies; explicit task/function/test
traceability above. T015–T018 marked complete; Phase 5 and later remain unchecked.

## Phase 5 — Immediate clean retry, T019–T022 (2026-10-29)

Requirements: FR-01, FR-04, FR-07, FR-08, FR-11, NFR-02, NFR-03.
Branch `sdd-development`. Requirements checklist passed 16/16; no checklist
markers changed. Existing ignore rules suffice for this private ES-module
project. `.specify/extensions.yml` absent at pre/post checks: no hooks.

- **T019** — `tests/simulation.test.js`, `FR-04 FR-07 NFR-03: restart from …
  restores all round state with immediate flap` (four lifecycle states): fresh
  bird/collections, score, tick, IDs, spawn schedule, prior gap and seed match
  construction defaults; flap velocity is applied at tick zero; previous round
  stays unchanged; following ticks fall normally and accept fresh flap input.
- **T020** — `tests/browser.test.js`, `FR-04 FR-08 NFR-02 NFR-03: … resets
  synchronously with one chain` (both controls × mouse/touch/native click):
  nonzero terminal fixture, stale held key/queued flap and retained timing
  backlog, complete synchronous reset draw, fresh subsequent input, no duplicate
  initiating flap, twelve rapid activations, stable listeners/one scheduled
  animation, full disposal. `FR-04 FR-11: shared restart action replaces …`
  covers all four lifecycle states through the mounted restart action.
- **T021** — `simulation.js:restartRound` creates an independent playing round
  with one immediate flap and zero elapsed time. `game.js:mountGame/restart`
  replaces the round, clears input/held/pointer state, resets tick queue to 1
  and timing, and draws synchronously. Both native controls share this action;
  retry stops propagation to the game area. The below-game button restarts
  playing/ended rounds, while Start/Resume retain their separate behavior.
  The mount disposal handle exposes `.restart()` for an explicit reset from
  any lifecycle state; listeners/animation are retained rather than recreated.
- **T022** — Native browser evidence is recorded below; all relevant tests pass.

TDD: **105 passed, 14 failed** after adding tests and before implementation;
then **119 passed, 0 failed**, no skipped/cancelled/todo. Node v22.15.0,
`npm test`. No unit sleeps, packages or DOM emulation introduced.
`git diff --check` passes.

Browser: Chrome 156.0.8078.48 headless on this macOS workspace, 1100×1100,
scale 1, existing local HTTP :8000 and debugging :9222; local socket access
required sandbox approval. Reproducible driver:
[evidence/phase5/restart-smoke.mjs](evidence/phase5/restart-smoke.mjs);
[results](evidence/phase5/restart-results.txt);
[reset screenshot](evidence/phase5/restart-reset.png).
The controlled native DOM/Canvas composition uses production mount/simulation/
renderer and injected frame scheduling. It checks shared restart from every
state, both controls from nonzero game-over fixtures, rapid activation, browser
mouse clicks on both controls, and native Shift+Tab/Enter activation of the
on-screen retry. Reset assertions include starting position, flap velocity,
zero ticks, fresh seed, empty obstacles, zero HUD, Flying status and hidden
retry overlay. Zero captured runtime exceptions. Screenshot inspected:
complete fresh playing frame with zero score, initial bird and no obstacles.
An initial automation attempt omitted Enter's carriage-return text; supplying
it exercised the browser default activation successfully. No production fix
was needed for that driver issue.

This is preliminary reset-frame evidence, not a measurement of activation-to-
presentation latency. Native touch hardware, full supported-browser journeys,
100-cycle stability and all 100 latency bounds remain phase 6 acceptance work.
Subsequent controls and duplicate-listener/chain isolation are covered by the
injected-clock automated tests; headless fixtures do not certify real touch.

Constitution I–V reviewed: specified immediate retry semantics, focused helpers
within existing modules, failing-then-passing core tests plus browser evidence,
zero dependencies, and explicit task/function/test traceability. No Vibe code
or assets accessed or changed. T019–T022 complete; phase 6 remains unchecked.

## Phase 6 — Predictable behavior and native validation (2026-10-29)

Scope: T023–T029 on `sdd-development`, working-tree changes; Phase 7 excluded.
Requirements checklist: 16 checked, 0 unchecked, unchanged. Existing ignore rules
remain sufficient. No `.specify/extensions.yml` at pre/post checks; no hooks.
No packages, storage, production replay machinery or collision exemptions added.
No Vibe source/assets accessed. The historical Phase 1 tables above are setup
snapshots; this section is the current traceability and acceptance status.

### Completed implementation: T023–T025

**T023** — `tests/trajectory.js:traversalInput` supplies ordinary discrete flaps
based on the next opening. `scriptedFlight` records legal tick-indexed presses
and full states using production `restartRound`/`stepRound` and seeded obstacles,
then stops flapping and reaches a real loss. Production never imports it.
`tests/simulation.test.js` adds `FR-03 A-03 NFR-03: legal flaps traverse extreme
allowed gap transitions for 60 seconds`: 7200 ticks, 32 scored pairs, both global
gap endpoints 75 and 287 and both full ±60 transitions. The known random stream
selects allowed opening endpoints; it changes neither collisions nor physics.
`NFR-01 NFR-03: seeded performance trajectory survives 7200 normal ticks` also
preverifies the default seeded performance workload (32 points at tick 7200).
No tuning failure or config/plan/research change was necessary.

**T024** — `tests/browser.test.js` adds `NFR-03 NFR-05: equal-tick seeded replay
at 30/60/120/144 Hz, jitter, delay and pause exclusion`: every processed round
state is compared, including all bird fields, obstacle geometry/flags/IDs, RNG,
score and terminal tick. Jitter uses 4/29/7/13/22 ms intervals; delayed visible
callbacks use 16/800/1/1/16 ms, exercising the 30-step cap with retained backlog.
An inactive callback across ten minutes away, reset origin and explicit resume
exclude away time; future scripted presses are reinstated after inactive input
clearing. Existing blur/visibility tests cover input guards/restoration orders.
`FR-04 FR-06 NFR-03 NFR-05: 100 complete mounted scoring/loss/retry cycles retain
one listener set and chain` uses production mount, controls, loop and simulation
with tiny event/clock fakes. It compares each tick, alternates both retry controls,
checks full fresh reset, HUD, stable listener count and one pending callback,
then checks complete disposal. Each flight scores 6 and loses at tick 1664.
These verify existing gameplay; no missing gameplay behavior or contrived red
failure was found. Initial additions passed 122 tests; the additional seeded
performance preverification and stronger inactive-callback check pass 123.

**T025** — `tests/browser/index.html` and `validation.js` provide native DOM/HUD/
Canvas using production `mountGame`, `createLoop`, `render`, `stepRound` and
normal seeded gameplay. Run the buttons at `/tests/browser/` over HTTP.
The fixtures/100-cycle mode compares every tick, checks scoring/boundaries/
swept crossing, records all terminal obstacles, scores, RNG and activation marks,
and tests one scheduled chain through disposal. Synthetic distinct keyboard
presses and native `.click()` are controlled browser fixtures, not proof of
human input or hardware touch. Two callbacks leave each complete reset stable
for external capture; `callbackProxyMs` is explicitly diagnostic and every
`presentedResetMs` remains null. Download report exports JSON.
The 60-second mode runs legal controls and the production renderer, records
all frame intervals and elapsed time, updates equivalent HUD/status, and fails
if focus/visibility is lost or a collision occurs. It stops its chain on exit.
`game.js` auto-initialization now checks for a game canvas so importing its
helpers on a harness page with template-contained markup creates no extra game.
The normal production page still mounts automatically. No harness imports occur
in production modules and no global production cheats were introduced.

### Browser environment and evidence: T026–T028 remain incomplete

Verified actual hardware: MacBook Air `MacBookAir10,1`, Apple M1 (8 CPU cores,
7 GPU cores), 8 GB memory; macOS 26.3.1 build 25D2128. `system_profiler` did not
report display resolution/refresh rate. `pmset -g batt` reported AC Power but
battery discharging, so sustained mains operation is unverified. No physical
desktop touchscreen is available to this session. No physical-display 60 Hz
baseline is asserted. Browser viewport 1100×1100 CSS px, scale 1; harness game
extends below that viewport. These headless smoke runs differ from the proposed
full-interface visible desktop baseline. Other user workload is not controlled.
Chrome and Edge runs used focus emulation and native Canvas; headless callback
cadence does not establish physical display presentation or human stutter review.

Reproducible CDP runner: [harness-smoke.mjs](evidence/phase6/harness-smoke.mjs).
It uses Node's native WebSocket/fetch and requires the existing local HTTP :8000
server and isolated browser debug endpoint. Run with port and `cycles`, `performance` or `journeys` (reuses the Phase 3 native-input driver). It saves JSON and a screenshot, captures runtime exceptions and
fails on harness errors. Local sockets and browser launch needed sandbox approval.

| Browser | Actual version / availability | This phase evidence | Acceptance gaps |
|---|---|---|---|
| Chrome | 156.0.8078.48, headless | [100 cycles](evidence/phase6/9222-cycles.json), [screenshot](evidence/phase6/9222-cycles.png); [60-second report](evidence/phase6/9222-performance.json), [screenshot](evidence/phase6/9222-performance.png) | Full physical desktop journeys, display baseline, real touch, presented reset latency |
| Edge | 156.0.4314.50, headless | [100 cycles](evidence/phase6/9223-cycles.json), [screenshot](evidence/phase6/9223-cycles.png); [60-second report](evidence/phase6/9223-performance.json), [screenshot](evidence/phase6/9223-performance.png) | Full physical desktop journeys, display baseline, real touch, presented reset latency |
| Safari | 26.3.1 (21623.2.7.11.7) installed | `safaridriver` starts; session creation fails: “You must enable 'Allow remote automation' in the Developer section of Safari Settings to control Safari via WebDriver.” | No Safari journeys, cycles or performance run; user browser settings were not changed |
| Firefox | Not installed in `/Applications`; no available driver/session | No execution | All Firefox checks incomplete |

Both Chrome and Edge: 100/100 matching flights, score 6, terminal tick 1664,
terminal RNG state 1187970029; every intermediate state compared to the same
script. Reports retain per-cycle terminal obstacles/flags and activation times.
Both reports show zero harness errors and zero captured runtime exceptions.
Scoring fixtures 0/1/10, fatal ceiling/ground with collision priority and a swept
crossing pass. Native listener-count isolation is established by the unit test;
the browser harness independently checks its scheduled chain and outcomes.
The existing Phase 3–5 Chrome journeys remain incremental evidence, not full
four-browser acceptance. No result here establishes both physical restoration
orders, real desktop touch or complete manual art/input acceptance in Edge.

**T027 latency remains incomplete**: all 100 diagnostic callback delays are
stored per browser but no activation-correlated first-presented reset image was
measured. Final screenshots do not supply 100 presentation timestamps. No
≤100 ms latency claim follows from these results. Obtain trace/screen-capture
presentation evidence at known resolution for each activation in every browser;
refine any uncertainty crossing 100 ms. Safari/Firefox cycles also remain missing.

Chrome preliminary rendering sample: 60,014.1 ms, 3,602 callbacks (3,601
intervals), average **60.0026 FPS**, maximum interval **21.9 ms**, 7,201 normal
simulation ticks, 32 points, still playing, zero runtime errors. All intervals
are in the JSON report. Screenshot visually inspected: production bird, pipes,
score 32 and Flying status render correctly. Edge startup occurred during this
sample; it is a diagnostic sample, not a controlled baseline acceptance run.
Display-link diagnostics from headless browsers further prevent a physical
smoothness conclusion. Follow-up: repeat on an observed physical display with
known refresh rate and idle workload; record human stutter observation and
investigate long intervals. No numerical pass threshold has been invented.

Edge rendering sample: 60,014.2 ms, 3,602 callbacks (3,601 intervals), average
**60.0025 FPS**, maximum interval **20.2 ms**, 7,201 normal ticks, 32 points,
still playing, zero runtime errors. This ran after Chrome measurement finished;
no concurrent browser measurements. The full interval list is retained in the
Edge JSON. Both headless samples approach the 60 FPS target without establishing
physical-display smoothness or visible four-browser acceptance.

Edge native-input rerun: [journey results](evidence/phase6/9223-journeys.txt)
using `node evidence/phase6/harness-smoke.mjs 9223 journeys` from this feature
directory. Passed Space, ArrowUp, native mouse, emulated touch, Start button and
native Tab/Enter starts/resumes; dispatched blur pauses, return stays paused,
explicit resume does not catch up; repeated keys prevent scrolling and do not
flap; native focus outline; natural ground loss/retry visibility; post-loss keys
ignored; decorative pixels animate. Narrow 360×900 layout has no horizontal
overflow and preserves 2:3 canvas scaling. [Ready](evidence/phase6/9223-ready.png),
[loss](evidence/phase6/9223-loss.png), [narrow](evidence/phase6/9223-narrow.png)
screenshots retained; narrow image visually inspected. Zero runtime exceptions.
This expands Edge smoke evidence but uses emulated touch and dispatched lifecycle
events; it does not close physical device, physical focus restoration or full
four-browser acceptance. No application fix was required by these runs.

### T029 — Current requirement/function/evidence mapping

Every requirement is mapped below; a mapping does not turn missing browser
acceptance into a pass. Test references are requirement-labelled names in the
listed suite; detailed names and prior browser evidence appear in task sections
above. Latest `npm test`: **123 passed, 0 failed**, no skipped/cancelled/todo,
[unit transcript](evidence/phase6/unit-tests.txt), Node v22.15.0. Unit tests have no sleeps or DOM-emulation dependencies.

| Requirement | Tasks | Actual implementation | Verification and remaining evidence |
|---|---|---|---|
| FR-01 | T005–T007, T010, T013–T014, T019–T024 | `game.js:bindInput/mountGame`, `simulation.js:startOrFlap/restartRound/stepRound` | Browser suite start/resume method, repeat/FIFO and retry tests; Phase 3/5 Chrome input smoke; T026 full browser/touch incomplete |
| FR-02 | T003–T007, T010, T013, T024 | `config.js:CONFIG/createConfig`, `simulation.js:stepRound`, `game.js:createLoop` | Simulation gravity/apex/frozen-state tests; browser cadence replay; T026 browser matrix incomplete |
| FR-03 | T003, T005, T008, T023–T025 | `simulation.js:spawnPair/nextObstacleRandom/stepRound`, `config.js:CONFIG` | Simulation seed/spawn/retirement tests and extreme/seeded traversal; both browser 100-cycle reports |
| FR-04 | T019–T022, T024–T027 | `simulation.js:restartRound`, `game.js:mountGame/restart` | Four-state reset and both-control unit tests, 100 mounted cycles, Phase 5 Chrome and both harness reports; presentation limit incomplete |
| FR-05 | T005, T009, T012, T015, T025–T026 | `simulation.js:firstCollisionTime/sweptContactTime/stepRound`, `renderer.js:drawBird/drawPipe` | Simulation inclusive/overlap/zero-velocity/swept tests; renderer bounds tests; harness boundary/crossing fixtures; full browser journeys incomplete |
| FR-06 | T015–T018, T024–T025 | `simulation.js:stepRound`, `game.js:updateView`, `renderer.js:render` | Strict/equality/once-only/retirement/collision-priority simulation tests; 0/1/10 legal trajectories and HUD tests; Phase 4 Chrome and both harness fixtures |
| FR-07 | T004–T007, T011–T013, T016, T019–T022 | `simulation.js:createRound/startOrFlap/pauseRound/restartRound/stepRound`, `game.js:updateView`, `renderer.js:drawOverlay` | Lifecycle/frozen final score/composition/reset suites; Phase 3/5 Chrome; full four-browser acceptance incomplete |
| FR-08 | T006, T010–T014, T020–T022, T026 | `index.html`, `style.css`, `game.js:bindInput/updateView`, `renderer.js:render` | Input, renderer and composition suites; Phase 3 screenshots/native Tab/Enter; real touch/four-browser visual journeys incomplete |
| FR-09 | T011–T013, T016, T018, T025–T026 | `renderer.js:render/drawOverlay`, `game.js:updateView`, `index.html` | Renderer read-only/overlay/score tests; next-render HUD tests; Phase 3–6 screenshots; four-browser review incomplete |
| FR-10 | T004–T005, T009, T012, T025–T026 | `simulation.js:firstCollisionTime/stepRound`, `renderer.js:drawBird/drawPipe/drawGround` | Ceiling/contact/sweep/collision-priority simulation and artwork bounds tests; harness fatal-boundary fixtures |
| FR-11 | T005–T007, T010, T013–T014, T020–T024, T026 | `simulation.js:pauseRound/startOrFlap`, `game.js:bindInput/createLoop/mountGame` | Both restoration-order, guards/backlog/resume unit tests, ten-minute pause replay, Phase 3 Chrome dispatched focus smoke; physical browser restoration checks incomplete |
| NFR-01 | T025, T028 | `game.js:createLoop`, `renderer.js:render`, `validation.js:performanceFlight` | Seeded 7200-tick preverification; recorded headless rendering samples only; visible physical baseline and all-browser observations incomplete |
| NFR-02 | T020–T022, T025, T027 | `game.js:restart/updateView`, `simulation.js:restartRound` | Synchronous reset unit tests; 100 activation marks/browser, null presented timings; ≤100 ms acceptance incomplete |
| NFR-03 | T005–T006, T008–T010, T012, T019–T025, T027 | Round-owned RNG, `stepRound`, `createLoop`, `restartRound`, read-only `render` | All cadence replays, 100 full mounted cycles with stable listener/chain counts; 100 native Chrome/Edge cycles; Safari/Firefox cycles incomplete |
| NFR-04 | T001–T003, T029, T031 | Four production JS modules, named `CONFIG`, independent validation files | Focused phase reviews above, zero dependencies/shared collision rules; Phase 7 source review recorded below; T031 closed under the user-directed acceptance scope adjustment below |
| NFR-05 | T002, T005–T006, T015–T016, T019–T020, T023–T029 | `tests/*.test.js`, native harness and this log | 123 passing requirement-labelled tests, evidence JSON/screenshots and this mapping; missing acceptance explicitly tracked |
| NFR-06 | T014, T018, T022, T026–T028 | Native HTML/CSS/JS/Canvas, `bindInput`, `mountGame` | Exact browser versions above; Chrome/Edge headless subsets; Safari/Firefox/real-touch/full-desktop acceptance incomplete |
| SC-01 | T014, T022, T026 | `mountGame/bindInput/updateView` and simulation lifecycle | Unit journeys and Chrome smoke; every supported browser journey incomplete |
| SC-02 | T015–T018, T025–T026 | `stepRound` scoring and HUD/renderer | 0/1/10 legal simulation and HUD tests; Phase 4 Chrome native fixtures; Phase 6 Chrome/Edge fixtures; other browsers missing |
| SC-03 | T025, T028 | `createLoop/render`, `performanceFlight` | Headless samples recorded; four visible-browser baseline records incomplete |
| SC-04 | T020–T022, T025, T027 | `restartRound`, mounted `restart/updateView` | Reset semantics pass; all 100 presented-image measurements remain incomplete |
| SC-05 | T024–T025, T027 | `stepRound/createLoop/restartRound`, input binding | 100 mounted unit cycles and 100 native cycles in Chrome/Edge match at every tick; Safari/Firefox incomplete |
| SC-06 | T029, T031 | Production modules, suites, harness and this log | Complete traceability and passing core suite; Phase 7 source review recorded below; required browser/device/measurement evidence remains incomplete |

Constitution I–V phase review: specification-derived checks; small validation-only
controller and focused native harness; production physics/renderer used without
bypasses; dependency-free tests and CDP; explicit requirement/task/function/evidence
links. Final project review is still T031. T023, T024, T025 and T029 are complete;
T026, T027 and T028 stay unchecked until the stated missing evidence is obtained.


## Phase 7 — Documentation and final source review (2026-10-29)

Scope: T030 and T031 on `sdd-development`, base commit
`a6668133a407e0a31f3d9f595abb697ae214df48`; results describe the working tree.
The requirements checklist remains 16 checked / 0 unchecked (PASS), with no
marker changes. `.specify/extensions.yml` is absent, so there are no pre/post
implementation hooks. Existing ignore patterns cover the native Node/static
project; the package is private and needs no publishing ignore file.

### T030 — Complete

Updated root `README.md` with actual Node 22/Python 3 prerequisites, no dependency
installation/build step, `npm test`, the static-server command, game/harness URLs,
all desktop controls, native Tab/Enter, preserved pause/resume, immediate retry,
current-round-only scores, and relative quickstart/validation/specification links.
Removed the obsolete “implementation has not started” statement. Also corrected
quickstart's introductory planning-only status and test-command wording to match
the implemented files. Browser acceptance gaps are explicit in both documents.
This addresses FR-01, FR-04, FR-11, NFR-04 and NFR-05; gameplay is unchanged.

### T031 — Complete under user-directed scope adjustment

Reviewed `index.html`, `style.css`, `config.js`, `simulation.js`, `renderer.js`,
`game.js`, `tests/*.test.js`, `tests/trajectory.js` and `tests/browser/` against the
specification, plan, model, browser contract and constitution 1.0.0.

| Principle | Review findings and verification | Status |
|---|---|---|
| I. Specification-guided implementation | Existing modules implement the agreed current-round score, desktop controls, fatal boundaries, preserved resume and fresh retry. Documentation now describes those behaviors. No intended behavior or tuning changed. Prior T001 ownership/provenance record and phase implementation records support independent authorship; this review opened no Vibe source/assets or other checkout and cannot independently prove historical authorship. | Source/documentation review passes |
| II. Readable and maintainable code | `CONFIG/createConfig` names and freezes gameplay tuning; `stepRound` owns integration/collision/scoring, `bindInput` owns inputs, `createLoop` owns time, `mountGame` composes the view, and `render` only draws. `firstCollisionTime/sweptContactTime` provides the single gameplay collision rule, with renderer bounds derived from the same bird/pair/config geometry. Formatting and function responsibilities are consistent; decorative coordinates stay in renderer functions. | Source review passes |
| III. Tested core functionality | Simulation, browser-adapter and renderer suites cover start/flap, generation, contacts, scoring, pause, reset and read-only artwork. Requirement-labelled replay and 100-cycle tests cover determinism and stable listeners/chain. All 123 tests pass. Prior Chrome/Edge evidence is retained; full supported-browser/device and presented-frame checks remain missing. No confirmed code defect required a regression test or browser rerun in this documentation change. | Automated checks pass; browser acceptance incomplete |
| IV. Minimal dependencies | Private ES-module package has no dependencies, build tooling or storage. Imports are local production/test modules and Node built-ins. No production network requests, external assets, persistence or unused package dependencies were found; the native harness stays outside production imports. | Pass |
| V. End-to-end traceability | T029 maps every FR/NFR/SC to tasks, actual functions and tests/browser records. T030 is linked here to README/quickstart; T031 records final source findings and the remaining evidence rather than implying acceptance. | Mapping passes; final acceptance incomplete |

Verification: Node `v22.15.0`, Python `3.13.3`. `npm test` passed **123 tests,
0 failures, 0 skipped/cancelled/todo**; retained [full transcript](evidence/phase7/unit-tests.txt).
README/quickstart local Markdown targets resolve, documented application/harness
paths exist, and `git diff --check` passes. No runtime source or test logic changed;
existing browser results have not been promoted to new browser executions.

### User-directed acceptance scope adjustment (2026-10-29)

After reviewing the outstanding browser journeys, real desktop touchscreen checks,
100-cycle presented reset-image measurements and visible performance runs, the
user explicitly instructed: “lets skip those tests”. This supersedes the prior
T031 closure dependency on the remaining T026–T028 checks for this delivery.
T030 and T031 are complete, and Phase 7 is closed. T026–T028 are marked SKIPPED
in tasks.md with unchecked markers; they are not passing test results.

The original specification's browser/device, ≤100 ms presented reset and visible
performance acceptance claims remain unverified wherever evidence is missing.
Existing headless Chrome/Edge reports and callback timings retain their stated
limits. The source review, traceability and 123 passing automated tests above
remain the basis for this delivery. No runtime code or test logic changed, and
no additional browser/device/performance tests were run for this scope adjustment.
Earlier pending-closure statements in this log describe the status before this
explicit user instruction and are superseded by this entry.
