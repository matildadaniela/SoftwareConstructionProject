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
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await send('Emulation.setDeviceMetricsOverride', { width: 1100, height: 1100, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://127.0.0.1:8000/' });
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log(JSON.stringify(await evaluate(`(async () => {
    const { mountGame } = await import('/game.js');
    const { render } = await import('/renderer.js');
    const surface = document.createElement('section');
    surface.innerHTML = document.querySelector('main').outerHTML;
    document.body.replaceChildren(surface);
    const proxy = {
      defaultView: window, hidden: false, hasFocus: () => true,
      getElementById: id => surface.querySelector('#' + id),
      addEventListener: (...args) => surface.addEventListener(...args),
      removeEventListener: (...args) => surface.removeEventListener(...args),
    };
    let live, callback, draws = 0;
    const dispose = mountGame(proxy, {
      clock: () => performance.now(), requestFrame: cb => {callback = cb; return 1;}, cancelFrame() {},
      draw(ctx, state) {live = state; draws++; render(ctx, state);},
    });
    const check = (value, message) => {if (!value) throw Error(message);};
    const fresh = () => check(live.phase === 'playing' && live.activeTick === 0 &&
      live.score === 0 && live.pairs.length === 0 && live.bird.y === 248 &&
      live.bird.velocityY === -450 && live.rngState === 0x1A2B3C4D &&
      proxy.getElementById('score').textContent === '0' &&
      proxy.getElementById('status').textContent === 'Flying' &&
      proxy.getElementById('retry-button').hidden, 'complete synchronous reset');
    const results = [];
    for (const phase of ['ready','playing','paused','game-over']) {
      live.phase = phase; live.score = 8; live.activeTick = 99;
      dispose.restart(); fresh(); results.push({phase, sharedRestart:true});
    }
    for (const id of ['game-button','retry-button']) {
      live.phase = 'game-over'; live.score = 7; callback();
      const before = draws;
      proxy.getElementById(id).click(); fresh();
      check(draws === before + 1, 'one activation, no bubbling');
      results.push({id, nativeClick:true});
    }
    for (let i = 0; i < 12; i++) proxy.getElementById('game-button').click();
    fresh();
    // Expose only in this validation page for CDP native-key checks.
    window.restartSmoke = { get live() { return live; }, callback, fresh, proxy };
    live.phase = 'game-over'; live.score = 7; callback();
    proxy.getElementById('game-button').focus();
    performance.mark('phase5-before-native-restart');
    return results;
  })()`), null, 2));
  // Actual browser Tab order and Enter default activation, not synthetic clicks.
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers: 8 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers: 8 });
  const focused = await evaluate('document.activeElement.id');
  if (focused !== 'retry-button') throw Error('Shift+Tab did not focus retry: ' + focused);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await evaluate('restartSmoke.fresh(); performance.mark("phase5-after-native-restart"); true');
  for (const control of ['game-button', 'retry-button']) {
    const point = await evaluate(`(() => {
      const s = restartSmoke;
      s.live.phase = 'game-over'; s.live.score = 8; s.callback();
      const button = s.proxy.getElementById('${control}');
      button.scrollIntoView({block:'center'});
      const r = button.getBoundingClientRect();
      return {x:r.x+r.width/2, y:r.y+r.height/2};
    })()`);
    await send('Input.dispatchMouseEvent', {type:'mousePressed', ...point, button:'left', clickCount:1});
    await send('Input.dispatchMouseEvent', {type:'mouseReleased', ...point, button:'left', clickCount:1});
    await evaluate('restartSmoke.fresh(); true');
    console.log('PASS: browser mouse activation ' + control);
  }
  writeFileSync(new URL('./restart-reset.png', import.meta.url), Buffer.from((await send('Page.captureScreenshot')).data, 'base64'));
  console.log('PASS: native Shift+Tab/Enter retry and screenshot of complete reset. Screenshot is preliminary presented-frame evidence, not a latency measurement.');
  if (errors.length) throw Error(JSON.stringify(errors));
  console.log('PASS: all-state restart, both controls, rapid activation, zero runtime exceptions.');
} finally { ws.close(); }
