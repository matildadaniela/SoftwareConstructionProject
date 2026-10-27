# Browser Game Interface Contract

This application exposes a browser UI, not a remote API. Internal module seams below support tests and maintenance. Requirement references are normative; tuning is specified in [plan.md](../plan.md).

## Page and controls (FR-01, FR-04, FR-07–FR-11)

- `sdd/index.html` loads its independently written `game.js` as a native ES module over HTTP. No build, network service or stored data is needed once static assets load.
- Heading includes visible game title and icon above the 400×600 logical Canvas; responsive CSS scales the full view uniformly. The score is readable in the HUD and exposed as text.
- Ready displays a stationary bird, zero score, no obstacles and “Press Space to start.” Playing removes that instruction. Paused shows “Paused — press Space to resume.” Game-over shows final score, “Game over” and an instruction to use Restart.
- A labeled native Restart button appears below the play area with visible keyboard focus. Pointer click and Tab/Enter activate restart from every state.
- Space keydown while visible/focused is owned by gameplay, including when Restart is focused: prevent scrolling/default button activation, ignore repeats/held key, and enqueue one flap from ready, playing or paused. keyup releases the held flag. Space in game-over does nothing to the round. The current specification requires no ArrowUp or canvas pointer gameplay; their inclusion/exclusion awaits D-02 in [scope-comparison.md](../scope-comparison.md). This contract does not authorize a feature removal from Vibe.
- Blur or hidden visibility pauses an active round and clears held/pending input. Returning preserves paused state until a new Space press. Focus alone never resumes.
- Accessible DOM status mirrors lifecycle overlays; Canvas has a meaningful label. Keep ordinary Tab and Enter behavior; do not steal focus on every frame.

## Internal responsibilities (proposed functions, not framework interfaces)

| Module | Interface | Contract |
|---|---|---|
| simulation.js | createRound(config, seed) | Returns a fresh ready round with independent collections and initial RNG state |
| simulation.js | startOrFlap(round), pauseRound(round) | Implements only legal transitions; accepts already-normalized inputs; flap represented at the next step |
| simulation.js | stepRound(round, config, inputsForTick) | Advances exactly one fixed tick only while playing; mutates owned state; returns phase/score change signals; no DOM/time/storage access |
| simulation.js | collision and seeded generation helpers | Pure numeric operations, shared definitions for all gameplay; injectable known random stream for tests |
| game.js | bindInput(targets, actions, availability) → dispose | Owns one set of listeners and Space held state; invokes normalized actions; dispose removes listeners; availability checks both focus and visibility |
| game.js | createLoop({step, render, clock, requestFrame, cancelFrame}) | Owns one fixed-step accumulator/animation chain; can clear timing and input queues without adding a chain; injected fake scheduler allowed |
| renderer.js | render(context, round, config) | Draws without gameplay mutations or external randomness affecting round; uses the same geometric bounds as collisions |
| game.js | initialization and restart action | Composes modules once; resets simulation, pending input and loop timing, updates HUD/status and renders complete ready view synchronously |

Input and timing functions live together in `game.js`; the table separates responsibilities, not additional modules or classes. Interfaces are design seams, not a separately published library. Implementation may choose equivalent signatures while preserving responsibilities, observable behavior and traceability.

## Ordering and observable guarantees

Collision wins over every potential score in the same simulation tick (FR-05/FR-06). At exact pair-right/bird-left equality there is no point; full strict clearance awards one point per pair, at most once. Ready, paused and game-over freeze simulation. Rendering cadence changes neither tick rules nor seeded sequence. Restart draws all reset content in its activation handler and must be visibly painted within 100 ms on the recorded baseline; this browser guarantee requires measured evidence.

## Validation interface

A separate native browser harness imports production modules and can inject seed, tick-indexed controls, clock/scheduler and known obstacle fixtures. It reports assertion failures, cycle number, errors, FPS/frame intervals and reset-paint observations. Production entry does not expose cheats, collision bypass switches or global test controls. A collision-free 60-second trajectory must use valid controls and normal collision rules; any harness-only relaxation invalidates performance acceptance.
