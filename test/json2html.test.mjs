/* eslint-env node, es2020 */
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { parseHTML } from 'linkedom';
import decorate from '../blocks/job-detail/job-detail.js';
import { createPreviewServer, renderJobPage } from '../tools/json2html/preview.mjs';

const data = JSON.parse(await readFile(
  new URL('../data/jobs/1914237-clinical-negligence-solicitor.json', import.meta.url),
  'utf8',
));

async function renderDocument(payload = data) {
  return parseHTML(await renderJobPage(payload));
}

test('captured job retains the description, facts and source salary discrepancy', () => {
  assert.equal(data.job.id, '1914237');
  assert.equal(data.job.reference, '4INCIW-B7890E03');
  assert.equal(data.job.datePosted, '2026-10-01');
  assert.equal(data.job.validThrough, '2026-11-30');
  assert.equal(data.job.salary.maxValue, 65000);
  assert.match(data.job.salary.description, /60,000/);
  assert.match(data.job.salary.display, /65,000/);
  assert.equal(data.job.description.highlights.items.length, 3);
  assert.equal(data.job.description.sections.length, 4);
  assert.equal(data.job.description.sections[0].list.items.length, 9);
  assert.equal(data.job.description.sections[1].list.items.length, 9);
  assert.equal(data.job.description.sections[2].paragraphs.length, 3);
  assert.equal(data.job.description.sections[3].paragraphs.length, 2);
});

test('Mustache renders all captured prose and complete BYOM block markup', async () => {
  const { document } = await renderDocument();
  const block = document.querySelector('main > div > .job-detail');
  assert.ok(block);
  assert.equal(document.querySelectorAll('h1').length, 1);
  assert.equal(block.querySelector('h1').textContent, data.job.title);
  assert.equal(block.children.length, 2);
  assert.equal(block.children[1].children.length, 2);
  const text = document.querySelector('main').textContent;
  data.job.description.highlights.items.forEach((item) => assert.ok(text.includes(item)));
  data.job.description.sections.forEach((section) => {
    assert.ok(text.includes(section.heading));
    [...(section.list?.items || []), ...(section.paragraphs || [])]
      .forEach((item) => assert.ok(text.includes(item)));
  });
  assert.ok(text.includes(data.job.description.disclaimer));
  assert.ok(text.includes(data.job.salary.description));
  assert.ok(text.includes(data.job.salary.display));
  assert.doesNotMatch(document.documentElement.outerHTML, /\{\{/);
});

test('the rendered page uses repository assets, not original-site scripts or styles', async () => {
  const { document } = await renderDocument();
  assert.deepEqual(
    [...document.querySelectorAll('script[src]')].map((script) => script.getAttribute('src')),
    ['/scripts/aem.js', '/scripts/scripts.js'],
  );
  assert.ok(document.querySelector('link[href="/styles/styles.css"]'));
  assert.equal(document.querySelectorAll('[src*="etc.clientlibs"], [href*="etc.clientlibs"]').length, 0);
});

test('Mustache escapes content instead of accepting injected markup', async () => {
  const payload = structuredClone(data);
  payload.job.title = '<img src=x onerror=alert(1)> & "quoted"';
  const { document } = await renderDocument(payload);
  assert.equal(document.querySelector('h1').textContent, payload.job.title);
  assert.equal(document.querySelectorAll('img[onerror]').length, 0);
});

test('optional data can be omitted without undefined content or empty description lists', async () => {
  const payload = structuredClone(data);
  delete payload.breadcrumbs;
  delete payload.actions;
  delete payload.share;
  delete payload.relatedJobs;
  delete payload.job.employerLogo;
  delete payload.job.consultant;
  delete payload.job.description.highlights;
  payload.job.description.sections = [{ heading: 'Details', paragraphs: ['A description.'] }];
  const { document } = await renderDocument(payload);
  const block = document.querySelector('.job-detail');
  decorate(block);
  assert.equal(block.querySelectorAll('.job-detail-description ul').length, 0);
  assert.equal(block.querySelectorAll('button').length, 0);
  assert.ok(block.textContent.includes('A description.'));
  assert.doesNotMatch(block.textContent, /undefined|null/);
});

test('decoration builds a responsive shell and semantic job facts without losing copy', async () => {
  const { document } = await renderDocument();
  const block = document.querySelector('.job-detail');
  decorate(block);
  assert.ok(block.querySelector('.job-detail-body-with-sidebar'));
  assert.equal(block.querySelectorAll('.job-detail-attributes dt').length, 11);
  assert.equal(block.querySelectorAll('.job-detail-attributes dd').length, 11);
  assert.equal(block.querySelector('nav').getAttribute('aria-label'), 'Breadcrumb');
  assert.equal(block.querySelector('nav li:last-child').getAttribute('aria-current'), 'page');
  assert.equal(block.querySelector('.job-detail-actions').querySelectorAll('a').length, 2);
  assert.equal(block.querySelector('.job-detail-description li').textContent, data.job.description.highlights.items[0]);
});

test('decoration tolerates empty, extra and reordered authored cells', () => {
  const { document } = parseHTML('<div class="job-detail"><div><div></div><div><p>Extra content</p></div></div><div><div><ul><li><strong>Location:</strong> Nottingham</li></ul></div><div><p>Description</p></div></div><div><div><h1>Job title</h1></div></div></div>');
  const block = document.querySelector('.job-detail');
  decorate(block);
  assert.equal(block.querySelector('.job-detail-header h1').textContent, 'Job title');
  assert.ok(block.querySelector('.job-detail-description').textContent.includes('Extra content'));
  assert.ok(block.querySelector('.job-detail-description').textContent.includes('Description'));
  assert.equal(block.querySelector('dd').textContent.trim(), 'Nottingham');
  const empty = document.createElement('div');
  decorate(empty);
  assert.equal(empty.children.length, 0);
});

test('apply and save links hand off to the official job rather than a prototype API', async () => {
  const { document } = await renderDocument();
  const actions = [...document.querySelectorAll('.job-detail a')]
    .filter((link) => ['Apply', 'Save job'].includes(link.textContent));
  assert.equal(actions.length, 4);
  actions.forEach((link) => {
    const url = new URL(link.href);
    assert.equal(url.origin, 'https://www.robertwalters.co.uk');
    assert.equal(`${url.origin}${url.pathname}`, data.source.url);
  });
});

test('copy-link control copies the official URL and announces success', async (t) => {
  let copied;
  const descriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: async (text) => { copied = text; } },
  });
  t.after(() => {
    if (descriptor) Object.defineProperty(navigator, 'clipboard', descriptor);
    else delete navigator.clipboard;
  });
  const { document, window } = await renderDocument();
  const block = document.querySelector('.job-detail');
  decorate(block);
  block.querySelector('.job-detail-copy').dispatchEvent(new window.Event('click'));
  await Promise.resolve();
  assert.equal(copied, data.source.url);
  assert.equal(block.querySelector('[role="status"]').textContent, 'Link copied');
});

test('clipboard failure is reported visibly and logged, not presented as success', async (t) => {
  const descriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: async () => { throw new Error('Clipboard denied'); } },
  });
  const log = t.mock.method(console, 'error', () => {});
  t.after(() => {
    if (descriptor) Object.defineProperty(navigator, 'clipboard', descriptor);
    else delete navigator.clipboard;
  });
  const { document, window } = await renderDocument();
  const block = document.querySelector('.job-detail');
  decorate(block);
  block.querySelector('.job-detail-copy').dispatchEvent(new window.Event('click'));
  await Promise.resolve();
  assert.match(block.querySelector('[role="status"]').textContent, /^Could not copy/);
  assert.equal(log.mock.callCount(), 1);
});

test('local preview renders both page routes and JSON without exposing development files', async (t) => {
  const server = await createPreviewServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((done) => { server.close(done); }));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const [page, htmlPage, json, hidden, tool, post] = await Promise.all([
    fetch(`${origin}${data.path}`),
    fetch(`${origin}${data.path}.html`),
    fetch(`${origin}/data/jobs/1914237-clinical-negligence-solicitor.json`),
    fetch(`${origin}/.git/config`),
    fetch(`${origin}/tools/json2html/preview.mjs`),
    fetch(`${origin}${data.path}`, { method: 'POST' }),
  ]);
  assert.equal(page.status, 200);
  assert.equal(htmlPage.status, 200);
  assert.match(await page.text(), /Clinical Negligence Solicitor/);
  assert.equal((await json.json()).job.id, data.job.id);
  assert.equal(hidden.status, 404);
  assert.equal(tool.status, 404);
  assert.equal(post.status, 405);
});

test('relative picture media on nested pages resolves through the existing preview site', async (t) => {
  const nativeFetch = globalThis.fetch;
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url) => {
    requests.push(url.href);
    return new Response('Existing site media', { headers: { 'Content-Type': 'image/png' } });
  });
  const server = await createPreviewServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((done) => { server.close(done); }));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const media = '/media_123abc.png?width=750&format=png';
  const response = await nativeFetch(`${origin}/legal/jobs/personalinjury${media}`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/png');
  assert.equal(await response.text(), 'Existing site media');
  assert.deepEqual(requests, [`https://main--rw--cpilsworth.aem.page${media}`]);
});
