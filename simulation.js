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
  // once; remove after right edge <0.
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

// Slab intervals share one normalized tick time, including contact at 0 and 1.
// Infinity denotes no contact; stationary overlapping axes impose no limit.
function sweptContactTime(a, b, da, db) {
  let entry = 0;
  let exit = 1;
  for (const [axis, size] of [['x', 'width'], ['y', 'height']]) {
    const displacement = da[axis] - db[axis];
    if (displacement === 0) {
      if (a[axis] + a[size] < b[axis] || a[axis] > b[axis] + b[size]) return Infinity;
      continue;
    }
    const first = (b[axis] - a[axis] - a[size]) / displacement;
    const last = (b[axis] + b[size] - a[axis]) / displacement;
    entry = Math.max(entry, Math.min(first, last));
    exit = Math.min(exit, Math.max(first, last));
    if (entry > exit) return Infinity;
  }
  return entry;
}

export function sweptAabb(a, b, da, db) {
  return sweptContactTime(a, b, da, db) !== Infinity;
}

function firstCollisionTime(round, config, birdMovement, pipeMovement) {
  const bird = round.bird;
  const bottomLimit = config.groundY - bird.height;
  let contact = Infinity;
  if (bird.y <= 0 || bird.y >= bottomLimit) contact = 0;
  else if (birdMovement.y < 0) contact = -bird.y / birdMovement.y;
  else if (birdMovement.y > 0) contact = (bottomLimit - bird.y) / birdMovement.y;
  if (contact > 1) contact = Infinity;

  for (const pair of round.pairs) {
    const lowerY = pair.gapTop + pair.gapHeight;
    for (const rectangle of [
      { x: pair.x, y: 0, width: pair.width, height: pair.gapTop },
      { x: pair.x, y: lowerY, width: pair.width, height: config.groundY - lowerY },
    ]) {
      contact = Math.min(contact,
        sweptContactTime(bird, rectangle, birdMovement, pipeMovement));
    }
  }
  return contact;
}

export function stepRound(round, config = CONFIG, inputsForTick = [],
  random = () => nextObstacleRandom(round)) {
  if (round.phase !== 'playing') return false;

  for (const input of inputsForTick) {
    if (input.type === 'flap') round.bird.velocityY = config.flapVelocity;
  }

  // Semi-implicit Euler: inputs set velocity, then gravity precedes position.
  round.bird.velocityY += config.gravity * config.stepSeconds;
  const birdMovement = { x: 0, y: round.bird.velocityY * config.stepSeconds };
  const pipeMovement = { x: -config.pipeSpeed * config.stepSeconds, y: 0 };
  round.activeTick++;

  if (round.activeTick === round.nextSpawnTick) spawnPair(round, config, random);
  const contact = firstCollisionTime(round, config, birdMovement, pipeMovement);
  const elapsed = Math.min(1, contact);
  round.bird.y = Math.max(0, Math.min(config.groundY - round.bird.height,
    round.bird.y + birdMovement.y * elapsed));
  for (const pair of round.pairs) pair.x += pipeMovement.x * elapsed;
  if (contact !== Infinity) {
    round.phase = 'game-over';
    // Collision precedes scoring/retirement. Later backlog calls are inert.
    return true;
  }
  // Every hazard must be clear before any pair can award a point. Count pairs
  // before retirement so even a fast offscreen crossing is counted once.
  for (const pair of round.pairs) {
    if (!pair.scored && round.bird.x > pair.x + pair.width) {
      pair.scored = true;
      round.score++;
    }
  }
  round.pairs = round.pairs.filter(pair => pair.x + pair.width >= 0);
  return true;
}

// Round: phase is ready/playing/paused/game-over; tick and score nonnegative
// integers; owns one bird and zero or more pairs; only playing advances tick;
// ready has zero score/tick and empty pairs.
// Bird: x remains fixed; top-left origin; full unrotated rectangle defines
// contact; y >= 0; ceiling or ground contact causes loss.
// Fatal-position policy: test the full proposed swept path before
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
