import { CONFIG } from '../../config.js';
import { createRound, restartRound, stepRound, sweptAabb } from '../../simulation.js';
import { mountGame, createLoop } from '../../game.js';
import { render } from '../../renderer.js';
import { scriptedFlight, traversalInput } from '../trajectory.js';

const element = id => document.getElementById(id);
const surface = element('surface');
surface.append(element('game-template').content.cloneNode(true));
const report = {
  date: new Date().toISOString(), userAgent: navigator.userAgent,
  viewport: [innerWidth, innerHeight], devicePixelRatio,
  screen: [screen.width, screen.height], assertions: [], errors: [], cycles: [],
  restartPresentation: 'INCOMPLETE: correlate restart-N performance marks with external presented-image evidence',
};
let busy = false;
function show() { element('results').textContent = JSON.stringify(report, null, 2); }
function check(condition, message) {
  if (!condition) throw Error(message);
  report.assertions.push(message);
}
window.addEventListener('error', event => { report.errors.push(event.message); show(); });
window.addEventListener('unhandledrejection', event => { report.errors.push(String(event.reason)); show(); });
const scoped = {
  defaultView: window,
  get hidden() { return document.hidden; }, hasFocus: () => document.hasFocus(),
  getElementById: id => surface.querySelector('#' + id),
  addEventListener: (...args) => document.addEventListener(...args),
  removeEventListener: (...args) => document.removeEventListener(...args),
};
const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));
async function run(action) {
  if (busy) return;
  busy = true;
  element('checks').disabled = element('performance').disabled = true;
  try { await action(); element('progress').textContent = 'Finished; review incomplete acceptance fields'; }
  catch (error) { report.errors.push(error.stack ?? String(error)); element('progress').textContent = 'FAILED'; }
  finally { busy = false; element('checks').disabled = element('performance').disabled = false; show(); }
}

async function cycles() {
  report.cycles = [];
  report.assertions = [];
  const script = scriptedFlight();
  const presses = new Set(script.presses);
  let live, now = 0, nextId = 0;
  const pending = new Map();
  // Inject scheduler only: DOM, inputs, simulation, HUD and artwork are production.
  const dispose = mountGame(scoped, {
    clock: () => now,
    requestFrame: callback => { const id = ++nextId; pending.set(id, callback); return id; },
    cancelFrame: id => pending.delete(id),
    draw(context, round) { live = round; render(context, round, CONFIG, performance.now()); },
  });
  function frame(timestamp) {
    now = timestamp;
    const callbacks = [...pending.values()]; pending.clear();
    for (const callback of callbacks) callback();
    if (pending.size !== 1) throw Error('Duplicate or missing animation chain');
  }
  try {
    // Native Canvas fixtures: strict score and collision precedence, using normal
    // collision checks. These are separate from the seeded 100-cycle trajectory.
    for (const count of [0, 1, 10]) {
      const fixture = restartRound();
      fixture.pairs = Array.from({ length: count }, (_, i) => ({
        id: i + 1, x: 24, width: 64, gapTop: 180, gapHeight: 164, scored: false,
      }));
      stepRound(fixture);
      check(fixture.score === count, `FR-06 strict-clear fixture ${count}`);
      render(scoped.getElementById('game-canvas').getContext('2d'), fixture);
    }
    for (const y of [0, CONFIG.groundY - CONFIG.birdHeight]) {
      const fixture = restartRound(); fixture.bird.y = y;
      fixture.pairs = [{ id: 1, x: 24, width: 64, gapTop: 180, gapHeight: 164, scored: false }];
      stepRound(fixture);
      check(fixture.phase === 'game-over' && fixture.score === 0, `FR-05 FR-10 boundary ${y} suppresses score`);
    }
    check(sweptAabb({ x: 0, y: 0, width: 1, height: 1 },
      { x: 10, y: 0, width: 1, height: 1 }, { x: 20, y: 0 }, { x: 0, y: 0 }), 'FR-05 swept crossing');
    // Do not store a per-tick assertion string in a 100-cycle report.
    report.assertions.push('FR-04 FR-06 NFR-03: every cycle compared at every tick');
    for (let cycle = 0; cycle < 100; cycle++) {
      element('progress').textContent = `Cycle ${cycle + 1} / 100`;
      const activation = performance.now();
      performance.mark(`restart-${cycle + 1}`);
      if (cycle === 0) dispose.restart();
      else scoped.getElementById(cycle % 2 ? 'game-button' : 'retry-button').click();
      if (JSON.stringify(live) !== JSON.stringify(restartRound())) throw Error('Incomplete reset');
      // Yield with the complete reset image stable for external screenshot/trace.
      await nextFrame(); await nextFrame();
      const callbackProxyMs = performance.now() - activation;
      frame(now);
      for (let tick = 1; tick <= script.states.length; tick++) {
        if (presses.has(tick)) {
          document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true, cancelable: true }));
          document.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', bubbles: true }));
        }
        now += 1000 / 120;
        frame(now);
        if (JSON.stringify(live) !== JSON.stringify(script.states[tick - 1])) {
          throw Error(`Replay mismatch cycle ${cycle + 1}, tick ${tick}`);
        }
      }
      report.cycles.push({ cycle: cycle + 1, activation, callbackProxyMs,
        presentedResetMs: null, terminalTick: live.activeTick, score: live.score,
        rngState: live.rngState, pairs: structuredClone(live.pairs), phase: live.phase });
      // Bound repeated chain diagnostics, retain per-cycle terminal data.
      report.assertions = report.assertions.filter((value, i, all) => all.indexOf(value) === i);
    }
    check(pending.size === 1, 'one scheduled chain throughout 100 cycles');
    check(report.cycles.every(cycle => cycle.score > 0 && cycle.phase === 'game-over'), '100 real scoring/loss/retry outcomes');
  } finally { dispose(); check(pending.size === 0, 'disposed animation chain'); }
}

async function performanceFlight() {
  const round = restartRound();
  const context = scoped.getElementById('game-canvas').getContext('2d');
  const intervals = [];
  let previous, started, frames = 0, stop, rejectRun;
  const completed = new Promise((resolve, reject) => { stop = resolve; rejectRun = reject; });
  const loop = createLoop({
    isPlaying: () => round.phase === 'playing',
    step() {
      stepRound(round, CONFIG, traversalInput(round));
      if (round.phase !== 'playing') rejectRun(Error('Performance flight collided'));
    },
    render() {
      const now = performance.now();
      if (started === undefined) started = now;
      if (previous !== undefined) intervals.push(now - previous);
      previous = now; frames++;
      scoped.getElementById('score').textContent = String(round.score);
      scoped.getElementById('status').textContent = 'Flying';
      scoped.getElementById('instructions').textContent = 'Scripted legal flaps; keep visible and focused.';
      scoped.getElementById('game-button').textContent = 'Restart game';
      scoped.getElementById('retry-button').hidden = true;
      render(context, round, CONFIG, now);
      element('progress').textContent = `Flight ${((now - started) / 1000).toFixed(1)} / 60 s`;
      if (now - started >= 60000) stop();
    },
  });
  const interrupted = () => rejectRun(Error('Focus/visibility lost: performance measurement invalid'));
  const hidden = () => { if (document.hidden) interrupted(); };
  window.addEventListener('blur', interrupted);
  document.addEventListener('visibilitychange', hidden);
  try {
    if (document.hidden || !document.hasFocus()) throw Error('Focus page before measurement');
    loop.start(); await completed;
    const durationMs = previous - started;
    report.performance = { durationMs, frames, averageFPS: (frames - 1) * 1000 / durationMs,
      intervalsMs: intervals, maxIntervalMs: Math.max(...intervals), activeTick: round.activeTick,
      score: round.score, phase: round.phase, targetFPS: 60,
      baseline: 'Record machine/chip, memory, OS, display Hz, power and workload externally',
      stutterReview: 'PENDING human observation and interval investigation' };
  } finally {
    loop.dispose(); window.removeEventListener('blur', interrupted);
    document.removeEventListener('visibilitychange', hidden);
  }
}
element('checks').addEventListener('click', () => run(cycles));
element('performance').addEventListener('click', () => run(performanceFlight));
element('download').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'flappy-validation.json'; link.click();
  URL.revokeObjectURL(url);
});
show();
