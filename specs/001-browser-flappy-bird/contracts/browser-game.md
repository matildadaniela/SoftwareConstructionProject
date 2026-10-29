# Browser Game Interface Contract

This application exposes a browser UI, not a remote API. Internal module seams below support tests and maintenance. Requirement references are normative; tuning is specified in [plan.md](../plan.md).

## Page and controls (FR-01, FR-04, FR-07–FR-11)

- Root `index.html` loads independently written `game.js` as a native ES module over HTTP. No build, backend or storage is required.
- Title/icon above a responsive 400×600 logical Canvas; readable current-round score and accessible status text. Use independent vintage arcade artwork, strong colors and decorative animations without changing collision bounds or gameplay state.
- Ready: stationary bird, score zero, start instruction and “Start game” below. Space/ArrowUp, game-area mouse click/touch tap or the button starts with one flap.
- Playing: each distinct gameplay input flaps once; “Restart game” below immediately starts fresh. Ignore keyboard repeats; prevent Space/ArrowUp scrolling and accidental focused-button activation.
- Paused: preserve the round and display resume instructions plus “Resume game” below. Fresh gameplay input or this button resumes with one flap, without simulating time away. Focus/visibility restoration alone never resumes.
- Game over: freeze gameplay, retain final score, show “Tap to try again” on the game and “Restart game” below. Either retry action immediately starts a fresh playing round with one flap. Space/ArrowUp alone is ignored after loss.
- Native buttons support pointer and Tab/Enter with visible focus. One mouse/touch gesture must produce exactly one action; suppress compatibility mouse duplication and event bubbling from buttons. Accessible retry activation also uses the same action.
- Blur/hidden pauses active play and clears held keys, pointer state and pending input. Desktop touchscreens are included; mobile platforms are outside scope.
- Ceiling, pipe and ground contact are fatal. Decorative animation may continue outside play without moving gameplay entities or changing score.

## Internal responsibilities (proposed functions, not framework interfaces)

| Module | Interface | Contract |
|---|---|---|
| simulation.js | createRound(config, seed) | Returns a fresh ready round with independent collections and initial RNG state |
| simulation.js | startOrFlap(round), pauseRound(round) | Implements only legal transitions; accepts already-normalized inputs; start/resume and active-play flaps represented at the next step; consume all inputs targeting that tick in FIFO order before integration, each setting flap velocity without accumulated impulse or carryover |
| simulation.js | stepRound(round, config, inputsForTick) | Advances exactly one fixed tick only while playing; mutates owned state; returns phase/score change signals; no DOM/time/storage access |
| simulation.js | collision and seeded generation helpers | Pure numeric operations, shared definitions for all gameplay; injectable known random stream for tests |
| game.js | bindInput(targets, actions, availability) → dispose | Owns one set of listeners and Space/ArrowUp held state and pointer deduplication; invokes normalized actions; dispose removes listeners; availability checks both focus and visibility |
| game.js | createLoop({step, render, clock, requestFrame, cancelFrame}) | Owns one fixed-step accumulator/animation chain; can clear timing and input queues without adding a chain; injected fake scheduler allowed |
| renderer.js | render(context, round, config) | Draws without gameplay mutations or external randomness affecting round; uses the same geometric bounds as collisions |
| game.js | initialization and restart action | Composes modules once; resets simulation, pending input and loop timing, updates HUD/status and starts a fresh playing round, immediately sets initiating flap velocity without advancing position or simulation time, and renders the reset view synchronously; never queues that initiating flap again |

Input and timing functions live together in `game.js`; the table separates responsibilities, not additional modules or classes. Interfaces are design seams, not a separately published library. Implementation may choose equivalent signatures while preserving responsibilities, observable behavior and traceability.

## Ordering and observable guarantees

Collision wins over every potential score in the same simulation tick (FR-05/FR-06). At exact pair-right/bird-left equality there is no point; full strict clearance awards one point per pair, at most once. Ready, paused and game-over freeze simulation. Rendering cadence changes neither tick rules nor seeded sequence. Restart draws all reset content in its activation handler and must be visibly painted within 100 ms on the recorded baseline; this browser guarantee requires measured evidence.

## Validation interface

A separate native browser harness imports production modules and can inject seed, tick-indexed controls, clock/scheduler and known obstacle fixtures. It reports assertion failures, cycle number, errors, FPS/frame intervals and reset-paint observations. Production entry does not expose cheats, collision bypass switches or global test controls. A collision-free 60-second trajectory must use valid controls and normal collision rules; any harness-only relaxation invalidates performance acceptance.
