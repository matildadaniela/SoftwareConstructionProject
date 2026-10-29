# Quickstart and Validation Guide

The root-level game, `package.json`, automated tests and native browser harness are implemented. This guide describes how to run them and finish acceptance; consult [validation.md](validation.md) for executed results and incomplete checks.

## Prerequisites and setup

Use Node.js 22 (workspace version 22.15.0), Python 3, keyboard, mouse, a touch-capable desktop device and desktop stable Chrome, Firefox, Edge and Safari. No package installation or build step is needed. D-01–D-03 are resolved in [scope-comparison.md](scope-comparison.md); use the 2026-10-29 amended requirements. Run from the repository root:

```sh
node --version
python3 --version
npm test
python3 -m http.server 8000 --bind 127.0.0.1
```

The `npm test` script runs `node --test tests/*.test.js`. Expect no failed tests and names containing requirement IDs. Open `http://127.0.0.1:8000/` for the SDD game and `http://127.0.0.1:8000/tests/browser/` for browser validation. Serve modules over HTTP rather than opening file URLs.

## Automated functionality checks

Run the complete unit suite. It must verify all start/retry/resume methods plus one initiating flap, held/repeat suppression and pointer compatibility deduplication, gravity and frozen inactive states, seeded obstacle generation/movement/removal, all collision boundaries and swept crossings, collision precedence, strict once-only scoring, fatal ceiling, reset from every state, focus/visibility pause and explicit resume, accumulator behavior, equal-tick replay across cadences and 100 complete lifecycle cycles. Confirm tests exercise the production modules and no real sleeps. Consult the mapping in [plan.md](plan.md) and lifecycle in [data-model.md](data-model.md).

## Supported-browser journeys

For each installed stable browser, record version and baseline in feature-local `validation.md` and check:

1. Open the game: title/icon, stationary ready bird, zero score, start instructions and Start game below. Check independent vintage arcade art, strong colors, visible decorative animations and responsive layout.
2. Start independently through Space, ArrowUp, mouse click, touch tap and Start game. Each starts with one flap. Hold either key: no repeats or scrolling. Each click/tap gives one action, including touch compatibility events. Test real desktop touchscreen hardware and record device/browser evidence.
3. Exercise pipe edges, opening edges, ground and ceiling with exact contact, overlap and swept-crossing fixtures. Loss freezes gameplay and scoring, retains final score and shows Tap to try again plus Restart game. Gameplay keys alone after loss are ignored.
4. Clear exactly 0, 1 and 10 pairs using valid trajectories. Check strict clearance, once-only score, collision priority and HUD update by next render.
5. Switch tabs or move focus away during play. Returning preserves paused progress. Each fresh gameplay input or Resume game resumes that round with one flap and no catch-up. Test both focus/visibility restoration orders.
6. Test Tap to try again and Restart game independently after loss: each immediately starts fresh with zero score, no old obstacles or stale input and one flap. Exercise restart from other states through the restart action. Check native pointer and Tab/Enter buttons, visible focus, no button bubbling, and no duplicate loops/listeners.
7. Complete ready → playing → game-over → retry → playing and playing → paused → resume → playing. Record outcomes and console errors. Capture lifecycle, arcade artwork and animation evidence. Decorative animations must not alter simulation outcomes.

Use [contracts/browser-game.md](contracts/browser-game.md) for expected UI behavior. Rendering, focus handling and native button activation must be checked in real browsers, not inferred from unit tests.

## Determinism and 100-cycle validation

Run the browser harness with fixed seed and tick-indexed controls, allowing real collisions and restarting only after game-over. Repeat 100 start/play/end/restart cycles, comparing terminal tick, obstacle sequence, score and collision outcomes to the first cycle. Include a scoring trajectory so duplicate points and stale pair flags are observable. Record zero unexpected errors, listener/loop duplication and stale state. Unit fake-clock runs additionally compare 30/60/120/144 Hz, jitter and visible delayed callbacks at equal ticks.

For every restart record activation time and the first fully reset displayed frame. Mark and verify score, bird position, absence of old obstacles, playing state and exactly one initiating flap together. A requestAnimationFrame callback occurs before paint and is insufficient alone as proof of visible latency: use browser performance/screenshot or screen-capture frame evidence to identify the first presented reset image; correlate timestamps with the activation mark. A second animation callback is only a diagnostic proxy. Record measurement resolution; any result whose uncertainty crosses 100 ms needs a more precise measurement. All 100 activations must be at most 100 ms (NFR-02/SC-04).

## Performance validation

Use the selected Apple Silicon/macOS 26.3.1/60 Hz representative baseline from [plan.md](plan.md); record exact chip/model, memory, viewport, display rate, browser version and power/workload conditions before testing. Keep the page visible and focused.

In each browser run a 60-second collision-free trajectory in the harness using the production renderer, normal rules, same DOM/HUD and deterministic valid inputs. A preverified trajectory may select a fixed legal obstacle stream and scripted flaps; no collision bypass or reduced rendering is allowed. Count rendered callbacks over elapsed visible time to obtain average FPS; record frame intervals and noticeable stuttering. Compare with the 60 FPS target. Investigate stuttering and record cause/action; a lower numerical average alone is not failure. Restart latency remains a mandatory bound.

## Evidence and acceptance

Create `validation.md` during implementation with date, commit, hardware/OS/display/viewport, exact browser versions, unit command/results, per-browser journey results, FPS duration/count/average and stutter investigation, 100-cycle outcome comparisons, all 100 reset measurements and their visible-frame evidence/resolution, defects and rerun references. Include requirement-to-test names and implementation-file/function references, with task IDs once tasks exist. Missing browsers or measurement tools mean incomplete validation, never an assumed pass. Recorded executions are linked in validation.md; follow this procedure to obtain the missing acceptance evidence.

## Independent development and scope review

Confirm root `index.html`, `style.css`, and `game.js` are newly authored SDD files derived from the specification. Vibe files are absent from the planning checkout; no Vibe migration or overwrite is planned. Review new SDD source and tests for requirement traceability and independent authorship; sharing a browser API or a numeric constant is not evidence of copied code. Open `/` for the SDD game and `/tests/browser/` for its validation harness. Vibe is not served by this checkout. Verify the resolved D-01–D-03 decisions and amended specification: no saved scores or storage, all desktop input methods, fatal ceiling, immediate retry, preserved-round resume and animated vintage arcade presentation. No mobile platform validation is required.
