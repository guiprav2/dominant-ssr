import ews from 'express-ws';
import express from 'express';
import ssr from './dominant-ssr.js';
let app = express();
ews(app);
ssr(app);
app.ssr('/', async (ds, win, req) => {
  let i = 0;
  win.setInterval(() => { i++; ds.update() }, 1000);
  win.document.body.append(ds.text(() => `Counter: ${i}`));
});
let port = process.env.port || 3999;
app.listen(port, () => console.log(`Listening:`, port));
