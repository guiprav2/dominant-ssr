import server from './server.js';

server.get('/', async req => {
  let interval = setInterval(async () => { i++; await d.updateSync() });
  req.on('close', () => clearInterval(interval);
  return d.html`
    <html>
      <body>
        ${d.text(() => `Counter: ${i}`)}
      </body>
    </html>
  `;
});
