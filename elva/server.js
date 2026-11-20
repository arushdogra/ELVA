import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { chat } from './api/chat.js';

const assets = { '/': ['index.html', 'text/html'], '/style.css': ['style.css', 'text/css'], '/app.js': ['app.js', 'text/javascript'] };
createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  try {
    if (pathname === '/api/chat' && req.method === 'POST') {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 100000) {
          res.writeHead(413).end('Request too large.');
          return;
        }
      }
      const [status, data] = await chat(JSON.parse(body));
      res.writeHead(status, { 'content-type': 'application/json' }).end(JSON.stringify(data));
      return;
    }
    const asset = Object.hasOwn(assets, pathname) && assets[pathname];
    if (!asset) return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': asset[1] }).end(await readFile(new URL('./public/' + asset[0], import.meta.url)));
  } catch {
    res.writeHead(400).end('Invalid request.');
  }
}).listen(3000, '127.0.0.1', () => console.log('ELVA is running at http://localhost:3000'));
