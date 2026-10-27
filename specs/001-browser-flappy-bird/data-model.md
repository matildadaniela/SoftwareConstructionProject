# Data Model: Browser Flappy Bird

The current specification models round data in memory, with no persistence or network model (A-01). This is conditional on D-01 resolution in [scope-comparison.md](scope-comparison.md), not authorization to remove Vibe high scores. Dimensions are logical pixels and velocities are pixels/second. See [plan.md](plan.md) for constants and [contracts/browser-game.md](contracts/browser-game.md) for controls.

## Entities and invariants

| Entity | Fields | Rules / relationships |
|---|---|---|
| GameConfig | width=400, height=600, groundY=526, stepSeconds=1/120, gravity=1512, flapVelocity=-450, pipeWidth=64, gapHeight=164, pipeSpeed=156, spawnTicks=210, gapMin=75, gapMax=287, maxGapChange=60, initialSeed | Immutable named values; positive sizes/speed, gap larger than bird height, valid opening within ground; shared by simulation/rendering/tests |
| Round | phase, activeTick, score, bird, pairs[], nextPairId, nextSpawnTick, previousGapTop, rngState | phase is ready/playing/paused/game-over; tick and score nonnegative integers; owns one bird and zero or more pairs; only playing advances tick; ready has zero score/tick and empty pairs |
| Bird | x=90, y=248, width=34, height=28, velocityY=0 | x remains fixed; top-left origin; full unrotated rectangle defines contact; y >= 0; top clamp clears upward velocity; ground contact causes loss |
| ObstaclePair | id, x, width=64, gapTop, gapHeight=164, scored=false | Unique within round; top rectangle spans y=0..gapTop, bottom spans gapTop+gapHeight..526; inclusive edges; scored may change false→true once; remove after right edge <0 |
| InputState | spaceHeld, pendingFlaps[] | Each queue item targets an unprocessed simulation tick, FIFO within tick; repeats ignored; blur, hidden and restart clear held flag and queue; Space requires visible/focused page |
| LoopState | lastTimestamp, accumulatorSeconds, scheduledFrameId | Infrastructure, outside round; monotonic clock; null timestamp on reset/resume; paused/inactive time is never accumulated; one scheduled chain |
| View | scoreText, statusText, canvas overlay | Derived from round only, no independent gameplay truth; score and state update no later than next render; restart draws immediately |

PRNG state belongs to the round. Initial seed and tick-indexed inputs determine a reproducible obstacle sequence and outcome; cosmetic effects must not consume this PRNG. No high-score entity is currently specified. If D-01 includes persistence, specify its lifetime, restart behavior, validation and unavailable-storage fallback before extending this model; do not assume Vibe storage-key compatibility.

## State transitions

| From | Event / guard | To | Effects |
|---|---|---|---|
| ready | distinct Space, visible and focused | playing | Queue exactly one flap; reset loop origin; no immediate elapsed-time integration |
| playing | distinct Space | playing | Queue one flap for next simulation tick |
| playing | blur or document hidden | paused | Preserve bird, pairs, score, tick and RNG; clear input and loop backlog |
| paused | focus/visibility restored only | paused | Display resume instruction; preserve world |
| paused | distinct Space, visible and focused | playing | Queue one flap; fresh clock origin; no absence catch-up |
| playing | pipe/ground contact | game-over | Commit collision result once; freeze world and final score; no points in collision step |
| game-over | Space | game-over | No gameplay change; consume default browser Space behavior |
| any | restart | ready | New initial round/seed, empty obstacles/input/backlog, velocity and score zero, initial bird position, complete ready view |

Invalid or repeated pause/game-over transitions have no effect. Restart is idempotent. No timer, listener, particle or previous round reference may survive reset in a way that affects gameplay.

## Per-step ordering and validation

Validate configuration once at construction. Generate openings only within the allowed intersection of world bounds and previous gap ±60; initialize the previous gap to the clamped opening centered on the starting bird. Spawn ticks and IDs reset with the round. Evaluate the swept bird path against moving upper/lower rectangles and ground before applying any pair score. Passing requires strict horizontal clearance; contact uses inclusive comparisons. Clamp ceiling motion without a fatal top plane. Discard unused remainder of a collision step and do not process subsequent accumulated steps after loss.

Boundary fixtures must include exact edge equality, one increment either side, multiple pairs in a collision step, top clamp with concurrent pipe motion, and offscreen pairs. Rendering reads state but cannot mutate it.
