const http = require('http');
const os = require('os');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const startedAt = new Date();

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(body);
}

function notFound(res) {
  sendJson(res, 404, {
    error: 'Not found',
    message: 'Try /api/health or /api/search-info?q=your+search'
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/api/health') {
    return sendJson(res, 200, {
      status: 'ok',
      service: process.env.APP_NAME || 'XYMZ Docker API',
      container: os.hostname(),
      runtime: 'Node.js ' + process.version,
      uptimeSeconds: Math.round(process.uptime()),
      startedAt: startedAt.toISOString(),
      message: 'The frontend reached this API through the Docker Compose network and NGINX reverse proxy.'
    });
  }

  if (req.method === 'GET' && url.pathname === '/api/search-info') {
    const q = (url.searchParams.get('q') || '').trim();
    return sendJson(res, 200, {
      query: q,
      length: q.length,
      wordCount: q ? q.split(/\s+/).length : 0,
      tip: q
        ? `Try comparing Web, News, Wikipedia, and Maps results for "${q}".`
        : 'Pass a query with /api/search-info?q=retro+web+design',
      poweredBy: 'XYMZ Docker API'
    });
  }

  return notFound(res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`XYMZ Docker API listening on port ${PORT}`);
});
