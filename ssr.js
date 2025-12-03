import express from 'express';
import { Window } from './happy-dom/lib/index.js';
globalThis.window = new Window();
for (let x of ['MutationObserver', 'Node', 'document']) globalThis[x] = window[x];
let d = (await import('./dominant.js')).default;
let app = express();
app.ssr = (path, fn) => app.get(path, async (req, res) => {
  try {
    let win = new Window();
    let ds = d.ssr(win);
    await fn(ds, win, req);
    await ds.updateSync();
    res.end(win.contentDocument.outerHTML);
  } catch (err) {
    console.error(err);
    res.status(500).type('text').end(err.toString());
  }
});
app.ssr('/', async (ds, win, req) => {
  let i = 0;
  setInterval(() => { i++; ds.update() }, 1000);
  win.document.body.append(ds.text(() => `Counter: ${i}`));
});
let port = process.env.port || 3999;
app.listen(port, () => console.log(`Listening:`, port));
