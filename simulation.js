import { CONFIG, createConfig } from './config.js';

// The caller queues one normalized flap for the next tick for every accepted
// start, resume or active-play action. No input is retained inside the round.
export function startOrFlap(round) {
  if (round.phase === 'ready' || round.phase === 'paused') {
    round.phase = 'playing';
  }
}

export function pauseRound(round) {
  if (round.phase === 'playing') round.phase = 'paused';
}

function nextObstacleRandom(round) {
  let state = round.rngState;
  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;
  round.rngState = state >>> 0;
  return round.rngState / 2 ** 32;
}

function spawnPair(round, config, random) {
  const minimum = Math.max(config.gapMin, round.previousGapTop - config.maxGapChange);
  const maximum = Math.min(config.gapMax, round.previousGapTop + config.maxGapChange);
  const gapTop = minimum + random() * (maximum - minimum);
  // Unique within round; top rectangle spans y=0..gapTop, bottom spans
  // gapTop+gapHeight..groundY; inclusive edges. Scored may change false→true
  // once (T017); remove after right edge <0.
  round.pairs.push({
    id: round.nextPairId++,
    x: config.width,
    width: config.pipeWidth,
    gapTop,
    gapHeight: config.gapHeight,
    scored: false,
  });
  round.previousGapTop = gapTop;
  round.nextSpawnTick += config.spawnTicks;
}

export function stepRound(round, config = CONFIG, inputsForTick = [],
  random = () => nextObstacleRandom(round)) {
  if (round.phase !== 'playing') return false;

  for (const input of inputsForTick) {
    if (input.type === 'flap') round.bird.velocityY = config.flapVelocity;
  }

  // Semi-implicit Euler: inputs set velocity, then gravity precedes position.
  round.bird.velocityY += config.gravity * config.stepSeconds;
  round.bird.y += round.bird.velocityY * config.stepSeconds;
  round.activeTick++;

  if (round.activeTick === round.nextSpawnTick) spawnPair(round, config, random);
  for (const pair of round.pairs) pair.x -= config.pipeSpeed * config.stepSeconds;
  round.pairs = round.pairs.filter(pair => pair.x + pair.width >= 0);
  return true;
}

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
