import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../config.js';
import * as simulation from '../simulation.js';

// T006 proposed seams for T010 (no production implementation in this task):
// bindInput({ keyboard, window, document, gameArea, button },
//   { gameplay, pause, clear }, { isFocused, isVisible }) -> dispose().
// Gameplay is normalized once; native button click is its sole activation path.
// createLoop({ step, render, clock, requestFrame, cancelFrame, isPlaying }) ->
// { start, dispose, resetTiming, enqueue(input, tick), clearInput }.
// step(inputsForTick) returns false after loss; tick targets start at 1.
// resetTiming clears backlog/origin, clearInput drops the pending tick queue.
// Only absence of game.js is expected in this red-test phase; other import errors
// remain fatal, so a broken future module cannot masquerade as missing exports.
let game = {};
try { game = await import('../game.js'); }
catch (error) {
  if (error.code !== 'ERR_MODULE_NOT_FOUND' || !error.url?.endsWith('/game.js')) throw error;
}
function api(name) {
  assert.equal(typeof game[name], 'function', `Missing production game.${name} (T010)`);
  return game[name];
}

// Deliberately tiny event target: stores callbacks, models bubbling only, and
// never implements input filtering, normalization or synthetic native activation.
function target(parent = null) {
  const listeners = new Map();
  return {
    parent,
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
    dispatch(type, fields = {}) {
      const event = {
        type, target: this, currentTarget: this, bubbles: true,
        defaultPrevented: false, propagationStopped: false,
        preventDefault() { this.defaultPrevented = true; },
        stopPropagation() { this.propagationStopped = true; },
        ...fields,
      };
      let current = this;
      while (current) {
        event.currentTarget = current;
        current.deliver(event);
        if (!event.bubbles || event.propagationStopped) break;
        current = current.parent;
      }
      return event;
    },
    deliver(event) {
      for (const fn of [...(listeners.get(event.type) ?? [])]) fn(event);
    },
    listenerCount() { return [...listeners.values()].reduce((sum, set) => sum + set.size, 0); },
  };
}
function inputFixture(onGameplay = () => {}) {
  const window = target();
  const document = target();
  const keyboard = document;
  const gameArea = target();
  const button = target(gameArea); // Deliberate ancestor to exercise bubbling.
  const targets = { keyboard, window, document, gameArea, button };
  let focused = true;
  let visible = true;
  const calls = [];
  const availability = { isFocused: () => focused, isVisible: () => visible };
  const dispose = api('bindInput')(targets, {
    gameplay() { calls.push('flap'); onGameplay(); },
    pause: () => calls.push('pause'),
    clear: () => calls.push('clear'),
  }, availability);
  return {
    ...targets, calls, dispose,
    focus(value) { focused = value; window.dispatch(value ? 'focus' : 'blur'); },
    visible(value) { visible = value; document.dispatch('visibilitychange'); },
    count() { return calls.filter(c => c === 'flap').length; },
    listeners() { return new Set(Object.values(targets)); },
  };
}
function gesture(area, pointerType = 'mouse', pointerId = 1) {
  area.dispatch('pointerdown', { pointerType, pointerId, button: 0, isPrimary: true });
  area.dispatch('pointerup', { pointerType, pointerId, button: 0, isPrimary: true });
  area.dispatch('click', { pointerType, pointerId, button: 0, detail: 1 });
}
function scheduler() {
  let now = 0;
  let nextId = 0;
  const pending = new Map();
  return {
    clock: () => now,
    requestFrame(fn) { const id = ++nextId; pending.set(id, fn); return id; },
    cancelFrame(id) { pending.delete(id); },
    frame(timestamp) {
      now = timestamp;
      const callbacks = [...pending.values()];
      pending.clear();
      for (const callback of callbacks) callback(timestamp);
    },
    pending: () => pending.size,
  };
}
function loopFixture(step = () => true) {
  const timing = scheduler();
  let active = true;
  const seen = [];
  const renders = [];
  const loop = api('createLoop')({
    clock: timing.clock, requestFrame: timing.requestFrame, cancelFrame: timing.cancelFrame,
    isPlaying: () => active,
    step(inputs) { seen.push([...inputs]); return step(inputs); },
    render() { renders.push(seen.length); },
  });
  loop.start();
  return { timing, loop, seen, renders, active(value) { active = value; } };
}

for (const phase of ['ready', 'paused']) {
  for (const method of ['Space', 'ArrowUp', 'mouse', 'touch', 'button']) {
    test(`FR-01 FR-02 FR-07 FR-08 FR-11: ${method} ${phase === 'ready' ? 'starts' : 'resumes'} with one flap`, () => {
      const round = simulation.createRound();
      round.phase = phase;
      if (phase === 'paused') {
        round.activeTick = 17;
        round.score = 2;
        round.bird.y = 260;
        round.bird.velocityY = 100;
        round.rngState = 123;
      }
      const before = structuredClone(round);
      const pending = [];
      const fixture = inputFixture(() => {
        assert.equal(typeof simulation.startOrFlap, 'function', 'Missing T007 startOrFlap');
        simulation.startOrFlap(round);
        pending.push({ type: 'flap' });
      });
      if (method === 'Space' || method === 'ArrowUp') fixture.keyboard.dispatch('keydown', { code: method, repeat: false });
      else if (method === 'button') fixture.button.dispatch('click', { detail: 0 });
      else gesture(fixture.gameArea, method);
      assert.equal(fixture.count(), 1);
      assert.deepEqual(round, { ...before, phase: 'playing' });
      assert.deepEqual(pending, [{ type: 'flap' }]);
      assert.equal(typeof simulation.stepRound, 'function', 'Missing T007 stepRound');
      simulation.stepRound(round, CONFIG, pending);
      assert.equal(round.phase, 'playing');
      assert.equal(round.activeTick, before.activeTick + 1);
      assert.ok(Math.abs(round.bird.velocityY + 437.4) < 1e-9);
      fixture.dispose();
    });
  }
}

test('FR-01 FR-02 FR-08: held keys suppressed independently, repeats ignored, release allows next press', () => {
  const f = inputFixture();
  f.keyboard.dispatch('keydown', { code: 'Space', repeat: false });
  f.keyboard.dispatch('keydown', { code: 'Space', repeat: true });
  f.keyboard.dispatch('keydown', { code: 'Space', repeat: false });
  f.keyboard.dispatch('keydown', { code: 'ArrowUp', repeat: false });
  assert.equal(f.count(), 2);
  f.keyboard.dispatch('keyup', { code: 'Space' });
  f.keyboard.dispatch('keydown', { code: 'Space', repeat: false });
  assert.equal(f.count(), 3);
  f.keyboard.dispatch('keyup', { code: 'ArrowUp' });
  f.keyboard.dispatch('keydown', { code: 'ArrowUp', repeat: true });
  assert.equal(f.count(), 3);
  f.dispose();
});

test('FR-01 FR-08: gameplay keys prevent defaults including repeats; Tab/Enter retain native activation', () => {
  const f = inputFixture();
  for (const code of ['Space', 'ArrowUp']) {
    for (const repeat of [false, true]) {
      const event = f.keyboard.dispatch('keydown', { code, repeat, target: f.button });
      assert.equal(event.defaultPrevented, true);
    }
  }
  const count = f.count();
  for (const code of ['Tab', 'Enter']) {
    assert.equal(f.keyboard.dispatch('keydown', { code, target: f.button }).defaultPrevented, false);
  }
  assert.equal(f.count(), count); // Browser, rather than key handler, owns Enter click.
  f.button.dispatch('click', { detail: 0 });
  assert.equal(f.count(), count + 1);
  f.dispose();
});

for (const pointerType of ['mouse', 'touch']) {
  test(`FR-01 FR-08: ${pointerType} compatibility events and button bubbling produce one action per gesture`, () => {
    const f = inputFixture();
    gesture(f.gameArea, pointerType);
    f.gameArea.dispatch('mousedown', { button: 0 });
    f.gameArea.dispatch('mouseup', { button: 0 });
    assert.equal(f.count(), 1);
    gesture(f.button, pointerType, 2);
    assert.equal(f.count(), 2);
    gesture(f.gameArea, pointerType, 3);
    assert.equal(f.count(), 3);
    f.dispose();
  });
}

test('FR-01 FR-08: native clicks activate even when isPrimary is false', () => {
  const f = inputFixture();
  f.gameArea.dispatch('click', { button: 0, isPrimary: false });
  f.button.dispatch('click', { button: 0, isPrimary: false, detail: 0 });
  assert.equal(f.count(), 2);
  f.dispose();
});

test('FR-01 FR-08: secondary mouse buttons ignored and pointer cancellation permits next tap', () => {
  const f = inputFixture();
  for (const type of ['pointerdown', 'pointerup', 'click']) {
    f.gameArea.dispatch(type, { pointerType: 'mouse', pointerId: 1, button: 2, isPrimary: true });
  }
  assert.equal(f.count(), 0);
  // A cancelled pointer must not leave state blocking the next complete tap.
  f.gameArea.dispatch('pointerdown', { pointerType: 'touch', pointerId: 2, button: 0, isPrimary: true });
  f.gameArea.dispatch('pointercancel', { pointerType: 'touch', pointerId: 2 });
  const before = f.count(); // down-vs-up activation is an implementation choice.
  gesture(f.gameArea, 'touch', 3);
  assert.equal(f.count(), before + 1);
  f.dispose();
});

for (const restore of ['focus-first', 'visibility-first']) {
  test(`FR-11: ${restore} restoration remains paused; input requires both guards`, () => {
    const f = inputFixture();
    f.focus(false);
    f.visible(false);
    assert.ok(f.calls.includes('pause'));
    assert.ok(f.calls.includes('clear'));
    if (restore === 'focus-first') f.focus(true);
    else f.visible(true);
    f.keyboard.dispatch('keydown', { code: 'Space', repeat: false });
    gesture(f.gameArea, 'touch');
    f.button.dispatch('click', { detail: 0 });
    assert.equal(f.count(), 0);
    if (restore === 'focus-first') f.visible(true);
    else f.focus(true);
    assert.equal(f.count(), 0);
    f.keyboard.dispatch('keyup', { code: 'Space' });
    f.keyboard.dispatch('keydown', { code: 'Space', repeat: false });
    assert.equal(f.count(), 1);
    f.dispose();
  });
}

for (const loss of ['blur', 'hidden']) {
  test(`FR-11: ${loss} clears held keys and pointer state and requests backlog/input clearing`, () => {
    const f = inputFixture();
    f.keyboard.dispatch('keydown', { code: 'Space', repeat: false });
    f.gameArea.dispatch('pointerdown', { pointerType: 'touch', pointerId: 1, button: 0, isPrimary: true });
    const beforeLoss = f.calls.length;
    if (loss === 'blur') f.focus(false);
    else f.visible(false);
    const lossCalls = f.calls.slice(beforeLoss);
    assert.ok(lossCalls.includes('pause'));
    assert.ok(lossCalls.includes('clear'));
    if (loss === 'blur') f.focus(true);
    else f.visible(true);
    const before = f.count();
    f.keyboard.dispatch('keydown', { code: 'Space', repeat: false });
    gesture(f.gameArea, 'touch', 1);
    assert.equal(f.count(), before + 2);
    f.dispose();
  });
}

test('FR-02 NFR-03: two distinct inputs target one tick, preserve FIFO, drain once and do not accumulate impulse', () => {
  const f = loopFixture();
  const first = { type: 'flap', source: 'Space' };
  const second = { type: 'flap', source: 'ArrowUp' };
  f.loop.enqueue(first, 1);
  f.loop.enqueue(second, 1);
  f.timing.frame(0);
  assert.equal(f.seen.length, 0);
  f.timing.frame(9);
  assert.deepEqual(f.seen, [[first, second]]);
  f.timing.frame(18);
  assert.deepEqual(f.seen, [[first, second], []]);
  assert.equal(typeof simulation.stepRound, 'function', 'Missing T007 stepRound');
  const round = simulation.createRound();
  round.phase = 'playing';
  simulation.stepRound(round, CONFIG, f.seen[0]);
  assert.ok(Math.abs(round.bird.velocityY + 437.4) < 1e-9);
  simulation.stepRound(round, CONFIG, f.seen[1]);
  assert.ok(Math.abs(round.bird.velocityY + 424.8) < 1e-9);
  f.loop.dispose();
});

test('FR-02 NFR-03: future tick input is neither consumed early nor carried past its tick', () => {
  const f = loopFixture();
  const input = { type: 'flap', source: 'touch' };
  f.loop.enqueue(input, 2);
  f.timing.frame(0);
  f.timing.frame(26);
  assert.deepEqual(f.seen, [[], [input], []]);
  f.loop.dispose();
});

test('NFR-03: 30-step callback cap retains visible backlog and renders after each batch', () => {
  const f = loopFixture();
  f.timing.frame(0);
  f.timing.frame(1000);
  assert.equal(f.seen.length, 30);
  f.timing.frame(1000);
  assert.equal(f.seen.length, 60);
  f.timing.frame(1000);
  assert.equal(f.seen.length, 90);
  f.timing.frame(1000);
  assert.equal(f.seen.length, 120);
  f.timing.frame(1000);
  assert.equal(f.seen.length, 120);
  assert.deepEqual(f.renders, [0, 30, 60, 90, 120, 120]);
  f.loop.dispose();
});

test('FR-07 FR-11 NFR-03: pause clears backlog/queue and resume uses fresh clock origin', () => {
  const f = loopFixture();
  f.timing.frame(0);
  f.timing.frame(1000);
  assert.equal(f.seen.length, 30);
  f.loop.enqueue({ type: 'flap' }, 31);
  f.active(false);
  f.loop.clearInput();
  f.loop.resetTiming();
  f.timing.frame(60000);
  assert.equal(f.seen.length, 30);
  f.active(true);
  f.loop.resetTiming();
  f.timing.frame(120000);
  assert.equal(f.seen.length, 30);
  f.timing.frame(120009);
  assert.deepEqual(f.seen.slice(30), [[]]);
  f.loop.dispose();
});

for (const phase of ['ready', 'paused', 'game-over']) {
  test(`FR-07 NFR-03: inactive ${phase} does not accumulate simulation time`, () => {
    const f = loopFixture();
    f.active(false);
    f.timing.frame(0);
    f.timing.frame(60000);
    assert.equal(f.seen.length, 0);
    assert.equal(f.renders.length, 2);
    f.active(true);
    f.loop.resetTiming();
    f.timing.frame(60001);
    f.timing.frame(60010);
    assert.equal(f.seen.length, 1);
    f.loop.dispose();
  });
}

test('FR-05 FR-07: terminal step stops later backlog steps within the same callback', () => {
  const f = loopFixture(() => false);
  f.timing.frame(0);
  f.timing.frame(1000);
  assert.equal(f.seen.length, 1);
  assert.equal(f.renders.at(-1), 1);
  f.loop.dispose();
});

test('NFR-03: repeated start/reset retains one animation chain; disposal cancels it', () => {
  const f = loopFixture();
  for (let i = 0; i < 5; i++) { f.loop.start(); f.loop.resetTiming(); }
  assert.equal(f.timing.pending(), 1);
  f.timing.frame(0);
  assert.equal(f.timing.pending(), 1);
  f.loop.dispose();
  f.loop.dispose();
  assert.equal(f.timing.pending(), 0);
  const renders = f.renders.length;
  f.timing.frame(1000);
  assert.equal(f.renders.length, renders);
});

test('FR-08 NFR-03: input disposal removes every listener and leaves no actions', () => {
  const f = inputFixture();
  assert.ok([...f.listeners()].some(t => t.listenerCount() > 0));
  f.dispose();
  f.dispose();
  for (const t of f.listeners()) assert.equal(t.listenerCount(), 0);
  f.keyboard.dispatch('keydown', { code: 'Space', repeat: false });
  gesture(f.gameArea, 'touch');
  f.button.dispatch('click', { detail: 0 });
  f.focus(false);
  f.visible(false);
  assert.deepEqual(f.calls, []);
});

test('FR-01 FR-02 NFR-03: two distinct key presses before a frame enter the same tick FIFO', () => {
  const f = loopFixture();
  const keyboard = target();
  const tokens = [{ type: 'flap', source: 'Space' }, { type: 'flap', source: 'ArrowUp' }];
  let accepted = 0;
  const dispose = api('bindInput')({
    keyboard, document: keyboard, window: target(), gameArea: target(), button: target(),
  }, {
    gameplay() { f.loop.enqueue(tokens[accepted++], 1); },
    pause() {}, clear() { f.loop.clearInput(); f.loop.resetTiming(); },
  }, { isFocused: () => true, isVisible: () => true });
  f.timing.frame(0);
  keyboard.dispatch('keydown', { code: 'Space', repeat: false });
  keyboard.dispatch('keydown', { code: 'ArrowUp', repeat: false });
  assert.equal(accepted, 2);
  f.timing.frame(9);
  assert.deepEqual(f.seen, [[tokens[0], tokens[1]]]);
  f.timing.frame(18);
  assert.deepEqual(f.seen[1], []);
  dispose();
  f.loop.dispose();
});

test('FR-11 NFR-03: input focus loss actually clears loop backlog and pending flap', () => {
  let focused = true;
  const f = loopFixture();
  const window = target();
  const keyboard = target();
  const dispose = api('bindInput')({
    keyboard, document: keyboard, window, gameArea: target(), button: target(),
  }, {
    gameplay() { f.loop.enqueue({ type: 'flap' }, f.seen.length + 1); },
    pause() { f.active(false); },
    clear() { f.loop.clearInput(); f.loop.resetTiming(); },
  }, { isFocused: () => focused, isVisible: () => true });
  f.timing.frame(0);
  f.timing.frame(1000);
  assert.equal(f.seen.length, 30);
  keyboard.dispatch('keydown', { code: 'Space', repeat: false });
  focused = false;
  window.dispatch('blur');
  f.timing.frame(60000);
  focused = true;
  window.dispatch('focus');
  f.timing.frame(60009);
  assert.equal(f.seen.length, 30);
  f.active(true);
  f.loop.resetTiming();
  f.timing.frame(70000);
  f.timing.frame(70009);
  assert.deepEqual(f.seen.slice(30), [[]]);
  dispose();
  f.loop.dispose();
});

test('NFR-03: clock regression cannot replay elapsed time; stale tick inputs are rejected', () => {
  const f = loopFixture();
  f.timing.frame(100);
  f.timing.frame(109);
  assert.equal(f.seen.length, 1);
  f.timing.frame(50);
  f.timing.frame(109);
  assert.equal(f.seen.length, 1);
  assert.throws(() => f.loop.enqueue({ type: 'flap' }, 1), RangeError);
  f.timing.frame(118);
  assert.equal(f.seen.length, 2);
  f.loop.dispose();
});

test('FR-02 FR-11 NFR-03: explicit input reset clears held keys and rebases fresh-round tick queue', () => {
  const input = inputFixture();
  input.keyboard.dispatch('keydown', { code: 'Space' });
  input.dispose.clear();
  input.keyboard.dispatch('keydown', { code: 'Space' });
  assert.equal(input.count(), 2);
  input.dispose();
  const f = loopFixture();
  f.timing.frame(0);
  f.timing.frame(9);
  f.loop.enqueue({ type: 'flap', source: 'stale' });
  f.loop.clearInput(1);
  f.loop.resetTiming();
  const fresh = { type: 'flap', source: 'fresh' };
  f.loop.enqueue(fresh, 1);
  f.timing.frame(1000);
  f.timing.frame(1009);
  assert.deepEqual(f.seen, [[], [fresh]]);
  f.loop.dispose();
});

test('NFR-03: browser initialization is DOM-safe and waits for page readiness', () => {
  let initialized = 0;
  game.initializeBrowser(() => initialized++, null)();
  assert.equal(initialized, 0);
  const page = target();
  page.readyState = 'loading';
  const cancel = game.initializeBrowser(actual => {
    assert.equal(actual, page);
    initialized++;
  }, page);
  assert.equal(initialized, 0);
  page.dispatch('DOMContentLoaded');
  assert.equal(initialized, 1);
  cancel();
  assert.equal(page.listenerCount(), 0);
  page.readyState = 'complete';
  game.initializeBrowser(() => initialized++, page);
  assert.equal(initialized, 2);
});

function pageFixture() {
  const page = target();
  page.defaultView = target();
  page.hidden = false;
  page.hasFocus = () => true;
  const elements = Object.fromEntries(['game-canvas', 'playfield', 'game-button',
    'retry-button', 'score', 'status', 'instructions'].map(id => [id, target()]));
  elements['game-canvas'].getContext = () => ({});
  page.getElementById = id => elements[id];
  const timing = scheduler();
  const frames = [];
  const dispose = api('mountGame')(page, {
    ...timing,
    draw(context, round) { frames.push(structuredClone(round)); },
  });
  return { page, elements, timing, frames, dispose };
}

for (const method of ['Space', 'ArrowUp', 'mouse', 'touch', 'button']) {
  test(`FR-01 FR-02 FR-07 FR-11: composed ${method} start and resume render and apply one flap`, () => {
    const f = pageFixture();
    const activate = () => {
      if (method === 'button') f.elements['game-button'].dispatch('click');
      else if (method === 'mouse' || method === 'touch') gesture(f.elements.playfield, method);
      else f.page.dispatch('keydown', { code: method });
    };
    assert.equal(f.frames.at(-1).phase, 'ready');
    assert.equal(f.elements.score.textContent, '0');
    assert.equal(f.elements['game-button'].textContent, 'Start game');
    activate();
    assert.equal(f.frames.at(-1).phase, 'playing');
    f.timing.frame(0);
    f.timing.frame(9);
    assert.equal(f.frames.at(-1).activeTick, 1);
    assert.ok(Math.abs(f.frames.at(-1).bird.velocityY + 437.4) < 1e-9);
    f.page.defaultView.dispatch('blur');
    const paused = f.frames.at(-1);
    assert.equal(paused.phase, 'paused');
    assert.equal(f.elements['game-button'].textContent, 'Resume game');
    f.page.defaultView.dispatch('focus');
    f.timing.frame(60000);
    assert.deepEqual(f.frames.at(-1), paused);
    activate();
    f.timing.frame(120000);
    f.timing.frame(120009);
    assert.equal(f.frames.at(-1).activeTick, 2);
    assert.ok(Math.abs(f.frames.at(-1).bird.velocityY + 437.4) < 1e-9);
    f.dispose();
    assert.equal(f.timing.pending(), 0);
    assert.equal(f.page.listenerCount(), 0);
  });
}

test('FR-03 FR-05 FR-07 FR-10 FR-11: composed hidden pause and loss freeze the rendered round', () => {
  const f = pageFixture();
  f.elements['game-button'].dispatch('click');
  f.page.hidden = true;
  f.page.dispatch('visibilitychange');
  assert.equal(f.frames.at(-1).phase, 'paused');
  f.page.hidden = false;
  f.page.dispatch('visibilitychange');
  assert.equal(f.frames.at(-1).phase, 'paused');
  f.elements['game-button'].dispatch('click');
  f.timing.frame(0);
  for (let time = 100; time <= 4000; time += 100) f.timing.frame(time);
  const ended = f.frames.at(-1);
  assert.equal(ended.phase, 'game-over');
  assert.equal(f.elements['retry-button'].hidden, false);
  assert.match(f.elements.status.textContent, /Final score: 0/);
  f.page.dispatch('keydown', { code: 'Space' });
  gesture(f.elements.playfield);
  f.timing.frame(60000);
  assert.deepEqual(f.frames.at(-1), ended);
  assert.equal(f.timing.pending(), 1);
  f.dispose();
});
