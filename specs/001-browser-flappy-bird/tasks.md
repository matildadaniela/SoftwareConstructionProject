# Tasks: Browser Flappy Bird

**Input**: `specs/001-browser-flappy-bird/` — spec.md, plan.md, research.md, data-model.md, contracts/browser-game.md and quickstart.md; constitution v1.0.0.
**Tests**: Automated testing and browser verification explicitly requested. Phase 1 setup (T001–T002) is complete; see [validation.md](validation.md) for setup evidence. Phase 2 (T003–T004) is also complete with construction tests; later tasks and gameplay/browser verification remain pending.
**Organization**: Four user-story increments, ordered P1, P2, P2, P3. Paths are relative to the repository root.

## Format and scope

Each task uses `- [ ] Tnnn [P?] [USn?] Description with file paths`. `[P]` identifies independent files that can be worked on concurrently after the stated prerequisites. Story labels appear only in story phases.

Keep HTML/CSS/native JavaScript, four small JavaScript modules, Node built-in tests and a native browser harness. No frameworks, packages, bundler, backend, persistence, adapter classes or reusable game engine. Author all SDD code and artwork independently from the specification. Continue on `sdd-development`. Do not copy, extract, move or overwrite Vibe code/assets. If planned root application paths become occupied, clarify ownership before replacing them.

Write each story's automated tests before its implementation, confirm relevant assertions fail for missing behavior, then make them pass. Use requirement IDs in test names. Upon completion, record task ID, actual files/functions and test names or browser evidence in `specs/001-browser-flappy-bird/validation.md`. No real sleeps or DOM-emulation dependencies in unit tests.

## Phase 1: Setup (shared infrastructure)

**Purpose**: Establish the minimal development and verification environment.

- [X] T001 Check ownership of proposed root paths against `specs/001-browser-flappy-bird/plan.md`, verify Node 22 and Python 3 availability, and initialize `specs/001-browser-flappy-bird/validation.md` with pending requirement/task/evidence mappings, actual environment details and source-provenance review notes (NFR-04–NFR-06).
- [X] T002 Create private ES-module `package.json` with no dependencies and test script `node --test tests/*.test.js`; establish `tests/simulation.test.js`, `tests/browser.test.js` and `tests/browser/index.html` paths without adding a build step (NFR-04, NFR-05).

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: Shared configuration and testable state; complete before story implementation.

- [X] T003 Add named constants and construction validation in `config.js`: 400×600 world, ground 526, step 1/120 s, bird (90,248,34,28), gravity 1512, flap -450, pipe width 64, gap 164, speed 156, spawn 210 ticks, gap range 75..287, max change 60 and seed 0x1A2B3C4D. Preserve data-model constraints verbatim: "Immutable named values; positive sizes/speed, gap larger than bird height, valid opening within ground; shared by simulation/rendering/tests" (FR-02, FR-03, NFR-04).
- [X] T004 Add constructor/configuration assertions in `tests/simulation.test.js`, then implement plain fresh-round creation in `simulation.js`, including independent collections and round-owned RNG. Preserve constraints: "phase is ready/playing/paused/game-over; tick and score nonnegative integers; owns one bird and zero or more pairs; only playing advances tick; ready has zero score/tick and empty pairs"; bird "x remains fixed; top-left origin; full unrotated rectangle defines contact; y >= 0; ceiling or ground contact causes loss". Define how fatal proposed positions resolve without leaving an invalid stored bird position (FR-02, FR-07, FR-10, NFR-03).

**Checkpoint**: Configuration validation and fresh-state tests pass. No gameplay layers beyond the planned modules are needed.

## Phase 3: User Story 1 — Start and play a round (P1, MVP)

**Goal**: Playable hazards, controls, pause/resume and visibly distinct lifecycle states.
**Independent test**: Load ready with stationary bird/zero score; start separately by every supported method; flap then fall; encounter each hazard; blur/hide and explicitly resume preserved progress. Observe frozen game-over and required interface. Scoring and immediate retry are later increments.

### Automated tests

- [X] T005 [P] [US1] Add requirement-labelled tests in `tests/simulation.test.js` for start with one flap, gravity/apex/descent, frozen inactive states, seeded bounded/reachable openings, first and recurring spawn ticks, constant movement/spacing, retirement, exact contact/overlap/swept crossings of pipes/ceiling/ground, initial overlap and zero relative velocity, one terminal transition and legal pause/resume preservation (FR-01–FR-03, FR-05, FR-07, FR-10, FR-11).
- [X] T006 [P] [US1] Add contract/input/loop tests in `tests/browser.test.js` using small event-target and injected-clock/scheduler fakes: all starts and resumes yield one flap; per-key hold/repeat suppression; FIFO tick queue, including two distinct inputs before one tick with both consumed in FIFO order, no accumulated impulse and no delayed flap; pointer compatibility/button deduplication; gameplay defaults prevented while Tab/Enter work; focus-and-visibility guards; both restoration orders; pause clears backlog/input; 30-step callback cap retains visible backlog; one animation chain; disposal removes listeners (FR-01, FR-02, FR-07, FR-08, FR-11, NFR-03; contracts/browser-game.md).

### Implementation

- [X] T007 [US1] Implement start/flap, fixed-step movement and legal pause/resume transitions in `simulation.js`; consume all queued inputs for the tick in FIFO order before semi-implicit Euler movement, setting flap velocity for each without accumulating impulse or carrying inputs into later ticks, advance active ticks only during play, preserve world/RNG on pause, and ignore gameplay keys after game over (FR-01, FR-02, FR-07, FR-11).
- [X] T008 [US1] Implement round-seeded obstacle generation/movement/retirement in `simulation.js`: unsigned xorshift32 shifts 13/17/5 divided by 2^32, injectable known streams, first spawn tick 210 at x=400, recurring interval 210, gap intersection with previous ±60 initialized from clamped bird-centered opening. Preserve pair constraints: "Unique within round; top rectangle spans y=0..gapTop, bottom spans gapTop+gapHeight..526; inclusive edges; scored may change false→true once; remove after right edge <0". Keep cosmetic randomness separate (FR-03, NFR-03).
- [X] T009 [US1] Implement inclusive swept relative-displacement AABB checks in `simulation.js` for both moving pipe rectangles, ceiling and ground, including initial overlap and zero velocity; integrate proposed movement/spawn/movement before collision, terminate once before any scoring, discard remaining collision-step time and stop subsequent backlog steps after loss (FR-05, FR-10).
- [X] T010 [US1] Implement exported input and loop helpers plus guarded browser initialization in `game.js` so Node imports need no DOM. Preserve InputState rules: "Each queue item targets an unprocessed simulation tick, FIFO within tick; all inputs for a tick consumed before integration, each setting flap velocity without accumulated impulse or carryover; repeats ignored; blur, hidden and restart clear held flag and queue; Space/ArrowUp and pointer input require visible/focused page; one action per click/tap, no compatibility duplicates". Preserve LoopState rules: "Infrastructure, outside round; monotonic clock; null timestamp on reset/resume; paused/inactive time is never accumulated; one scheduled chain". Use 1/120 s steps, at most 30 per callback with retained backlog, render afterward, clear input/backlog on blur/hidden, and resume with a fresh clock origin (FR-01, FR-02, FR-07, FR-08, FR-11, NFR-03).
- [ ] T011 [P] [US1] Create semantic `index.html` and responsive `style.css` with title and independently drawn icon above the 400×600 logical canvas, readable score/status/instructions, below-game native Start/Resume/Restart button, accessible on-screen retry control and visible keyboard focus; preserve logical coordinates under CSS scaling (FR-07–FR-09).
- [ ] T012 [P] [US1] Implement read-only `renderer.js` with independent vintage arcade bird, pipes, ground, strong colors, decorative animation and distinct ready/paused/game-over overlays; keep all hazard/artwork bounds aligned and no gameplay mutation or obstacle-PRNG use. Preserve View constraints: "Derived from round only, no independent gameplay truth; score and state update no later than next render; restart enters playing with one flap and draws immediately"; complete restart integration in US3 (FR-05, FR-07–FR-10, NFR-03).
- [ ] T013 [US1] Compose production simulation, input, loop, renderer, HUD/status and state-specific controls in `game.js`; make start/resume visible with one initiating flap, pause visibly on blur/hidden, leave restoration paused, freeze gameplay after loss and retain final score; pass T005/T006 before marking complete (FR-01–FR-03, FR-05, FR-07–FR-11).
- [ ] T014 [US1] Serve via `python3 -m http.server 8000 --bind 127.0.0.1`, perform US1 browser smoke checks for each start/resume method, repeat/scroll prevention, native Tab/Enter, layout/art/animation, collision overlays and no catch-up, and record actual browser/device, outcomes and console errors in `specs/001-browser-flappy-bird/validation.md`; full four-browser and real-touch acceptance follows in US4 (FR-01–FR-03, FR-05, FR-07–FR-11).

**Checkpoint**: Core playable MVP and its automated tests pass; browser smoke evidence is recorded.

## Phase 4: User Story 2 — Track progress fairly (P2)

**Goal**: Accurate once-only current-round score with collision precedence.
**Independent test**: Known fixtures clear two pairs with scores 0→1→2; equality gives zero; a collision elsewhere in the same step suppresses every potential point. Verify controlled 0/1/10-pair runs.

### Automated tests

- [ ] T015 [P] [US2] Extend `tests/simulation.test.js` for equality and either side of the pass boundary, upper/lower pair counting once, repeated steps, multiple pairs, retired hazards and collision with one pair while another could score; verify 0/1/10-pair outcomes and nonnegative integer score (FR-05, FR-06, SC-02).
- [ ] T016 [P] [US2] Extend `tests/browser.test.js` with fake-render/HUD contract checks for score update by the next render, final score preservation and render operations leaving simulation/obstacle RNG unchanged (FR-06–FR-09, NFR-03).

### Implementation and verification

- [ ] T017 [US2] Implement scoring in `simulation.js` only after all hazards are checked: strict bird.left > pair.right, one point per unscored pair, no points anywhere in a fatal tick, and retirement after scoring. Keep score in memory only (FR-05, FR-06).
- [ ] T018 [US2] Connect current/final score to `game.js` HUD and `renderer.js` without a second source of truth, pass T015/T016, and record browser observations for controlled 0/1/10 scores and collision precedence in `specs/001-browser-flappy-bird/validation.md` (FR-06, FR-07, FR-09, SC-02).

**Checkpoint**: Scoring is independently verified using known fixtures and visible output.

## Phase 5: User Story 3 — Restart and play again (P2)

**Goal**: Both retry actions immediately start one clean playing round from any lifecycle state.
**Independent test**: Start at game over with nonzero score; separately activate Restart game and Tap to try again. Observe reset score/bird/obstacles/message, playing state and one initiating flap; verify fresh inputs and rapid restarts without extra loops.

### Automated tests

- [ ] T019 [P] [US3] Extend `tests/simulation.test.js` for fresh-round restart from ready/playing/paused/game-over, restoring initial seed, IDs, spawn schedule, prior gap and initial bird motion, clearing score/obstacles/ticks, then immediate initiating flap velocity at the starting position with zero elapsed ticks, no queued duplicate initiating flap and normal subsequent controls (FR-01, FR-04, FR-07, NFR-03).
- [ ] T020 [P] [US3] Extend `tests/browser.test.js` for each retry action including pointer and native button activation, rapid restart, stale held/pointer/queued-input/backlog clearing, synchronous complete reset render in activation handler with starting position, applied flap velocity, zero elapsed ticks and no queued duplicate initiating flap, and constant listener/animation-chain counts (FR-01, FR-04, FR-08, NFR-02, NFR-03; contracts/browser-game.md). Treat these as logic checks, not proof of visible paint latency.

### Implementation and verification

- [ ] T021 [US3] Implement one fresh-round restart action in `game.js` using `simulation.js`, shared by below-game restart and accessible on-screen retry; replace round/RNG, clear input/timing, enter playing and immediately apply initiating flap velocity without advancing position or simulation time or queuing it again, synchronously draw all reset content and retain one listener set/animation chain. Keep pause resume separate and preserve its progress (FR-01, FR-04, FR-07, FR-08, FR-11, NFR-02).
- [ ] T022 [US3] Pass T019/T020 and record browser smoke checks for both retry controls, restart from every state, rapid activation, subsequent controls and native Tab/Enter in `specs/001-browser-flappy-bird/validation.md`; capture preliminary reset-visible-frame evidence without claiming the final 100-cycle latency acceptance (FR-04, FR-08, NFR-02, NFR-03).

**Checkpoint**: Immediate retry works and reset isolation is covered by automated tests.

## Phase 6: User Story 4 — Verify predictable behavior (P3)

**Goal**: Repeatable outcomes and recorded automated/browser acceptance with traceable evidence.
**Independent test**: Run all tests; compare equal-tick replays and 100 complete cycles; review requirement-to-function-to-test links and supported-browser evidence.

### Automated tests

- [ ] T023 [P] [US4] Add deterministic scripted traversal to `tests/simulation.test.js` through extreme allowed gap transitions, using legal flaps and normal collision/scoring, and assert reachable openings against the implemented simulation before browser acceptance. If provisional tuning fails, adjust `config.js` and synchronize tuning/tests with `specs/001-browser-flappy-bird/plan.md` and `specs/001-browser-flappy-bird/research.md` together; do not relax collisions or specified rules (FR-03, A-03, NFR-03).
- [ ] T024 [P] [US4] Add equal-tick replay tests to `tests/browser.test.js` at 30/60/120/144 Hz, jitter and delayed visible callbacks, with fixed seed and tick-indexed input; compare bird motion, obstacle sequence, collision tick and score, including backlog retention and pause-away exclusion. Run 100 complete start/play/end/restart cycles with real losses and scoring trajectories, asserting matching outcomes and no stale input/pair flags, duplicate points, loops or listeners (NFR-03, NFR-05).

### Browser harness and acceptance

- [ ] T025 [US4] Implement minimal native `tests/browser/index.html` and `tests/browser/validation.js` importing production modules with equivalent DOM/HUD/rendering, known fixtures and tick-indexed controls. Report assertions, errors, cycle/outcome comparisons, rendered FPS/frame intervals and restart activation marks; provide valid collision-free 60-second trajectory and 100-cycle scoring/loss/retry mode. Keep harness out of production imports and add no collision bypass, global production cheats or generalized replay framework (FR-01–FR-11, NFR-01–NFR-03, NFR-05).
- [ ] T026 [US4] Run `npm test` and all `specs/001-browser-flappy-bird/quickstart.md` functional journeys in desktop stable Chrome, Firefox, Edge and Safari; record actual versions, hardware/OS/display/viewport and per-browser outcomes in `specs/001-browser-flappy-bird/validation.md`. Include both focus restoration orders, all starts/resumes/retries, boundary fixtures, 0/1/10 scoring, Tab/Enter, responsive art/animation and actual desktop-touchscreen checks with device/browser evidence; report unavailable environments as incomplete (FR-01–FR-11, NFR-05, NFR-06, SC-01, SC-02).
- [ ] T027 [US4] Run the browser harness for 100 real start/play/end/restart cycles per supported browser and record matching terminal ticks, obstacle sequences, scores/collisions and zero unexpected errors/stale state/duplicate points in `specs/001-browser-flappy-bird/validation.md`. Measure all 100 restart activations against first presented complete-reset image using correlated activation timestamps and performance/screenshot or screen-capture evidence; record resolution and every result, require each ≤100 ms, and refine any uncertainty crossing the bound. An animation callback alone is insufficient paint evidence (NFR-02, NFR-03, SC-04, SC-05).
- [ ] T028 [US4] Measure a focused visible 60-second collision-free run in each supported browser using production rules/rendering and valid controls; record exact baseline, duration, rendered frame count, average FPS, intervals, workload and stutter observations/investigation/actions in `specs/001-browser-flappy-bird/validation.md`. Verify the proposed plan baseline before using it; report actual differences. Compare with 60 FPS as a target without inventing a numerical pass threshold (NFR-01, NFR-06, SC-03).
- [ ] T029 [US4] Complete requirement-to-task-to-implementation-function-to-unit/browser-evidence mappings in `specs/001-browser-flappy-bird/validation.md`, including all FR-01–FR-11, NFR-01–NFR-06 and SC-01–SC-06; record failures, fixes and reruns, and leave missing evidence explicitly incomplete (NFR-04, NFR-05, SC-06).

**Checkpoint**: Automated consistency and recorded browser evidence establish acceptance; missing browsers, real touch or measurements remain unfinished work.

## Phase 7: Polish and cross-cutting concerns

- [ ] T030 [P] Update `README.md` with dependency-free prerequisites, static-server and test commands, game/harness URLs, desktop controls, current-round-only scope and links to `specs/001-browser-flappy-bird/quickstart.md` and `specs/001-browser-flappy-bird/validation.md` (FR-01, FR-04, FR-11, NFR-04, NFR-05).
- [ ] T031 Review `index.html`, `style.css`, `config.js`, `simulation.js`, `renderer.js`, `game.js` and `tests/` for independent authorship, named constants, focused functions, consistent formatting, shared collision definitions and no unused dependencies/storage; record constitution I–V review in `specs/001-browser-flappy-bird/validation.md`. Fix confirmed defects with regression tests, rerun affected automated/browser checks, and close only when required evidence passes (NFR-04–NFR-06, SC-06).

## Dependencies and execution order

```text
Setup T001–T002 → Foundation T003–T004 → US1 T005–T014 (MVP)
                                          ↓
                                    US2 T015–T018
                                          ↓
                                    US3 T019–T022
                                          ↓
                                    US4 T023–T029
                                          ↓
                                    Polish T030–T031
```

US2 and US3 both require US1. US3's reset implementation can follow US1 without scoring, but its complete nonzero-score verification requires US2; sequential implementation is simplest because both touch the same modules/tests. US4 requires all three player stories for complete journeys. Each story can be tested independently once its prerequisites exist, without relying on later stories.

Within US1, finish tests T005/T006 before gameplay implementation; T007→T008→T009 establish simulation; T010 follows those seams. T011/T012 can run together after T010, then T013 integrates and T014 verifies. Within US2 and US3, write the paired tests first, implement, then perform browser checks. In US4, complete T023/T024 before T025 and browser measurements T026–T028; T029 consolidates evidence. Final review follows documentation and verification.

## Parallel execution examples per story

- **US1**: T005 (`tests/simulation.test.js`) alongside T006 (`tests/browser.test.js`); later T011 (`index.html`, `style.css`) alongside T012 (`renderer.js`) before integration.
- **US2**: T015 simulation boundary tests alongside T016 HUD/render contract tests; both precede T017/T018.
- **US3**: T019 fresh-round tests alongside T020 input/reset integration tests; both precede T021.
- **US4**: T023 simulation traversal tests alongside T024 fake-clock replay/cycle tests. Do not run measurements concurrently on the same baseline machine or concurrently edit the shared validation log.
- **Polish**: T030 documentation can proceed independently after story verification while preparing final review; T031 must review the final files and evidence.

Parallel opportunities describe optional scheduling, not a requirement to use multiple agents. Tasks sharing files remain sequential.

## Implementation strategy

1. Deliver Setup + Foundation + US1 as the playable MVP; verify the story checkpoint before expanding scope.
2. Add US2 fair scoring, then US3 immediate retry, with tests and browser smoke evidence at each increment.
3. Complete US4 deterministic traversal/replays, minimal native harness and recorded four-browser, real-touch, latency and performance acceptance.
4. Finish documentation and constitution/traceability review. Keep every unfinished check unchecked; no deployment is required by this task list.

The MVP checkpoint is not acceptance of the whole feature: scoring, immediate retry and complete cross-browser/measurement evidence remain required for full delivery.
