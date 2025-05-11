import { setCache, getCache } from '../cache.js';
import { fileTypeFromBuffer } from 'file-type';
import { URL } from 'url';
import path from 'path';
import fs from 'fs';
import { parseRange } from '../utils/parseRange.js';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME = ['video/mp4', 'video/webm', 'video/ogg'];
const VIDEOS_DIR = '/videos';

export async function uploadVideo(req, res) {
  const contentType = req.headers['content-type'] || '';
  const ext = contentType.split('/')[1] || 'mp4';
  const filename = `video_${Date.now()}.${ext}`;
  const filePath = path.join(VIDEOS_DIR, filename);

  const chunks = [];
  let totalSize = 0;

  req.on('data', (chunk) => {
    totalSize += chunk.length;

    if (totalSize > MAX_SIZE) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Arquivo maior que 10MB');
      req.destroy();
      return;
    }

    chunks.push(chunk);
  });

  req.on('end', async () => {
    const buffer = Buffer.concat(chunks);
    const type = await fileTypeFromBuffer(buffer);

    // Valida tipo MIME real do conteúdo
    if (!type || !ALLOWED_MIME.includes(type.mime)) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      return res.end('Tipo de arquivo inválido');
    }

    await setCache(filename, buffer, 60);

    // Salva arquivo em disco
    try {
      await fs.promises.writeFile(filePath, buffer);
      console.log(`Arquivo salvo em: ${filePath}`);
    } catch (err) {
      console.error('Erro ao salvar arquivo:', err);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ filename }));
  });

  req.on('error', (err) => {
    console.error('Erro no upload:', err);
    res.writeHead(500);
    res.end('Erro interno no servidor');
  });
}

export async function getVideo(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const filename = decodeURIComponent(url.pathname.replace('/static/video/', ''));
  const filePath = path.join(VIDEOS_DIR, filename);

  let videoBuffer = await getCache(filename);

  if (!videoBuffer && fs.existsSync(filePath)) {
    videoBuffer = fs.readFileSync(filePath);
    await setCache(filename, videoBuffer, 60);
  }

  if (!videoBuffer) return res.writeHead(404).end('Arquivo não encontrado');

  // Detecta tipo MIME real do conteúdo
  const range = req.headers.range;
  const { mime } = (await fileTypeFromBuffer(videoBuffer)) || {};
  const type = mime || 'application/octet-stream';

  if (!range) {
    return res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': videoBuffer.length,
    }).end(videoBuffer);
  }

  // Trata Range (streaming parcial)
  const parsedRange = parseRange(range, videoBuffer.length);

  if (!parsedRange) {
    return res.writeHead(416, {
      'Content-Range': `bytes */${videoBuffer.length}`,
    }).end();
  }

  const { start, end } = parsedRange;
  const chunk = videoBuffer.subarray(start, end + 1);

  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${videoBuffer.length}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunk.length,
    'Content-Type': type,
  });

  res.end(chunk);
}
