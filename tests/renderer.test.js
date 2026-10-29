import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../config.js';
import { createRound } from '../simulation.js';
import { render } from '../renderer.js';

// Record Canvas commands without emulating a DOM or rasterizer.
function recordingContext() {
  const commands = [];
  const context = { commands };
  for (const name of ['save', 'restore', 'setTransform', 'beginPath', 'rect',
    'clip', 'fillRect', 'fillText']) {
    context[name] = (...args) => commands.push([name, ...args]);
  }
  return context;
}

test('FR-07–FR-09: each render derives overlay and score from the current round', () => {
  const round = createRound();
  const context = recordingContext();
  for (const [phase, title] of [['ready', 'READY TO FLY'], ['paused', 'FLIGHT PAUSED'],
    ['game-over', 'GAME OVER'], ['playing', null]]) {
    round.phase = phase;
    round.score = 10;
    context.commands.length = 0;
    render(context, round);
    const texts = context.commands.filter(command => command[0] === 'fillText').map(command => command[1]);
    assert.ok(texts.includes('10'));
    if (title) assert.ok(texts.includes(title));
    else assert.ok(!texts.some(text => ['READY TO FLY', 'FLIGHT PAUSED', 'GAME OVER'].includes(text)));
  }
});

test('FR-05/FR-10: bird and pipe artwork uses full shared collision rectangles', () => {
  const round = createRound();
  round.phase = 'playing';
  round.pairs.push({ x: 240, width: 64, gapTop: 100, gapHeight: 164 });
  const context = recordingContext();
  render(context, round);
  for (const rectangle of [[90, 248, 34, 28], [240, 0, 64, 100], [240, 264, 64, 262]]) {
    assert.ok(context.commands.some(command => command[0] === 'fillRect' &&
      command.slice(1).every((value, index) => value === rectangle[index])));
    assert.ok(context.commands.some(command => command[0] === 'rect' &&
      command.slice(1).every((value, index) => value === rectangle[index])));
  }
  assert.ok(context.commands.some(command => command[0] === 'fillRect' &&
    command[2] === CONFIG.groundY && command[4] === CONFIG.height - CONFIG.groundY));
});

test('FR-08/NFR-03: cosmetic time changes drawing without mutating frozen round or consuming RNG', () => {
  const round = createRound();
  round.pairs.push({ x: 240, width: 64, gapTop: 100, gapHeight: 164 });
  const before = structuredClone(round);
  function freeze(value) {
    for (const child of Object.values(value)) if (child && typeof child === 'object') freeze(child);
    return Object.freeze(value);
  }
  freeze(round);
  const first = recordingContext();
  const later = recordingContext();
  render(first, round, CONFIG, 0);
  render(later, round, CONFIG, 500);
  assert.notDeepEqual(first.commands, later.commands);
  assert.deepEqual(round, before);
});
