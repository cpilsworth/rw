/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-feature. Base: cards.
 * Source: https://www.robertwalters.co.uk/ (.rw-column-control, 2 instances:
 *   "Our services" and "Customer stories")
 * Generated: 2026-09-30
 *
 * Block content model (blocks/cards-feature + cards convention): one row per card,
 * two cells: [ image | body (text + CTA link) ].
 *
 * Iteration: keyed on the block-level div.rw-column-control__column (iterationSafe),
 * never on the anchors.
 *
 * Variations handled:
 *   - text either as bare text inside .cmp-text or wrapped in <p>
 *   - empty (&nbsp;) .cmp-text spacer components are skipped
 *   - leading <br> spacers inside paragraphs are stripped
 */
function isBlank(node) {
  return !node.textContent.replace(/ /g, ' ').trim();
}

function textParagraphs(textEl, document) {
  const out = [];
  const blockChildren = [...textEl.children].filter((c) => /^(P|H[1-6]|UL|OL)$/.test(c.tagName));
  if (blockChildren.length) {
    blockChildren.forEach((child) => {
      if (isBlank(child)) return;
      // strip leading <br>/whitespace spacers
      while (child.firstChild && (child.firstChild.nodeName === 'BR'
        || (child.firstChild.nodeType === 3 && !child.firstChild.textContent.trim()))) {
        child.firstChild.remove();
      }
      out.push(child);
    });
  } else if (!isBlank(textEl)) {
    const p = document.createElement('p');
    p.innerHTML = textEl.innerHTML.trim();
    out.push(p);
  }
  return out;
}

export default function parse(element, { document }) {
  let columns = [...element.querySelectorAll('.rw-column-control__column')];
  if (!columns.length) {
    const wrapper = element.querySelector('[class*="__wrapper"]') || element;
    columns = [...wrapper.children];
  }

  const cells = [];
  columns.forEach((col) => {
    const img = col.querySelector('.cmp-image img, img');

    const body = [];
    col.querySelectorAll('.cmp-text').forEach((t) => body.push(...textParagraphs(t, document)));

    let ctas = [...col.querySelectorAll('a.cmp-button__cta[href]')];
    if (!ctas.length) ctas = [...col.querySelectorAll('a[href]')].filter((a) => !a.closest('.cmp-text'));
    ctas.forEach((a) => {
      const p = document.createElement('p');
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      link.textContent = a.textContent.trim();
      p.append(link);
      body.push(p);
    });

    if (!img && !body.length) return;
    cells.push([img || '', body.length ? body : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-feature', cells });
  element.replaceWith(block);
}
