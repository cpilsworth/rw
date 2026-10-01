import { createOptimizedPicture } from '../../scripts/aem.js';

const OPTION_CLASSES = [];

function isImageOnly(cell) {
  const pic = cell.querySelector('picture');
  if (!pic) return false;
  const clone = cell.cloneNode(true);
  clone.querySelectorAll('picture').forEach((p) => p.remove());
  return !clone.textContent.trim();
}

function isLinkOnly(el) {
  if (el.tagName !== 'P') return false;
  const links = el.querySelectorAll('a');
  return links.length === 1 && el.textContent.trim() === links[0].textContent.trim();
}

/* wrap trailing CTA paragraphs (button + plain link) in a single actions row */
function groupActions(cell) {
  const actions = [];
  let el = cell.lastElementChild;
  while (el && isLinkOnly(el)) {
    actions.unshift(el);
    el = el.previousElementSibling;
  }
  if (!actions.length) return;
  const wrap = document.createElement('div');
  wrap.className = 'columns-promo-actions';
  actions[0].before(wrap);
  wrap.append(...actions);
}

export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  const rows = [...block.children];
  rows.forEach((row) => {
    row.classList.add('columns-promo-row');
    const cells = [...row.children].filter((cell) => cell.textContent.trim() || cell.querySelector('picture'));
    [...row.children].forEach((cell) => {
      if (!cells.includes(cell)) cell.remove();
    });

    cells.forEach((cell) => {
      if (isImageOnly(cell)) {
        cell.className = 'columns-promo-media';
        cell.querySelectorAll('picture > img').forEach((img) => {
          img.closest('picture').replaceWith(
            createOptimizedPicture(img.src, img.alt, false, [
              { media: '(width >= 900px)', width: '900' },
              { width: '750' },
            ]),
          );
        });
      } else {
        cell.className = 'columns-promo-text';
        groupActions(cell);
      }
    });

    if (!row.querySelector('.columns-promo-media')) row.classList.add('columns-promo-row-text-only');
    if (!row.querySelector('.columns-promo-text')) row.classList.add('columns-promo-row-media-only');
    if (!row.children.length) row.remove();
  });
}
