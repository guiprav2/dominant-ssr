import crypto from 'crypto';
import d from './dominant.js';
import { Window } from './happy-dom/lib/index.js';
export let live = {};
export default app => {
  app.ws('/ssr/:id', (ws, req) => {
    let { id } = req.params;
    let entry = live[id];
    if (!entry) { ws.close(); return }
    entry.ws = ws;
    ws.on('close', () => {
      entry.win.happyDOM.abort();
      entry.win.close();
      delete live[id];
    });
  });
  app.ssr = (path, fn) => app.get(path, async (req, res) => {
    try {
      let id = crypto.randomUUID();
      let win = new Window();
      let ds = d.ssr(win);
      let entry = live[id] = { win, ds };
      setTimeout(() => {
        if (entry.ws?.readyState !== 1) return;
        delete live[id];
      }, 10000);
      await fn(ds, win, req);
      await ds.updateSync();
      win.document.head.append(ds.el('script', { type: 'module' }, `
        import morphdom from 'https://esm.sh/morphdom';
        let id = ${JSON.stringify(id)};
        let ws = new WebSocket(\`\${location.origin.replace(/^http/, 'ws')}/ssr/\${id}\`);
        ws.addEventListener('message', ({ data }) => {
          data = JSON.parse(data);
          if (data.type !== 'diff') return;
          morphdom(document.documentElement, data.html);
        });
      `));
      res.end(win.document.documentElement.outerHTML);
      entry.obs = new win.MutationObserver(() => entry.ws.send(JSON.stringify({ type: 'diff', html: win.document.documentElement.outerHTML })));
      entry.obs.observe(win.document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
    } catch (err) {
      console.error(err);
      res.status(500).type('text').end(err.toString());
    }
  });
};
