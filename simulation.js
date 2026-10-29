import { CONFIG, createConfig } from './config.js';

// Round: phase is ready/playing/paused/game-over; tick and score nonnegative
// integers; owns one bird and zero or more pairs; only playing advances tick;
// ready has zero score/tick and empty pairs.
// Bird: x remains fixed; top-left origin; full unrotated rectangle defines
// contact; y >= 0; ceiling or ground contact causes loss.
// Fatal-position policy for T009: test the full proposed swept path before
// committing movement. At a boundary loss, store y clamped to
// [0, groundY - bird.height], keep x fixed, and discard remaining step time.
// Clamping must never replace collision detection or make contact nonfatal.
export function createRound(config = CONFIG) {
  const settings = createConfig(config);
  return {
    phase: 'ready',
    activeTick: 0,
    score: 0,
    bird: {
      x: settings.birdX,
      y: settings.birdY,
      width: settings.birdWidth,
      height: settings.birdHeight,
      velocityY: 0,
    },
    pairs: [],
    nextPairId: 1,
    nextSpawnTick: settings.spawnTicks,
    previousGapTop: Math.max(settings.gapMin, Math.min(settings.gapMax,
      settings.birdY + settings.birdHeight / 2 - settings.gapHeight / 2)),
    // Numeric PRNG state is owned by this round; creation consumes no randomness.
    rngState: settings.initialSeed,
  };
}
