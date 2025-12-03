import crypto from 'crypto';
import d from './dominant.js';
import { Window } from 'happy-dom';
export let live = {};
export default app => {
  app.ws('/ssr/:id', (ws, req) => {
    let { id } = req.params;
    let entry = live[id];
    if (!entry) { ws.close(); return }
    entry.ws = ws;
    ws.on('message', data => {
      data = JSON.parse(data);
      switch (data.type) {
        case 'click': {
          let target = entry.win.document.querySelector(`[data-ssrid="${data.id}"]`);
          target?.click?.();
          break;
        }
        case 'input': {
          let target = entry.win.document.querySelector(`[data-ssrid="${data.id}"]`);
          if (!target) { console.warn(`Target not found (for ${data.id}):`, data.value); break }
          target.setAttribute('value', target.value = data.value);
          if (!target.bindings) break;
          let b = target.bindings.find(x => x.key === 'value');
          if (!b) break;
          b.set(data.value);
          break;
        }
      }
    });
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
      function identify() {
        for (let x of win.document.querySelectorAll('input, textarea, button')) {
          if (x.getAttribute('data-ssrid')) continue;
          x.setAttribute('data-ssrid', crypto.randomUUID());
        }
      }
      win.document.head.append(ds.el('script', { type: 'module' }, `
        import morphdom from 'https://esm.sh/morphdom';
        let id = ${JSON.stringify(id)};
        let ws = new WebSocket(\`\${location.origin.replace(/^http/, 'ws')}/ssr/\${id}\`);
        ws.addEventListener('message', ({ data }) => {
          data = JSON.parse(data);
          if (data.type !== 'diff') return;
          morphdom(document.documentElement, data.html);
        });
        addEventListener('click', ev => {
          let target = ev.target.closest('[data-ssrid]');
          if (!target) return;
          ws.send(JSON.stringify({ type: 'click', id: target.getAttribute('data-ssrid') }));
        });
        addEventListener('input', ev => {
          let target = ev.target.closest('[data-ssrid]');
          if (!target) return;
          ws.send(JSON.stringify({ type: 'input', id: target.getAttribute('data-ssrid'), value: target.value }));
        });
      `));
      res.end(win.document.documentElement.outerHTML);
      entry.obs = new win.MutationObserver(() => {
        identify();
        //entry.win.document.querySelectorAll('input, textarea').forEach(x => x.setAttribute('value', x.value));
        entry.ws.send(JSON.stringify({ type: 'diff', html: win.document.documentElement.outerHTML }));
      });
      entry.obs.observe(win.document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
    } catch (err) {
      console.error(err);
      res.status(500).type('text').end(err.toString());
    }
  });
};
