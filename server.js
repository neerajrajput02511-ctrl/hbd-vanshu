/**
 * Local Development Server with Automatic File-Saving API
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4'
};

const server = http.createServer((req, res) => {
  // 1. Direct Save API Endpoint
  if (req.method === 'POST' && req.url === '/api/save-config') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const configData = JSON.parse(body);
        const configJsContent = `/**
 * =========================================================================
 * "FOR VANSHIKA" — CENTRAL CONFIGURATION & PERSONALIZATION
 * Saved automatically from Edit Mode on ${new Date().toLocaleString()}
 * =========================================================================
 */

const DEFAULT_CONFIG = ${JSON.stringify(configData, null, 2)};

// Export to window for global access
window.DEFAULT_CONFIG = DEFAULT_CONFIG;
`;
        const configPath = path.join(ROOT, 'js', 'config.js');
        fs.writeFileSync(configPath, configJsContent, 'utf8');
        console.log('✅ [AUTO-SAVE] Successfully updated js/config.js on disk!');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Saved to js/config.js on disk!' }));
      } catch (err) {
        console.error('❌ Error saving config:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 1b. Save Media Binary Endpoint
  if (req.method === 'POST' && req.url.startsWith('/api/save-media')) {
    const parsedUrl = new URL(req.url, 'http://localhost:3000');
    const folder = parsedUrl.searchParams.get('folder') || 'videos';
    const filename = parsedUrl.searchParams.get('filename') || `media_${Date.now()}.mp4`;
    const targetDir = path.join(ROOT, 'assets', folder);
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const targetPath = path.join(targetDir, filename);
    const writeStream = fs.createWriteStream(targetPath);
    req.pipe(writeStream);

    writeStream.on('finish', () => {
      console.log(`✅ [MEDIA-SAVED] Saved assets/${folder}/${filename}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, url: `assets/${folder}/${filename}` }));
    });

    writeStream.on('error', (err) => {
      console.error('❌ Error saving media file:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    });
    return;
  }

  // 2. Static File Serving
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';

  const filePath = path.join(ROOT, decodeURIComponent(reqPath));

  // Security check: prevent directory traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Support video/audio byte ranges for smooth streaming
    const range = req.headers.range;
    if (range && (contentType.startsWith('video/') || contentType.startsWith('audio/'))) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      });
      file.pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Accept-Ranges': 'bytes'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`✨ Server running at http://localhost:${PORT}`);
});
