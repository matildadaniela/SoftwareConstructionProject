import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, createConfig } from '../config.js';
import { createRound } from '../simulation.js';

test('FR-02 FR-03 NFR-04: named configuration matches planned tuning and is immutable', () => {
  assert.deepEqual(CONFIG, {
    width: 400, height: 600, groundY: 526, stepSeconds: 1 / 120,
    birdX: 90, birdY: 248, birdWidth: 34, birdHeight: 28,
    gravity: 1512, flapVelocity: -450, pipeWidth: 64, gapHeight: 164,
    pipeSpeed: 156, spawnTicks: 210, gapMin: 75, gapMax: 287,
    maxGapChange: 60, initialSeed: 0x1A2B3C4D,
  });
  assert.ok(Object.isFrozen(CONFIG));
  assert.throws(() => { CONFIG.width = 1; }, TypeError);
});

test('FR-02 FR-03 FR-10: construction rejects invalid numeric, bird and opening bounds', () => {
  const invalid = [
    ...Object.keys(CONFIG).flatMap(key => [NaN, Infinity, -Infinity].map(value => ({ [key]: value }))),
    ...['width', 'height', 'groundY', 'stepSeconds', 'birdWidth', 'birdHeight',
      'gravity', 'pipeWidth', 'gapHeight', 'pipeSpeed', 'spawnTicks'].map(key => ({ [key]: 0 })),
    { spawnTicks: 1.5 }, { initialSeed: 0 }, { initialSeed: -1 },
    { initialSeed: 2 ** 32 }, { initialSeed: 1.5 }, { flapVelocity: 0 },
    { groundY: 601 }, { gapHeight: 28 }, { gapMin: -1 },
    { gapMin: 288 }, { gapMax: 363 }, { maxGapChange: -1 },
    { birdX: -1 }, { birdX: 367 }, { birdY: 0 }, { birdY: 498 }, { typo: 1 },
  ];
  for (const overrides of invalid) {
    assert.throws(() => createConfig(overrides), RangeError, JSON.stringify(overrides));
    assert.throws(() => createRound({ ...CONFIG, ...overrides }), RangeError);
  }
});

test('FR-07 FR-02 NFR-03: fresh round has ready state, bird, schedule and owned RNG', () => {
  assert.deepEqual(createRound(), {
    phase: 'ready', activeTick: 0, score: 0,
    bird: { x: 90, y: 248, width: 34, height: 28, velocityY: 0 },
    pairs: [], nextPairId: 1, nextSpawnTick: 210, previousGapTop: 180,
    rngState: 0x1A2B3C4D,
  });
});

test('NFR-03 FR-07: fresh rounds do not share bird, pairs or random state', () => {
  const first = createRound();
  const second = createRound();
  first.bird.y = 100;
  first.pairs.push({ id: 1 });
  first.rngState = 123;
  first.activeTick = 10;
  assert.deepEqual(second, createRound());
  assert.notStrictEqual(first.bird, second.bird);
  assert.notStrictEqual(first.pairs, second.pairs);
});

test('FR-03 NFR-03: constructor uses configured seed and clamps bird-centered opening', () => {
  for (const [birdY, previousGapTop] of [[1, 75], [248, 180], [497, 287]]) {
    const round = createRound(createConfig({ birdY, initialSeed: 1, spawnTicks: 100 }));
    assert.equal(round.previousGapTop, previousGapTop);
    assert.equal(round.rngState, 1);
    assert.equal(round.nextSpawnTick, 100);
  }
});

// T005 proposed seams for T007–T009: startOrFlap(round) changes ready/paused
// to playing; the caller supplies one normalized flap at the next step.
// stepRound(round, config, inputsForTick = [], random?) consumes that tick only.
// Optional random() supplies obstacle samples in [0, 1); otherwise use round RNG.
const gameplay = await import('../simulation.js');
function api(name) {
  assert.equal(typeof gameplay[name], 'function', `Missing production simulation.${name} (T007–T009)`);
  return gameplay[name];
}
const step = (round, inputs = [], config = CONFIG, random) =>
  api('stepRound')(round, config, inputs, random);
function playing() {
  const round = createRound();
  round.phase = 'playing';
  return round;
}
function pair(x, gapTop = 180, id = 1) {
  return { id, x, width: 64, gapTop, gapHeight: 164, scored: false };
}
function near(actual, expected) { assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≈ ${expected}`); }
// Keep long spawn fixtures alive without disabling normal physics/collisions.
function cruise(round, random) {
  if (round.bird.y > 270 && round.bird.velocityY > 0) step(round, [{ type: 'flap' }], CONFIG, random);
  else step(round, [], CONFIG, random);
  assert.equal(round.phase, 'playing');
}

test('FR-01 FR-02 FR-07: start supplies one flap before gravity and position integration', () => {
  const round = createRound();
  api('startOrFlap')(round);
  assert.equal(round.phase, 'playing');
  assert.equal(round.activeTick, 0);
  step(round, [{ type: 'flap' }]);
  near(round.bird.velocityY, -437.4);
  near(round.bird.y, 244.355);
  assert.equal(round.activeTick, 1);
  assert.equal(round.bird.x, 90);
  step(round);
  near(round.bird.velocityY, -424.8);
});

test('FR-01 FR-02 NFR-03: tick inputs are consumed FIFO without accumulated impulse or carryover', () => {
  const round = playing();
  const seen = [];
  const inputs = ['first', 'second'].map(label => ({
    get type() {
      seen.push(label);
      return 'flap';
    },
  }));
  step(round, inputs);
  assert.deepEqual(seen, ['first', 'second']);
  near(round.bird.velocityY, -437.4);
  near(round.bird.y, 244.355);
  step(round);
  assert.deepEqual(seen, ['first', 'second']);
  near(round.bird.velocityY, -424.8);
  near(round.bird.y, 240.815);
  assert.equal(round.activeTick, 2);
});

test('FR-02: flap rises, reaches an apex, then descends under gravity', () => {
  const round = playing();
  step(round, [{ type: 'flap' }]);
  const firstY = round.bird.y;
  for (let i = 1; i < 35; i++) step(round);
  assert.ok(round.bird.velocityY < 0);
  assert.ok(round.bird.y < firstY);
  const apexY = round.bird.y;
  step(round);
  assert.ok(round.bird.velocityY > 0);
  assert.ok(round.bird.y > apexY);
  for (let i = 0; i < 10; i++) step(round);
  assert.ok(round.bird.y > apexY);
});

for (const phase of ['ready', 'paused', 'game-over']) {
  test(`FR-02 FR-07: ${phase} freezes every round field even with step inputs`, () => {
    const round = createRound();
    round.phase = phase;
    const before = structuredClone(round);
    for (let i = 0; i < 5; i++) step(round, [{ type: 'flap' }]);
    assert.deepEqual(round, before);
  });
}

test('FR-07 FR-11: pause/resume preserves world, tick, score and RNG; illegal transitions are inert', () => {
  const round = playing();
  round.activeTick = 20;
  round.score = 3;
  round.pairs = [pair(300)];
  round.bird.velocityY = 100;
  const before = structuredClone(round);
  api('pauseRound')(round);
  assert.deepEqual(round, { ...before, phase: 'paused' });
  api('pauseRound')(round);
  api('startOrFlap')(round);
  assert.deepEqual(round, before);
  step(round, [{ type: 'flap' }]);
  near(round.bird.velocityY, -437.4);
  for (const phase of ['ready', 'game-over']) {
    const inactive = createRound();
    inactive.phase = phase;
    const snapshot = structuredClone(inactive);
    api('pauseRound')(inactive);
    if (phase === 'game-over') api('startOrFlap')(inactive);
    assert.deepEqual(inactive, snapshot);
  }
});

test('FR-03: first spawn at tick 210, recurring tick 420, fixed movement and 273px spacing', () => {
  const round = playing();
  for (let i = 0; i < 209; i++) cruise(round, () => 0.5);
  assert.deepEqual(round.pairs, []);
  cruise(round, () => 0.5);
  assert.equal(round.activeTick, 210);
  // Per-step contract spawns at x=400 before moving all pairs this tick.
  near(round.pairs[0].x, 398.7);
  const firstX = round.pairs[0].x;
  cruise(round, () => 0.5);
  near(firstX - round.pairs[0].x, 1.3);
  while (round.activeTick < 420) cruise(round, () => 0.5);
  assert.equal(round.pairs.length, 2);
  near(round.pairs[1].x - round.pairs[0].x, 273);
  assert.deepEqual(round.pairs.map(p => p.id), [1, 2]);
  assert.equal(round.nextSpawnTick, 630);
});

test('FR-03 NFR-03: equal seeds yield equal openings and advance only round-owned RNG', () => {
  const rounds = [playing(), playing()];
  for (const round of rounds) for (let i = 0; i < 210; i++) cruise(round);
  assert.deepEqual(rounds[0], rounds[1]);
  assert.notEqual(rounds[0].rngState, CONFIG.initialSeed);
  // Published xorshift32 seed fixture, independently calculated for this seed.
  assert.equal(rounds[0].rngState, 3388403996);
  assert.equal(createRound().rngState, CONFIG.initialSeed);
});

test('FR-03: known extreme samples obey global and previous-gap reachability bounds', () => {
  for (const previous of [75, 180, 287]) {
    for (const sample of [0, 0.5, 1 - Number.EPSILON]) {
      const round = playing();
      round.previousGapTop = previous;
      round.activeTick = 209;
      let calls = 0;
      step(round, [], CONFIG, () => { calls++; return sample; });
      const gap = round.pairs[0].gapTop;
      const lower = Math.max(75, previous - 60);
      const upper = Math.min(287, previous + 60);
      assert.ok(gap >= lower && gap <= upper);
      if (sample === 0) assert.equal(gap, lower);
      if (sample > 0.99) assert.ok(gap > upper - 1);
      assert.equal(round.previousGapTop, gap);
      assert.equal(calls, 1);
    }
  }
});

test('FR-03: retire only when pair right edge is strictly negative', () => {
  const round = playing();
  round.pairs = [pair(-62.7, 180, 1), pair(-62.7001, 180, 2)];
  step(round);
  assert.deepEqual(round.pairs.map(p => p.id), [1]);
  near(round.pairs[0].x + 64, 0);
  step(round);
  assert.deepEqual(round.pairs, []);
});

test('FR-03 NFR-03: obstacle samples are drawn only on active spawn ticks and injection preserves RNG', () => {
  const round = playing();
  round.activeTick = 208;
  let calls = 0;
  const random = () => { calls++; return 0.5; };
  step(round, [], CONFIG, random);
  assert.equal(calls, 0);
  api('pauseRound')(round);
  step(round, [], CONFIG, random);
  assert.equal(calls, 0);
  api('startOrFlap')(round);
  step(round, [], CONFIG, random);
  assert.equal(calls, 1);
  assert.equal(round.rngState, CONFIG.initialSeed);
  assert.deepEqual(round.pairs, [{
    id: 1, x: 398.7, width: 64, gapTop: 180, gapHeight: 164, scored: false,
  }]);
  step(round, [], CONFIG, random);
  assert.equal(calls, 1);
  assert.equal(round.nextPairId, 2);
  assert.equal(round.nextSpawnTick, 420);
});

// Bird velocity cancels this tick's gravity, making pipe-edge fixtures exact.
for (const [label, gapTop, y, fatal] of [
  ['upper exact contact', 248, 248, true],
  ['upper overlap', 249, 248, true],
  ['upper clear', 247.999, 248, false],
  ['lower exact contact', 112, 248, true],
  ['lower overlap', 111.999, 248, true],
  ['lower clear', 112.001, 248, false],
]) {
  test(`FR-05: pipe ${label}`, () => {
    const round = playing();
    round.bird.y = y;
    round.bird.velocityY = -12.6;
    round.pairs = [pair(90, gapTop)];
    step(round);
    assert.equal(round.phase, fatal ? 'game-over' : 'playing');
  });
}
for (const [label, y, velocity, fatal] of [
  ['ceiling exact', 1, -132.6, true],
  ['ceiling crossing', 1, -252.6, true],
  ['ceiling initial overlap', 0, 100, true],
  ['ceiling clear', 1.001, -132.6, false],
  ['ground exact', 497, 107.4, true],
  ['ground crossing', 497, 227.4, true],
  ['ground initial overlap', 499, -100, true],
  ['ground clear', 496.999, 107.4, false],
]) {
  test(`FR-05 FR-10: ${label} is handled with valid stored position`, () => {
    const round = playing();
    round.bird.y = y;
    round.bird.velocityY = velocity;
    step(round);
    assert.equal(round.phase, fatal ? 'game-over' : 'playing');
    assert.ok(round.bird.y >= 0 && round.bird.y + 28 <= 526);
  });
}

test('FR-05: swept moving pipe crosses bird although both endpoints are disjoint', () => {
  const round = playing();
  round.pairs = [pair(150, 270)];
  step(round, [], createConfig({ pipeSpeed: 30000 }));
  assert.equal(round.phase, 'game-over');
});

test('FR-05: swept upward bird hits pipe without touching the ceiling', () => {
  const round = playing();
  round.bird.y = 300;
  round.bird.velocityY = -24012.6;
  round.pairs = [pair(90, 250)];
  step(round);
  assert.equal(round.phase, 'game-over');
});

// Pure helper seam: inclusive swept rectangles, relative displacement in pixels.
for (const [label, a, b, da, db, expected] of [
  ['initial overlap moving apart', { x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 }, { x: -30, y: 0 }, { x: 30, y: 0 }, true],
  ['zero relative velocity touching', { x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 10, height: 10 }, { x: 2, y: 3 }, { x: 2, y: 3 }, true],
  ['zero relative velocity separated', { x: 0, y: 0, width: 10, height: 10 }, { x: 11, y: 0, width: 10, height: 10 }, { x: 2, y: 3 }, { x: 2, y: 3 }, false],
  ['crossing with separated perpendicular axis', { x: 0, y: 0, width: 10, height: 10 }, { x: 20, y: 11, width: 10, height: 10 }, { x: 40, y: 0 }, { x: 0, y: 0 }, false],
]) {
  test(`FR-05: swept AABB ${label}`, () => {
    assert.equal(api('sweptAabb')(a, b, da, db), expected);
  });
}

test('FR-05 FR-07 FR-10: one terminal transition freezes all subsequent steps and inputs', () => {
  const round = playing();
  round.bird.y = 497;
  round.bird.velocityY = 1000;
  step(round);
  assert.equal(round.phase, 'game-over');
  assert.equal(round.activeTick, 1);
  const terminal = structuredClone(round);
  for (let i = 0; i < 10; i++) {
    api('startOrFlap')(round);
    step(round, [{ type: 'flap' }]);
    api('pauseRound')(round);
  }
  assert.deepEqual(round, terminal);
});

for (const [label, x, fatal] of [
  ['horizontal exact leading edge', 125.3, true],
  ['horizontal just outside leading edge', 125.301, false],
  ['horizontal initial trailing edge', 26, true],
  ['horizontal just past trailing edge', 25.999, false],
]) {
  test(`FR-05: pipe ${label}`, () => {
    const round = playing();
    round.bird.velocityY = -12.6;
    round.pairs = [pair(x, 270)];
    step(round);
    assert.equal(round.phase, fatal ? 'game-over' : 'playing');
  });
}

test('FR-05: swept relative motion catches crossing with disjoint endpoints', () => {
  assert.equal(api('sweptAabb')(
    { x: 0, y: 0, width: 10, height: 10 },
    { x: 30, y: 0, width: 10, height: 10 },
    { x: 20, y: 0 }, { x: -30, y: 0 },
  ), true);
});

test('FR-05: swept axes must overlap at the same time rather than separately', () => {
  assert.equal(api('sweptAabb')(
    { x: 0, y: 0, width: 10, height: 10 },
    { x: 30, y: 50, width: 10, height: 10 },
    { x: 100, y: 50 }, { x: 0, y: 0 },
  ), false);
});

test('FR-05 FR-10: earliest contact discards remaining movement and preserves score', () => {
  const round = playing();
  round.score = 3;
  round.bird.velocityY = -12.6;
  // Later hazard is deliberately first in the collection.
  round.pairs = [pair(200, 270, 1), pair(150, 270, 2), pair(0, 180, 3)];
  step(round, [], createConfig({ pipeSpeed: 30000 }));
  assert.equal(round.phase, 'game-over');
  near(round.pairs[1].x, 124);
  near(round.pairs[0].x, 174);
  near(round.bird.y, 248);
  assert.equal(round.score, 3);
  assert.ok(round.pairs.every(p => !p.scored));
  const terminal = structuredClone(round);
  assert.equal(step(round), false);
  assert.deepEqual(round, terminal);
});

test('FR-05 FR-10: ground contact stops bird and pipes at the same fractional time', () => {
  const round = playing();
  round.bird.y = 497;
  round.bird.velocityY = 227.4;
  round.pairs = [pair(300)];
  step(round);
  assert.equal(round.phase, 'game-over');
  near(round.bird.y, 498);
  near(round.pairs[0].x, 299.35);
});

test('FR-05: newly spawned lower pipe can sweep through bird before retirement', () => {
  const round = playing();
  round.activeTick = 209;
  round.bird.y = 400;
  round.bird.velocityY = -12.6;
  step(round, [], createConfig({ pipeSpeed: 120000 }), () => 0.5);
  assert.equal(round.phase, 'game-over');
  assert.equal(round.activeTick, 210);
  assert.equal(round.pairs.length, 1);
  near(round.pairs[0].x, 124);
});

for (const [label, offset, expected] of [['before', 0.001, 0], ['equal', 0, 0], ['after', -0.001, 1]]) {
  test(`FR-06: strict pass boundary ${label} awards ${expected}`, () => {
    const round = playing();
    round.bird.velocityY = -CONFIG.gravity * CONFIG.stepSeconds;
    round.pairs = [pair(90 - 64 + CONFIG.pipeSpeed * CONFIG.stepSeconds + offset)];
    step(round);
    assert.equal(round.phase, 'playing');
    assert.equal(round.score, expected);
    assert.equal(round.pairs[0].scored, Boolean(expected));
  });
}

test('FR-06: upper and lower pipes count as one pair across repeated steps and retirement', () => {
  const round = playing();
  round.pairs = [pair(25)];
  for (let tick = 0; tick < 80; tick++) cruise(round, () => 0.5);
  assert.equal(round.score, 1);
  assert.equal(round.pairs.length, 0);
});

test('FR-06: simultaneous passes score each unscored pair before retirement', () => {
  const round = playing();
  round.pairs = [pair(25, 180, 1), pair(-64, 180, 2), { ...pair(0, 180, 3), scored: true }];
  step(round);
  assert.equal(round.score, 2);
  assert.deepEqual(round.pairs.map(p => [p.id, p.scored]), [[1, true], [3, true]]);
  step(round);
  assert.equal(round.score, 2);
});

for (const hazard of ['pipe', 'ceiling', 'ground']) {
  test(`FR-05 FR-06: ${hazard} collision suppresses every potential point`, () => {
    for (const reverse of [false, true]) {
      const round = playing();
      round.score = 3;
      round.pairs = [pair(25, 180, 1), pair(-64, 180, 2)];
      if (hazard === 'pipe') round.pairs.push(pair(124.5, 270, 3));
      if (hazard === 'ceiling') { round.bird.y = 1; round.bird.velocityY = -450; }
      if (hazard === 'ground') { round.bird.y = 497; round.bird.velocityY = 450; }
      if (reverse) round.pairs.reverse();
      step(round);
      assert.equal(round.phase, 'game-over');
      assert.equal(round.score, 3);
      assert.ok(round.pairs.every(p => !p.scored));
      const ended = structuredClone(round);
      step(round);
      assert.deepEqual(round, ended);
    }
  });
}

for (const count of [0, 1, 10]) {
  test(`FR-06 SC-02: controlled legal trajectory clears exactly ${count} pairs`, () => {
    const round = playing();
    // A fixed legal opening stream keeps the traversal independent of random luck.
    while (round.score < count && round.activeTick < 3000) {
      cruise(round, () => 0.5);
      assert.ok(Number.isInteger(round.score) && round.score >= 0);
    }
    assert.equal(round.score, count);
    while (round.phase === 'playing') step(round);
    assert.equal(round.score, count);
  });
}

for (const phase of ['ready', 'playing', 'paused', 'game-over']) {
  test(`FR-04 FR-07 NFR-03: restart from ${phase} restores all round state with immediate flap`, async () => {
    const { restartRound, stepRound } = await import('../simulation.js');
    const old = createRound();
    Object.assign(old, { phase, score: 8, activeTick: 500, rngState: 123,
      nextPairId: 9, nextSpawnTick: 630, previousGapTop: 90 });
    old.pairs.push({ id: 8 }); old.bird.y = 400;
    const before = structuredClone(old);
    const fresh = restartRound();
    assert.deepEqual(fresh, { ...createRound(), phase: 'playing',
      bird: { ...createRound().bird, velocityY: CONFIG.flapVelocity } });
    assert.deepEqual(old, before);
    stepRound(fresh);
    assert.equal(fresh.activeTick, 1);
    assert.equal(fresh.bird.velocityY, CONFIG.flapVelocity + CONFIG.gravity * CONFIG.stepSeconds);
    stepRound(fresh, CONFIG, [{ type: 'flap' }]);
    assert.equal(fresh.bird.velocityY, CONFIG.flapVelocity + CONFIG.gravity * CONFIG.stepSeconds);
  });
}
