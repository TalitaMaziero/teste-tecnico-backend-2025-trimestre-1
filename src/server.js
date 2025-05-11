import http from 'http';
import { uploadHandler, streamHandler } from './controllers/videoController.js';

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/upload/video') return uploadHandler(req, res);
  if (req.method === 'GET' && req.url.startsWith('/static/video/')) return streamHandler(req, res);
  res.writeHead(404).end('Not Found');
});

server.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
