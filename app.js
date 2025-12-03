import ews from 'express-ws';
import express from 'express';
import ssr from './dominant-ssr.js';
let app = express();
ews(app);
ssr(app);
app.ssr('/', async (ds, win, req) => {
  let i = 0;
  let name = '';
  let typedName;
  win.setInterval(() => { i++; ds.update() }, 1000);
  win.document.body.append(ds.el('div', [
    ds.el('div', ds.text(() => `Counter: ${i}`)),
    ds.el('div', [
      ds.el('input', {
        placeholder: `Enter your name...`,
        value: ds.binding({ get: () => name, set: x => name = x }),
      }),
      ds.el('button', {
        onclick: () => { typedName = name; ds.update() },
        textContent: `Hello`,
      }),
    ]),
    ds.if(() => typedName, ds.el('div', ds.text(() => `Hello, ${typedName}!`))),
  ]));
});
let port = process.env.port || 3999;
app.listen(port, () => console.log(`Listening:`, port));
