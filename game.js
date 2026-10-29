import { CONFIG } from './config.js';
import { createRound, restartRound, startOrFlap, pauseRound, stepRound } from './simulation.js';
import { render } from './renderer.js';

const MAX_STEPS_PER_FRAME = 30;
const GAMEPLAY_KEYS = new Set(['Space', 'ArrowUp']);

// Keep Node imports safe and defer browser composition until markup is ready.
export function initializeBrowser(initialize, page = globalThis.document) {
  if (!page) return () => {};
  if (page.readyState !== 'loading') {
    initialize(page);
    return () => {};
  }
  const ready = () => initialize(page);
  page.addEventListener('DOMContentLoaded', ready, { once: true });
  return () => page.removeEventListener('DOMContentLoaded', ready);
}

export function bindInput(targets, actions, availability = {}) {
  const { keyboard, window, document, gameArea, button, retry } = targets;
  const isFocused = availability.isFocused ?? (() => document.hasFocus());
  const isVisible = availability.isVisible ?? (() => !document.hidden);
  const available = () => isFocused() && isVisible();
  const heldKeys = new Set();
  const listeners = [];
  let activePointer = null;
  function listen(target, type, handler) {
    target.addEventListener(type, handler);
    listeners.push(() => target.removeEventListener(type, handler));
  }
  function clear() {
    heldKeys.clear();
    activePointer = null;
  }
  function suspend() {
    clear();
    actions.pause();
    actions.clear();
  }
  listen(keyboard, 'keydown', event => {
    if (!GAMEPLAY_KEYS.has(event.code)) return;
    event.preventDefault();
    if (!available() || event.repeat || heldKeys.has(event.code)) return;
    heldKeys.add(event.code);
    actions.gameplay();
  });
  listen(keyboard, 'keyup', event => heldKeys.delete(event.code));
  // Pointer events track gestures, while click is the sole activation path.
  // Native button keyboard activation also produces click; no mouse/touch
  // compatibility listeners can duplicate it.
  listen(gameArea, 'pointerdown', event => {
    if (available() && event.button === 0 && event.isPrimary !== false) {
      activePointer = event.pointerId;
    }
  });
  for (const type of ['pointerup', 'pointercancel']) {
    listen(gameArea, type, event => {
      if (event.pointerId === activePointer) activePointer = null;
    });
  }
  function activate(event) {
    if (event.button !== undefined && event.button !== 0) return;
    // Click is a completed activation; browsers may leave isPrimary false,
    // including for native keyboard activation of a button.
    if (!available()) return;
    actions.gameplay();
  }
  listen(gameArea, 'click', activate);
  function control(event, action) {
    event.stopPropagation();
    if (available() && (event.button === undefined || event.button === 0)) action();
  }
  listen(button, 'click', event => control(event, actions.primary ?? actions.gameplay));
  if (retry) listen(retry, 'click', event => control(event, actions.restart));
  listen(window, 'blur', suspend);
  listen(document, 'visibilitychange', () => { if (!isVisible()) suspend(); });
  const dispose = () => {
    for (const remove of listeners.splice(0)) remove();
    clear();
  };
  // Restart composition can clear held/pointer state without rebinding listeners.
  dispose.clear = clear;
  return dispose;
}

export function createLoop({
  step, render, isPlaying,
  clock = () => globalThis.performance.now(),
  requestFrame = callback => globalThis.requestAnimationFrame(callback),
  cancelFrame = id => globalThis.cancelAnimationFrame(id),
}) {
  let lastTimestamp = null;
  let accumulatorSeconds = 0;
  let scheduledFrameId = null;
  let running = false;
  let nextTick = 1;
  const pending = new Map();
  function resetTiming() {
    lastTimestamp = null;
    accumulatorSeconds = 0;
  }
  function clearInput(tick = nextTick) {
    pending.clear();
    nextTick = tick;
  }
  function frame() {
    scheduledFrameId = null;
    if (!running) return;
    const now = clock();
    if (!isPlaying()) {
      resetTiming();
      clearInput();
    } else {
      // A regressing supplied clock must neither reverse time nor double count
      // the interval when it catches up to its previous high-water mark.
      if (lastTimestamp !== null) {
        accumulatorSeconds += Math.max(0, now - lastTimestamp) / 1000;
      }
      lastTimestamp = Math.max(lastTimestamp ?? now, now);
      let steps = 0;
      while (accumulatorSeconds + 1e-12 >= CONFIG.stepSeconds &&
             steps < MAX_STEPS_PER_FRAME && isPlaying()) {
        const inputs = pending.get(nextTick) ?? [];
        pending.delete(nextTick++);
        accumulatorSeconds = Math.max(0, accumulatorSeconds - CONFIG.stepSeconds);
        steps++;
        if (step(inputs) === false || !isPlaying()) {
          resetTiming();
          clearInput();
          break;
        }
      }
    }
    render();
    if (running) scheduledFrameId = requestFrame(frame);
  }
  return {
    start() {
      if (running) return;
      running = true;
      resetTiming();
      scheduledFrameId = requestFrame(frame);
    },
    dispose() {
      running = false;
      if (scheduledFrameId !== null) cancelFrame(scheduledFrameId);
      scheduledFrameId = null;
      resetTiming();
      clearInput();
    },
    resetTiming,
    clearInput,
    enqueue(input, tick = nextTick) {
      if (!Number.isSafeInteger(tick) || tick < nextTick) {
        throw new RangeError('Input must target an unprocessed simulation tick');
      }
      if (!pending.has(tick)) pending.set(tick, []);
      pending.get(tick).push(input);
    },
  };
}

export function mountGame(page, options = {}) {
  const window = page.defaultView;
  const element = id => page.getElementById(id);
  const context = element('game-canvas').getContext('2d');
  const button = element('game-button');
  const retry = element('retry-button');
  const score = element('score');
  const status = element('status');
  const instructions = element('instructions');
  let round = createRound();
  const clock = options.clock ?? (() => window.performance.now());
  const draw = options.draw ?? render;
  const views = {
    ready: ['Ready to fly', 'Start game', 'Space / ↑ or click / tap the game to start and flap.'],
    playing: ['Flying', 'Restart game', 'Space / ↑ or click / tap the game to flap.'],
    paused: ['Flight paused', 'Resume game', 'Space / ↑ or click / tap the game to resume with a flap.'],
    'game-over': ['Game over', 'Restart game', 'Flight ended. Tap to try again or use Restart game.'],
  };
  function updateView() {
    const [message, label, instruction] = views[round.phase];
    score.textContent = String(round.score);
    const statusText = round.phase === 'game-over'
      ? `${message}. Final score: ${round.score}` : message;
    // Avoid repeatedly announcing unchanged status on decorative frames.
    if (status.textContent !== statusText) status.textContent = statusText;
    button.textContent = label;
    instructions.textContent = instruction;
    retry.hidden = round.phase !== 'game-over';
    button.disabled = false;
    retry.disabled = false;
    draw(context, round, CONFIG, clock());
  }
  const loop = createLoop({
    clock,
    requestFrame: options.requestFrame ?? (callback => window.requestAnimationFrame(callback)),
    cancelFrame: options.cancelFrame ?? (id => window.cancelAnimationFrame(id)),
    isPlaying: () => round.phase === 'playing',
    step: inputs => stepRound(round, CONFIG, inputs),
    render: updateView,
  });
  const disposeInput = bindInput({
    keyboard: page, window, document: page,
    gameArea: element('playfield'), button, retry,
  }, {
    restart,
    primary() {
      if (round.phase === 'playing' || round.phase === 'game-over') restart();
      else gameplay();
    },
    gameplay,
    pause() {
      pauseRound(round);
      updateView();
    },
    clear() {
      loop.clearInput();
      loop.resetTiming();
    },
  });
  function gameplay() {
    if (round.phase === 'game-over') return;
    if (round.phase !== 'playing') {
      startOrFlap(round);
      loop.resetTiming();
    }
    loop.enqueue({ type: 'flap' });
    updateView();
  }
  function restart() {
    round = restartRound();
    disposeInput.clear();
    loop.clearInput(1);
    loop.resetTiming();
    updateView();
  }
  updateView();
  loop.start();
  const dispose = () => {
    disposeInput();
    loop.dispose();
  };
  dispose.restart = restart;
  return dispose;
}

initializeBrowser(page => {
  if (page.getElementById('game-canvas')) mountGame(page);
});
