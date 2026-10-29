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
