/* eslint-env node */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Mustache from 'mustache';

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const PREVIEW_ORIGIN = 'https://main--rw--cpilsworth.aem.page';
const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function projectFile(pathname) {
  const filename = resolve(ROOT, `.${pathname}`);
  if (!filename.startsWith(`${ROOT}/`)) throw new Error('Path is outside the project');
  return filename;
}

async function loadSource() {
  const mappings = JSON.parse(await readFile(new URL('./config.json', import.meta.url), 'utf8'));
  const mapping = mappings[0];
  const data = JSON.parse(await readFile(projectFile(new URL(mapping.endpoint).pathname), 'utf8'));
  if (data.schemaVersion !== 1 || !data.job?.title || data.path !== mapping.path) {
    throw new Error('Job JSON must have schemaVersion 1, a title and a path matching config.json');
  }
  return { mapping, data };
}

export async function renderJobPage(data) {
  const source = await loadSource();
  const [template, head] = await Promise.all([
    readFile(projectFile(source.mapping.template), 'utf8'),
    readFile(projectFile('/head.html'), 'utf8'),
  ]);
  return Mustache.render(template, data ?? source.data).replace('</head>', `${head}</head>`);
}

function isStaticPath(pathname) {
  return !pathname.split('/').some((segment) => segment.startsWith('.'))
    && (/^\/(blocks|scripts|styles|fonts|icons|data|templates)\//.test(pathname)
      || pathname === '/favicon.ico');
}

function isContentPath(pathname) {
  return /^\/(?:content\/)?(?:nav|footer)\.plain\.html$/.test(pathname)
    || /\/media_[a-z0-9]+\.(?:svg|png|jpe?g|webp)$/.test(pathname);
}

export async function createPreviewServer() {
  const { data } = await loadSource();
  return createServer(async (request, response) => {
    try {
      if (!['GET', 'HEAD'].includes(request.method)) {
        response.writeHead(405, { Allow: 'GET, HEAD' });
        response.end('Method not allowed');
        return;
      }
      const url = new URL(request.url, 'http://localhost');
      const pathname = decodeURIComponent(url.pathname);
      if (pathname === '/') {
        response.writeHead(302, { Location: data.path });
        response.end();
        return;
      }
      if (pathname === data.path || pathname === `${data.path}.html`) {
        response.writeHead(200, { 'Content-Type': CONTENT_TYPES['.html'] });
        response.end(await renderJobPage());
        return;
      }
      if (isContentPath(pathname)) {
        const upstream = new URL(pathname.slice(pathname.lastIndexOf('/')), PREVIEW_ORIGIN);
        upstream.search = url.search;
        const result = await fetch(upstream, { signal: AbortSignal.timeout(15000) });
        response.writeHead(result.status, {
          'Content-Type': result.headers.get('content-type') || 'application/octet-stream',
        });
        response.end(Buffer.from(await result.arrayBuffer()));
        return;
      }
      if (isStaticPath(pathname)) {
        let body;
        try {
          body = await readFile(projectFile(pathname));
        } catch (error) {
          if (error.code !== 'ENOENT') throw error;
          response.writeHead(404);
          response.end('File not found');
          return;
        }
        response.writeHead(200, {
          'Content-Type': CONTENT_TYPES[extname(pathname)] || 'application/octet-stream',
        });
        response.end(body);
        return;
      }
      response.writeHead(404);
      response.end('Page not found');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('JSON2HTML preview failed', error);
      response.writeHead(error instanceof URIError ? 400 : 500);
      response.end(error instanceof URIError ? 'Invalid URL' : 'Unable to render the preview');
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid PORT');
  const server = await createPreviewServer();
  server.listen(port, '127.0.0.1', () => {
    // eslint-disable-next-line no-console
    console.log(`JSON2HTML job preview: http://localhost:${server.address().port}/`);
  });
}
