/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-promo. Base: columns.
 * Source: https://www.robertwalters.co.uk/ (.rw-cta, 2 instances)
 * Generated: 2026-09-30
 *
 * Block content model (blocks/columns-promo): one row, two cells:
 *   [ image-only cell | text cell (heading, description, CTAs) ]
 * The block classifies cells by content (image-only -> media, else text).
 *
 * Variations handled:
 *   - heading as h2 or h3 (level preserved)
 *   - one or two CTAs; empty .cmp-button wrappers are skipped
 *   - primary CTA (.cmp-button--primary) wrapped in <strong> (EDS primary button)
 */
export default function parse(element, { document }) {
  const img = element.querySelector('.rw-cta__image img, .cmp-image img, img');
  const heading = element.querySelector('.rw-cta__title')
    || element.querySelector('h1, h2, h3, h4');
  const textEl = element.querySelector('.rw-cta__text, .cmp-text');
  const buttons = [...element.querySelectorAll('.rw-cta__buttons .cmp-button')]
    .filter((b) => b.querySelector('a[href]'));

  if (!heading && !textEl && !buttons.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const textCell = [];
  if (heading) textCell.push(heading);
  if (textEl) {
    const p = document.createElement('p');
    p.innerHTML = textEl.innerHTML;
    textCell.push(p);
  }

  let ctas = buttons.map((b) => ({ a: b.querySelector('a[href]'), primary: b.classList.contains('cmp-button--primary') }));
  if (!ctas.length) {
    ctas = [...element.querySelectorAll('a[href]')].map((a) => ({ a, primary: false }));
  }
  ctas.forEach(({ a, primary }) => {
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    link.textContent = a.textContent.trim();
    if (primary) {
      const strong = document.createElement('strong');
      strong.append(link);
      p.append(strong);
    } else {
      p.append(link);
    }
    textCell.push(p);
  });

  const cells = [[img || '', textCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-promo', cells });
  element.replaceWith(block);
}
