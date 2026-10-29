// Native Chrome/CDP smoke. Requires local HTTP :8000 and Chrome debugging :9222.
import { writeFileSync } from 'node:fs';
const tabs = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const ws = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => ws.onopen = resolve);
let id = 0;
const pending = new Map(), errors = [];
ws.onmessage = event => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const request = pending.get(message.id);
    pending.delete(message.id);
    message.error ? request.reject(message.error) : request.resolve(message.result);
  } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params);
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  pending.set(++id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
try {
  console.log(JSON.stringify(await send('Browser.getVersion')));
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await send('Emulation.setDeviceMetricsOverride', { width: 1100, height: 1100, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://127.0.0.1:8000/' });
  await new Promise(resolve => setTimeout(resolve, 500));
  const results = await evaluate(`(async () => {
    const { mountGame } = await import('/game.js');
    const { render } = await import('/renderer.js');
    const { createRound, stepRound } = await import('/simulation.js');
    const { CONFIG } = await import('/config.js');
    // A detached native document isolates the controlled instance from the live
    // page's automatic game. Its actual HUD/canvas are displayed for inspection.
    const page = document.implementation.createHTMLDocument('Scoring fixtures');
    page.body.innerHTML = document.querySelector('main').outerHTML;
    const surface = document.createElement('section');
    surface.innerHTML = page.body.innerHTML;
    document.body.replaceChildren(surface);
    const proxy = {
      defaultView: window, hidden: false, hasFocus: () => true,
      getElementById: id => surface.querySelector('#' + id),
      addEventListener: (...args) => surface.addEventListener(...args),
      removeEventListener: (...args) => surface.removeEventListener(...args),
    };
    const results = [];
    const check = (condition, message) => { if (!condition) throw Error(message); };
    for (const count of [0, 1, 10]) {
      // Independently traverse normal physics and generated legal openings.
      const round = createRound(); round.phase = 'playing';
      while (round.score < count && round.activeTick < 3000 && round.phase === 'playing') {
        stepRound(round, CONFIG, round.bird.y > 270 && round.bird.velocityY > 0 ? [{type:'flap'}] : [], () => 0.5);
      }
      check(round.score === count && round.phase === 'playing', 'trajectory ' + count);
      while (round.phase === 'playing') stepRound(round);
      check(round.score === count, 'terminal trajectory ' + count);
      let live, callback;
      const dispose = mountGame(proxy, {
        clock: () => 0, requestFrame: cb => { callback = cb; return 1; }, cancelFrame() {},
        draw(ctx, state) { live = state; render(ctx, state); },
      });
      // Feed the completed trajectory to the actual production view composition.
      Object.assign(live, structuredClone(round));
      callback(0);
      check(proxy.getElementById('score').textContent === String(count), 'HUD ' + count);
      check(proxy.getElementById('status').textContent === 'Game over. Final score: ' + count, 'final HUD ' + count);
      const before = JSON.stringify(live);
      callback(1000);
      check(JSON.stringify(live) === before, 'frozen render ' + count);
      results.push({ count, terminalTick: round.activeTick, hud: proxy.getElementById('score').textContent, status: proxy.getElementById('status').textContent });
      dispose();
    }
    const round = createRound(); round.phase = 'playing'; round.score = 2;
    round.pairs = [
      {id:1,x:25,width:64,gapTop:180,gapHeight:164,scored:false},
      {id:2,x:124.5,width:64,gapTop:270,gapHeight:164,scored:false},
    ];
    stepRound(round);
    check(round.phase === 'game-over' && round.score === 2 && round.pairs.every(p => !p.scored), 'collision precedence');
    results.push({collisionPrecedence: true, score: round.score});
    return results;
  })()`);
  console.log(JSON.stringify(results, null, 2));
  writeFileSync(new URL('./scoring-final-10.png', import.meta.url), Buffer.from((await send('Page.captureScreenshot')).data, 'base64'));
  if (errors.length) throw Error(JSON.stringify(errors));
  console.log('PASS: controlled 0/1/10 trajectories, production HUD/canvas, frozen final scores, collision precedence; zero runtime exceptions.');
} finally { ws.close(); }
