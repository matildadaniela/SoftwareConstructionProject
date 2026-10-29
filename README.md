# Browser Flappy Bird — SDD

An independently authored, specification-derived Flappy Bird game using HTML, CSS,
JavaScript modules and Canvas. Scores belong to the current round only; nothing is
saved between rounds or page loads.

## Run locally

Use Node.js 22 for tests and Python 3 for the static server. No package installation,
third-party dependencies, bundler or build step is needed. From the repository root:

```sh
npm test
python3 -m http.server 8000 --bind 127.0.0.1
```

Open the [game](http://127.0.0.1:8000/) in a desktop browser. Serve over HTTP so
JavaScript modules load correctly. Stop the server with Ctrl+C.

## Controls

- Press Space or ArrowUp, click the playfield, or tap it on a desktop touchscreen
  to start and flap. Holding a key does not repeat flaps.
- Use Start game below the playfield to begin. Use Tab and Enter for native buttons.
- Avoid pipes, the ceiling and the ground. Clear a pipe pair completely to score.
- Leaving the page pauses the round. Return and use a fresh gameplay input or
  Resume game to continue the preserved round with a flap.
- After loss, use Tap to try again or Restart game for a fresh playing round with
  one initiating flap. During play, Restart game also starts a fresh round.

## Validation

Open the [browser harness](http://127.0.0.1:8000/tests/browser/) to run controlled
fixtures and 100 scoring/loss/retry cycles, or a focused, visible 60-second flight.
Download its JSON report to retain results. Presented reset-frame latency requires
external capture correlated with the harness marks.

The dependency-free automated suite covers simulation, input, timing, rendering,
scoring and restart isolation. See the [quickstart and browser journeys](specs/001-browser-flappy-bird/quickstart.md)
and [validation evidence and remaining acceptance checks](specs/001-browser-flappy-bird/validation.md).
Chrome, Firefox, Edge and Safari are the supported desktop targets; complete
four-browser, real desktop touch, presented reset-frame latency and visible
performance acceptance checks were skipped by user decision; those claims remain unverified. Mobile platforms are outside scope.

The [specification](specs/001-browser-flappy-bird/spec.md) and
[plan](specs/001-browser-flappy-bird/plan.md) define this independent SDD implementation.
Vibe code and assets are not included or reused.
