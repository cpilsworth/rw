/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-insights. Base: columns.
 * Source: https://www.robertwalters.co.uk/ (.rw-latest-articles)
 * Generated: 2026-09-30
 *
 * Block content model (blocks/columns-insights): one row, one cell per column.
 * Within each column cell the block groups flat content as:
 *   header (everything before the first image) -> heading + "View all" link
 *   items  (each item starts at an image)      -> image, then body elements
 *
 * Column 1 ("Talent insights"): .source-card articles -> image, topic link,
 *   title (heading link), excerpt, Read More link, tag links.
 * Column 2 ("Career advice"): .rw-tile tiles -> image, title link.
 *
 * Iteration: tiles are sibling <a class="rw-tile"> wrappers; per the
 * inline-wrapper trap we iterate the inner block wrapper .rw-tile__image and
 * read the href from its closest anchor, with a.rw-tile as fallback.
 * The mobile-only duplicate header (.d-md-none) is skipped.
 */
function link(document, href, text) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  return a;
}

function para(document, ...children) {
  const p = document.createElement('p');
  p.append(...children);
  return p;
}

function header(document, col) {
  const out = [];
  if (!col) return out;
  const title = col.querySelector('.rw-latest-articles__title, h2, h3, h4');
  const viewAll = col.querySelector('.rw-latest-articles__info-link, a[href]');
  if (title) {
    // source column titles are h4 (.rw-latest-articles__title)
    const h = document.createElement('h4');
    h.textContent = title.textContent.trim();
    out.push(h);
  }
  if (viewAll) out.push(para(document, link(document, viewAll.getAttribute('href'), viewAll.textContent.trim())));
  return out;
}

export default function parse(element, { document }) {
  // Desktop headers live in the first .row (col-8 = articles, col-4 = career advice).
  const headRow = element.querySelector(':scope > .row');
  const headCols = headRow ? [...headRow.children] : [];
  const bodyRow = element.querySelector(':scope > .row + .row') || element;
  const bodyCols = [...bodyRow.children];

  // ---- Column 1: article cards ----
  const col1 = header(document, headCols[0]);
  const cardScope = bodyCols[0] || element;
  cardScope.querySelectorAll('.source-card').forEach((card) => {
    const img = card.querySelector('.cmp-image img, img');
    const titleLink = card.querySelector('.source-card__title');
    if (!img && !titleLink) return;
    if (img) col1.push(para(document, img));
    const topic = card.querySelector('.source-card--v2__head__headline');
    if (topic) col1.push(para(document, link(document, topic.getAttribute('href'), topic.textContent.trim())));
    if (titleLink) {
      const h = document.createElement('h4');
      h.append(link(document, titleLink.getAttribute('href'), titleLink.textContent.trim()));
      col1.push(h);
    }
    const text = card.querySelector('.source-card__text');
    if (text && text.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = text.textContent.trim();
      col1.push(p);
    }
    const more = card.querySelector('.source-card__read-more');
    if (more) col1.push(para(document, link(document, more.getAttribute('href'), more.textContent.trim())));
    const tags = [...card.querySelectorAll('.source-card--v2__footer__item')];
    if (tags.length) {
      const p = document.createElement('p');
      tags.forEach((t, i) => {
        if (i) p.append(document.createTextNode(', '));
        const label = t.textContent.trim();
        if (t.tagName === 'A' && t.getAttribute('href')) p.append(link(document, t.getAttribute('href'), label));
        else p.append(document.createTextNode(label));
      });
      col1.push(p);
    }
  });

  // ---- Column 2: career advice tiles ----
  const col2 = header(document, headCols[1]);
  const tileScope = bodyCols[1] || element;
  let tiles = [...tileScope.querySelectorAll('.rw-tile__image')].map((imageWrap) => {
    const tile = imageWrap.closest('.rw-tile') || imageWrap.parentElement;
    const anchor = imageWrap.closest('a[href]');
    return {
      img: imageWrap.querySelector('img'),
      text: tile && tile.querySelector('.rw-tile__text'),
      href: anchor && anchor.getAttribute('href'),
    };
  });
  if (!tiles.length) {
    tiles = [...tileScope.querySelectorAll('a.rw-tile')].map((a) => ({
      img: a.querySelector('img'),
      text: a.querySelector('.rw-tile__text'),
      href: a.getAttribute('href'),
    }));
  }
  tiles.forEach(({ img, text, href }) => {
    const label = text ? text.textContent.trim() : '';
    if (!img && !label) return;
    if (img) col2.push(para(document, img));
    if (label) col2.push(para(document, href ? link(document, href, label) : document.createTextNode(label)));
  });

  if (!col1.length && !col2.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[col1.length ? col1 : '', col2.length ? col2 : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-insights', cells });
  element.replaceWith(block);
}
