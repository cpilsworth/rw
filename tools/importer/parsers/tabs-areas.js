/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-areas. Base: tabs.
 * Source: https://www.robertwalters.co.uk/ (.rw-links-content)
 * Generated: 2026-09-30
 *
 * Block content model (blocks/tabs-areas): one row per tab, two cells:
 *   [ label (link to the expertise page) | panel (image, heading, description, CTA) ]
 *
 * The section title h2.rw-links-content__title is default content (see
 * page-templates.json section "areas-we-recruit"), so it is moved out of the
 * block and kept in the DOM immediately before the block table.
 *
 * Iteration: keyed on li.rw-links-content__list-item (labels) and
 * li.rw-links-content__cards-list-item (panels) — block-level list items, not
 * the anchors. Panels are paired with labels by href, falling back to index.
 */
function normalize(href) {
  if (!href) return '';
  try {
    return new URL(href, 'https://www.robertwalters.co.uk/').pathname.replace(/\/$/, '');
  } catch (e) {
    return href;
  }
}

export default function parse(element, { document }) {
  const title = element.querySelector('.rw-links-content__title')
    || element.querySelector(':scope > h2, :scope > h3');

  let labelItems = [...element.querySelectorAll('.rw-links-content__link-list > li')];
  if (!labelItems.length) labelItems = [...element.querySelectorAll('.rw-links-content__list-item')];

  // Panels keyed by destination href.
  const cardItems = [...element.querySelectorAll('.rw-links-content__cards-list > li')];
  const panels = cardItems.map((li) => {
    const body = li.querySelector('.feature-card__body');
    const anchor = li.querySelector('a[href]') || (body && body.closest('a[href]'));
    return {
      href: normalize(anchor && anchor.getAttribute('href')),
      rawHref: anchor && anchor.getAttribute('href'),
      img: li.querySelector('.feature-card__image img, img'),
      heading: li.querySelector('.feature-card__heading'),
      description: li.querySelector('.feature-card__description'),
      cta: li.querySelector('.feature-card__cta'),
    };
  });

  if (!labelItems.length && !panels.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const used = new Set();
  const cells = [];
  labelItems.forEach((li, i) => {
    const a = li.querySelector('a[href]');
    const text = (li.querySelector('.rw-links-content__item-link__wrapper__text') || a || li).textContent.trim();
    if (!text) return;

    let labelCell;
    if (a) {
      labelCell = document.createElement('a');
      labelCell.href = a.getAttribute('href');
      labelCell.textContent = text;
    } else {
      labelCell = text;
    }

    const href = normalize(a && a.getAttribute('href'));
    let panel = panels.find((p, idx) => !used.has(idx) && href && p.href === href);
    if (!panel && panels[i] && !used.has(i)) panel = panels[i];
    const panelCell = [];
    if (panel) {
      used.add(panels.indexOf(panel));
      if (panel.img) panelCell.push(panel.img);
      if (panel.heading) {
        const h = document.createElement('h3');
        h.textContent = panel.heading.textContent.trim();
        panelCell.push(h);
      }
      if (panel.description) {
        const p = document.createElement('p');
        p.textContent = panel.description.textContent.trim();
        panelCell.push(p);
      }
      const ctaHref = panel.rawHref || (a && a.getAttribute('href'));
      if (ctaHref) {
        const p = document.createElement('p');
        const link = document.createElement('a');
        link.href = ctaHref;
        link.textContent = (panel.cta && panel.cta.textContent.trim()) || 'Learn More';
        p.append(link);
        panelCell.push(p);
      }
    }
    cells.push([labelCell, panelCell.length ? panelCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-areas', cells });

  // Keep the section heading as default content before the block.
  if (title) element.before(title);
  element.replaceWith(block);
}
