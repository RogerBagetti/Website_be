// Minimal static file server for local preview.
// Usage: node serve.mjs   ->   http://localhost:3000
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = process.cwd();
const PORT = 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

// Same security headers served by Vercel in production (see vercel.json),
// so the CSP can be validated locally before a deploy.
const SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https://placehold.co; connect-src 'self' https://api.web3forms.com; " +
    "form-action 'self' https://api.web3forms.com https://assets.mailerlite.com; " +
    "frame-src 'self' https://assets.mailerlite.com; frame-ancestors 'self'; base-uri 'self'; object-src 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
};

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, `http://localhost:${PORT}`).pathname);
    if (urlPath === '/') urlPath = '/index.html';

    // prevent path traversal
    let filePath = normalize(join(ROOT, urlPath));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    let data;
    try {
      data = await readFile(filePath);
    } catch (err) {
      // clean URLs como na produção (Vercel cleanUrls): /blog -> blog.html
      if (extname(filePath)) throw err;
      filePath += '.html';
      data = await readFile(filePath);
    }

    const type = MIME[extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache', ...SECURITY_HEADERS });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404 — Not found</h1>');
  }
});

server.listen(PORT, () => {
  console.log(`Servindo ${ROOT}`);
  console.log(`http://localhost:${PORT}`);
});
