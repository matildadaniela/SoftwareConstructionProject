# Quickstart and Validation Guide

This is the intended validation procedure after implementation; `sdd/`, its `package.json` and tests are planned artifacts and do not exist merely because this guide describes them.

## Prerequisites and setup

Use Node.js 22 (workspace version 22.15.0), Python 3, a keyboard and desktop stable Chrome, Firefox, Edge and Safari. No package installation or build step is planned. Resolve D-01–D-03 in [scope-comparison.md](scope-comparison.md) before accepting affected behavior. Run from the repository root:

```sh
node --version
python3 --version
npm --prefix sdd test
python3 -m http.server 8000 --bind 127.0.0.1
```

The proposed `npm --prefix sdd test` script runs `node --test tests/*.test.js`. Expect no failed tests and names containing requirement IDs. Open `http://127.0.0.1:8000/sdd/` for the SDD game and `http://127.0.0.1:8000/sdd/tests/browser/` for browser validation. Serve modules over HTTP rather than opening file URLs.

## Automated functionality checks

Run the complete unit suite. It must verify start plus first flap, held/repeat suppression, gravity and frozen inactive states, seeded obstacle generation/movement/removal, all collision boundaries and swept crossings, collision precedence, strict once-only scoring, nonfatal ceiling, reset from every state, focus/visibility pause and explicit resume, accumulator behavior, equal-tick replay across cadences and 100 complete lifecycle cycles. Confirm tests exercise the production modules and no real sleeps. Consult the mapping in [plan.md](plan.md) and lifecycle in [data-model.md](data-model.md).

## Supported-browser journeys

For each installed stable browser, record version and baseline in feature-local `validation.md` and check:

1. Open the game: title/icon above, stationary ready bird, zero score, start instruction and restart below. Resize viewport; geometry and gameplay remain unchanged.
2. Press Space once: start with one flap; hold Space: no repeating flaps or scrolling. Release and press again: one new flap. Stop input: gravity produces descent and eventual ground loss.
3. Use known harness fixtures to hit each pipe edge/opening edge and ground. Confirm loss freezes progress, displays final score and restart instruction. Space after loss cannot restart. Top contact clamps and allows descent without loss.
4. Use deterministic valid trajectories to clear exactly 0, 1 and 10 pairs. Check strict clearance, no score at equality, no duplicate points, and no score on a collision tick. Score is visible by next frame.
5. During active play switch tabs and return, then separately move focus away and back: preserve state and show paused message. Wait, then use a fresh Space press to resume with one flap and no catch-up. Exercise both orders of focus/visibility restoration and restart while paused.
6. Restart using pointer and Tab/Enter; test repeatedly from ready, playing, paused and game-over. Full ready view, zero score, initial position, empty obstacles and no stale input must return. When Restart is focused, Space must control gameplay without clicking it; Enter must still reset.
7. Complete ready → playing → game-over → restart → ready → playing; record results and any console errors. Capture screenshot evidence of each state and responsive layout where useful.

Use [contracts/browser-game.md](contracts/browser-game.md) for expected UI behavior. Rendering, focus handling and native button activation must be checked in real browsers, not inferred from unit tests.

## Determinism and 100-cycle validation

Run the browser harness with fixed seed and tick-indexed controls, allowing real collisions and restarting only after game-over. Repeat 100 start/play/end/restart cycles, comparing terminal tick, obstacle sequence, score and collision outcomes to the first cycle. Include a scoring trajectory so duplicate points and stale pair flags are observable. Record zero unexpected errors, listener/loop duplication and stale state. Unit fake-clock runs additionally compare 30/60/120/144 Hz, jitter and visible delayed callbacks at equal ticks.

For every restart record activation time and the first fully reset displayed frame. Mark and verify score, bird position, obstacles and ready overlay together. A requestAnimationFrame callback occurs before paint and is insufficient alone as proof of visible latency: use browser performance/screenshot or screen-capture frame evidence to identify the first presented reset image; correlate timestamps with the activation mark. A second animation callback is only a diagnostic proxy. Record measurement resolution; any result whose uncertainty crosses 100 ms needs a more precise measurement. All 100 activations must be at most 100 ms (NFR-02/SC-04).

## Performance validation

Use the selected Apple Silicon/macOS 26.3.1/60 Hz representative baseline from [plan.md](plan.md); record exact chip/model, memory, viewport, display rate, browser version and power/workload conditions before testing. Keep the page visible and focused.

In each browser run a 60-second collision-free trajectory in the harness using the production renderer, normal rules, same DOM/HUD and deterministic valid inputs. A preverified trajectory may select a fixed legal obstacle stream and scripted flaps; no collision bypass or reduced rendering is allowed. Count rendered callbacks over elapsed visible time to obtain average FPS; record frame intervals and noticeable stuttering. Compare with the 60 FPS target. Investigate stuttering and record cause/action; a lower numerical average alone is not failure. Restart latency remains a mandatory bound.

## Evidence and acceptance

Create `validation.md` during implementation with date, commit, hardware/OS/display/viewport, exact browser versions, unit command/results, per-browser journey results, FPS duration/count/average and stutter investigation, 100-cycle outcome comparisons, all 100 reset measurements and their visible-frame evidence/resolution, defects and rerun references. Include requirement-to-test names and implementation-file/function references, with task IDs once tasks exist. Missing browsers or measurement tools mean incomplete validation, never an assumed pass. No results have been executed as part of this planning workflow.

## Independent development and scope review

Confirm root Vibe `index.html`, `style.css`, and `game.js` remain unchanged. Review new SDD source and tests for requirement traceability and independent authorship; sharing a browser API or a numeric constant is not evidence of copied code. Open `/` to check Vibe remains runnable and `/sdd/` for the new game. Record D-01–D-03 decisions and any resulting specification amendments. If saved scores or extra controls are approved, add their acceptance checks, including persistence across reload, restart retention and blocked-storage fallback where specified. Current-round scoring checks do not establish high-score correctness.
