import server from './server.js';
import { Window } from './happy-dom/lib/index.js';
globalThis.window = new Window();
for (let x of ['MutationObserver', 'Node', 'document']) globalThis[x] = window[x];
let d = (await import('./dominant.js')).default;

server.get('/', async req => {
  let interval = setInterval(async () => { i++; await d.updateSync() });
  req.on('close', () => clearInterval(interval));
  return d.el('html', d.el('body', d.el('div', 'Hello')));
});
