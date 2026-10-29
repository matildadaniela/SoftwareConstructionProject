# Data Model: Browser Flappy Bird

The specification confirms current-round in-memory scoring only, with no persistence or network model (D-01 resolved 2026-10-29). Dimensions are logical pixels and velocities are pixels/second. See [plan.md](plan.md) for constants and [contracts/browser-game.md](contracts/browser-game.md) for controls.

## Entities and invariants

| Entity | Fields | Rules / relationships |
|---|---|---|
| GameConfig | width=400, height=600, groundY=526, stepSeconds=1/120, gravity=1512, flapVelocity=-450, pipeWidth=64, gapHeight=164, pipeSpeed=156, spawnTicks=210, gapMin=75, gapMax=287, maxGapChange=60, initialSeed | Immutable named values; positive sizes/speed, gap larger than bird height, valid opening within ground; shared by simulation/rendering/tests |
| Round | phase, activeTick, score, bird, pairs[], nextPairId, nextSpawnTick, previousGapTop, rngState | phase is ready/playing/paused/game-over; tick and score nonnegative integers; owns one bird and zero or more pairs; only playing advances tick; ready has zero score/tick and empty pairs |
| Bird | x=90, y=248, width=34, height=28, velocityY=0 | x remains fixed; top-left origin; full unrotated rectangle defines contact; y >= 0; ceiling or ground contact causes loss |
| ObstaclePair | id, x, width=64, gapTop, gapHeight=164, scored=false | Unique within round; top rectangle spans y=0..gapTop, bottom spans gapTop+gapHeight..526; inclusive edges; scored may change false→true once; remove after right edge <0 |
| InputState | heldKeys, activePointer, pendingFlaps[] | Each queue item targets an unprocessed simulation tick, FIFO within tick; all inputs for a tick consumed before integration, each setting flap velocity without accumulated impulse or carryover; repeats ignored; blur, hidden and restart clear held flag and queue; Space/ArrowUp and pointer input require visible/focused page; one action per click/tap, no compatibility duplicates |
| LoopState | lastTimestamp, accumulatorSeconds, scheduledFrameId | Infrastructure, outside round; monotonic clock; null timestamp on reset/resume; paused/inactive time is never accumulated; one scheduled chain |
| View | scoreText, statusText, canvas overlay | Derived from round only, no independent gameplay truth; score and state update no later than next render; restart enters playing with one flap and draws immediately |

PRNG state belongs to the round. Initial seed and tick-indexed inputs determine reproducible outcomes; decorative arcade animation cannot consume this PRNG or mutate round state. No high-score entity or storage is specified.

## State transitions

| From | Event / guard | To | Effects |
|---|---|---|---|
| ready | fresh Space/ArrowUp, game click/tap or Start game; visible/focused | playing | Queue one flap; reset loop origin |
| playing | distinct gameplay input | playing | Queue one flap for next tick |
| playing | blur or hidden | paused | Preserve world, score, tick, RNG; clear input/backlog |
| paused | focus/visibility restored only | paused | Preserve world; show resume instruction |
| paused | fresh gameplay input or Resume game; visible/focused | playing | Preserve round; queue one flap; reset clock origin |
| playing | ceiling/pipe/ground contact | game-over | Freeze gameplay and final score; no points in collision tick |
| game-over | Space/ArrowUp | game-over | Ignore gameplay action, prevent browser default |
| game-over | Tap to try again | playing | Fresh round and seed, zero score, no old obstacles/input/backlog; immediately set initiating flap velocity at starting position with zero elapsed ticks and no queued duplicate |
| any | Restart game | playing | Same fresh-round operation; immediate render, one animation chain |

Invalid or repeated pause/game-over transitions have no effect. Each restart creates a clean round and applies initiating flap velocity before synchronous rendering, without advancing position or simulation time. That initiating flap is not queued again. Native button events and game-area pointer events must not both handle one activation. Decorative animation is independent of frozen gameplay.

## Per-step ordering and validation

Consume all accepted inputs targeting the tick in FIFO order before integration; each flap sets configured vertical velocity without accumulating impulse or carrying into later ticks. Validate configuration once at construction. Generate openings only within the allowed intersection of world bounds and previous gap ±60; initialize the previous gap to the clamped opening centered on the starting bird. Spawn ticks and IDs reset with the round. Evaluate the swept bird path against moving upper/lower rectangles and ground before applying any pair score. Passing requires strict horizontal clearance; contact uses inclusive comparisons. Include a fatal ceiling plane at y=0. Discard unused remainder of a collision step and do not process subsequent accumulated steps after loss.

Boundary fixtures must include exact edge equality, one increment either side, multiple pairs in a collision step, ceiling contact/crossing with concurrent pipe motion, and offscreen pairs. Rendering reads state but cannot mutate it.
