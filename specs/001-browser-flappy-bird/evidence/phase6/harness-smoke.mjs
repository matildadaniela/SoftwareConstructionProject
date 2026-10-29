// Dependency-free CDP runner. Usage: node harness-smoke.mjs [port] [cycles|performance|journeys]
// Requires the static server :8000 and an isolated Chrome/Edge debug browser.
import { readFileSync, writeFileSync } from 'node:fs';
const port = process.argv[2] ?? '9222';
const mode = process.argv[3] ?? 'cycles';
if (mode === 'journeys') {
  // Reuse the existing native input smoke, preserving its historical source.
  const source = readFileSync(new URL('../phase3/flappy-smoke.mjs', import.meta.url), 'utf8')
    .replaceAll(':9222', ':' + port)
    .replaceAll('/private/tmp/flappy-', new URL('./' + port + '-', import.meta.url).pathname);
  await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  process.exit(0);
}
const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const ws = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => { ws.onopen = resolve; });
let id = 0;
const pending = new Map(), errors = [];
ws.onmessage = event => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const request = pending.get(message.id); pending.delete(message.id);
    message.error ? request.reject(message.error) : request.resolve(message.result);
  } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params);
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  pending.set(++id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
try {
  const version = await send('Browser.getVersion');
  console.log(JSON.stringify(version));
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await send('Emulation.setDeviceMetricsOverride', { width: 1100, height: 1100, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://127.0.0.1:8000/tests/browser/' });
  for (let attempt = 0; attempt < 100; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (await evaluate(`!!document.querySelector('#surface canvas')`)) break;
  }
  await evaluate(`document.getElementById('${mode === 'performance' ? 'performance' : 'checks'}').click()`);
  let completed = false;
  for (let attempt = 0; attempt < 240; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const status = await evaluate(`document.getElementById('progress').textContent`);
    if (status.startsWith('Finished') || status === 'FAILED') { completed = true; break; }
  }
  if (!completed) throw Error('Harness timeout');
  const report = await evaluate(`JSON.parse(document.getElementById('results').textContent)`);
  report.cdpVersion = version; report.runtimeExceptions = errors;
  const name = `${port}-${mode}`;
  writeFileSync(new URL(`./${name}.json`, import.meta.url), JSON.stringify(report, null, 2) + '\n');
  writeFileSync(new URL(`./${name}.png`, import.meta.url), Buffer.from((await send('Page.captureScreenshot')).data, 'base64'));
  if (report.errors.length || errors.length) throw Error(JSON.stringify({ errors: report.errors, runtimeExceptions: errors }));
  console.log(JSON.stringify({ cycles: report.cycles.length, assertions: report.assertions,
    performance: report.performance && { ...report.performance, intervalsMs: `${report.performance.intervalsMs.length} recorded intervals` },
    restartPresentation: report.restartPresentation }));
} finally { ws.close(); }
