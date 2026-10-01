import { createOptimizedPicture } from '../../scripts/aem.js';

const OPTION_CLASSES = [];

/**
 * Splits a column's flat authored content into a header (everything before the
 * first image) and items (each starting at an image).
 * @param {Element} col
 */
function groupColumn(col) {
  const header = [];
  const items = [];
  [...col.children].forEach((el) => {
    if (el.querySelector('picture') || el.tagName === 'PICTURE') {
      items.push({ image: el, body: [] });
    } else if (items.length) {
      items[items.length - 1].body.push(el);
    } else {
      header.push(el);
    }
  });
  return { header, items };
}

function buildItem({ image, body }) {
  const li = document.createElement('li');
  li.className = 'columns-insights-item';

  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'columns-insights-item-image';
  const pic = image.tagName === 'PICTURE' ? image : image.querySelector('picture');
  // text sharing the image paragraph (e.g. image + title link) belongs in the body
  const siblingText = image !== pic && image.textContent.trim() ? image : null;
  imageWrapper.append(pic);

  const bodyWrapper = document.createElement('div');
  bodyWrapper.className = 'columns-insights-item-body';
  if (siblingText) bodyWrapper.append(siblingText);
  bodyWrapper.append(...body);

  // link the image to the item's main destination: a heading link, else the most
  // repeated href (title + "Read More"), else the first link (tag links are one-offs)
  const links = [...bodyWrapper.querySelectorAll('a[href]')];
  const counts = links.reduce((acc, a) => ({ ...acc, [a.href]: (acc[a.href] || 0) + 1 }), {});
  const link = bodyWrapper.querySelector('h1 a, h2 a, h3 a, h4 a, h5 a, h6 a, strong a')
    || links.reduce((best, a) => (!best || counts[a.href] > counts[best.href] ? a : best), null);
  if (link) {
    const a = document.createElement('a');
    a.href = link.href;
    a.tabIndex = -1;
    a.setAttribute('aria-hidden', 'true');
    a.append(...imageWrapper.childNodes);
    imageWrapper.append(a);
  }

  li.append(imageWrapper);
  if (bodyWrapper.children.length) li.append(bodyWrapper);
  return li;
}

/**
 * Splits a tags paragraph ("<a>E-guides</a>, All, <a>Permanent recruitment</a>")
 * into one element per tag so separators can be drawn in CSS.
 * @param {Element} p
 */
function buildMeta(p) {
  const nodes = [...p.childNodes];
  p.replaceChildren();
  nodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent.split(',').map((t) => t.trim()).filter(Boolean).forEach((t) => {
        const span = document.createElement('span');
        span.textContent = t;
        p.append(span);
      });
    } else if (node.nodeType === Node.ELEMENT_NODE && node.textContent.trim()) {
      p.append(node);
    }
  });
}

/**
 * Tags the parts of an article card: category chip (link-only paragraph before
 * the title, moved onto the image), title, excerpt, CTA and tag list.
 * @param {Element} li
 */
function decorateCard(li) {
  const image = li.querySelector('.columns-insights-item-image');
  const body = li.querySelector('.columns-insights-item-body');
  if (!body) return;
  const heading = body.querySelector(':scope > :is(h1, h2, h3, h4, h5, h6)');
  const titleHref = heading?.querySelector('a[href]')?.href;
  let ctaFound = false;
  let headingSeen = false;

  [...body.children].forEach((el) => {
    if (el === heading) {
      el.classList.add('columns-insights-item-title');
      headingSeen = true;
      return;
    }
    const links = [...el.querySelectorAll('a[href]')];
    const linkOnly = links.length === 1 && el.textContent.trim() === links[0].textContent.trim();

    if (linkOnly && heading && !headingSeen && image) {
      el.classList.add('columns-insights-item-tag');
      image.append(el);
    } else if (linkOnly && !ctaFound && (!titleHref || links[0].href === titleHref)) {
      el.classList.add('columns-insights-item-cta');
      ctaFound = true;
    } else if (links.length) {
      el.classList.add('columns-insights-item-meta');
      buildMeta(el);
    } else if (el.tagName === 'P') {
      el.classList.add('columns-insights-item-text');
    }
  });
}

export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  const cols = [...block.querySelectorAll(':scope > div > div')]
    .filter((col) => col.textContent.trim() || col.querySelector('picture'));

  const groups = cols.map((col) => {
    const { header, items } = groupColumn(col);
    const group = document.createElement('div');
    group.className = 'columns-insights-group';

    if (header.length) {
      const head = document.createElement('div');
      head.className = 'columns-insights-header';
      head.append(...header);
      group.append(head);
    }

    if (items.length) {
      const ul = document.createElement('ul');
      ul.className = 'columns-insights-items';
      items.forEach((item) => ul.append(buildItem(item)));
      // rich items (tag, title, excerpt, CTA) render as cards; image + title as tiles
      const avgBody = items.reduce((n, item) => n + item.body.length, 0) / items.length;
      const isCards = avgBody > 1;
      ul.classList.add(isCards ? 'columns-insights-cards' : 'columns-insights-tiles');
      if (isCards) [...ul.children].forEach(decorateCard);
      group.append(ul);
    }
    return group;
  });

  groups.forEach((group) => {
    group.querySelectorAll('picture > img').forEach((img) => {
      img.closest('picture').replaceWith(
        createOptimizedPicture(img.src, img.alt, false, [{ width: '600' }]),
      );
    });
  });

  block.classList.add(`columns-insights-${groups.length}-cols`);
  block.replaceChildren(...groups);
}
