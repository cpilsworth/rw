/*
 * Footer block (content-first).
 * All copy, links and images come from the footer fragment; this file only classifies the
 * fragment's top-level sections by their content and builds the layout shell around them:
 *   promo band  - section with a heading and images but no lists (image + panel + CTA)
 *   main band   - brand section (image link only) + link columns (headings + lists)
 *   bottom band - section with an icon-only link list (social) + legal text
 */

// Lists longer than this render as a multi-column "wide" group (e.g. a country list).
const WIDE_LIST_MIN_ITEMS = 12;
// Number of link groups that stay ahead of a wide group in the stacked (mobile) layout.
const STACKED_ROW_SIZE = 2;

/**
 * Fetches the footer fragment. Metadata-independent dual fetch:
 * /content/footer.plain.html (local aem up) first, then /footer.plain.html (DA/EDS).
 * @returns {Promise<HTMLElement[]|null>} top-level section elements
 */
async function fetchFooterSections() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  // DOMParser keeps the markup inert until relative image paths are resolved
  const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
  const base = new URL(resp.url || '/footer.plain.html', window.location.href);
  doc.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (!/^(https?:|data:|\/)/.test(src)) img.setAttribute('src', new URL(src, base).href);
    img.setAttribute('loading', 'lazy');
  });
  return [...doc.body.children].filter((node) => node.tagName === 'DIV');
}

function el(tag, className, children = []) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  children.filter(Boolean).forEach((child) => node.append(child));
  return node;
}

const HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6';

/** true when every item of the list is a single link whose only content is an image */
function isIconList(list) {
  const items = [...list.children];
  return items.length > 0 && items.every((li) => {
    const link = li.querySelector('a');
    return link && link.querySelector('img') && !link.textContent.trim();
  });
}

/** true when a paragraph holds nothing but one link (optionally wrapped in strong/em) */
function isLoneLinkParagraph(p) {
  const links = p.querySelectorAll('a');
  return links.length === 1 && p.textContent.trim() === links[0].textContent.trim();
}

function classifySection(section) {
  const hasHeading = !!section.querySelector(HEADING_SELECTOR);
  const lists = [...section.querySelectorAll('ul, ol')];
  if (lists.some(isIconList)) return 'bottom';
  if (hasHeading && lists.length === 0 && section.querySelector('img')) return 'promo';
  if (!hasHeading && lists.length === 0) {
    const links = [...section.querySelectorAll('a')];
    if (links.length && links.every((a) => a.querySelector('img') && !a.textContent.trim())) return 'brand';
  }
  return 'column';
}

/** opens the site's consent manager when one is present */
function openConsentPreferences() {
  const { OneTrust } = window;
  if (OneTrust && typeof OneTrust.ToggleInfoDisplay === 'function') {
    OneTrust.ToggleInfoDisplay();
    return;
  }
  document.dispatchEvent(new CustomEvent('footer:consent-preferences'));
}

/** replaces a "#consent" link paragraph with a real button (fragments cannot hold buttons) */
function buildConsentControl(p) {
  const link = p.querySelector('a');
  const button = el('button', 'footer-consent-button');
  button.type = 'button';
  button.textContent = link.textContent.trim();
  button.addEventListener('click', openConsentPreferences);
  return el('div', 'footer-consent', [button]);
}

function isConsentLink(p) {
  if (p.tagName !== 'P' || !isLoneLinkParagraph(p)) return false;
  const href = p.querySelector('a').getAttribute('href') || '';
  return /#consent$/i.test(href);
}

function buildPromoBand(section) {
  const images = [...section.querySelectorAll('img')];
  const media = images.map((img, i) => el('div', `footer-promo-media footer-promo-media-${i + 1}`, [img]));
  const content = el('div', 'footer-promo-content');
  [...section.children].forEach((child) => {
    // paragraphs that only held an image are empty once the image moved into a media slot
    if (child.matches('p') && !child.textContent.trim() && !child.querySelector('a, img')) return;
    if (child.matches(HEADING_SELECTOR)) child.classList.add('footer-promo-heading');
    else if (child.matches('p') && isLoneLinkParagraph(child)) {
      child.className = 'footer-promo-cta';
      child.querySelector('a').classList.add('footer-promo-button');
    } else if (child.matches('p')) child.classList.add('footer-promo-text');
    content.append(child);
  });
  return el('div', 'footer-band footer-promo', [el('div', 'footer-promo-panel'), ...media, content]);
}

function buildBrand(section) {
  const brand = el('div', 'footer-brand');
  section.querySelectorAll('a').forEach((a) => {
    a.classList.add('footer-brand-link');
    brand.append(a);
  });
  return brand;
}

/** groups heading + following list pairs of one column; returns { column, groups } */
function buildColumn(section) {
  const column = el('div', 'footer-column');
  const groups = [];
  let current = null;
  [...section.children].forEach((child) => {
    if (child.matches(HEADING_SELECTOR)) {
      current = el('div', 'footer-link-group', [child]);
      child.classList.add('footer-link-heading');
      groups.push(current);
      column.append(current);
    } else if (child.matches('ul, ol')) {
      child.classList.add('footer-link-list');
      if (!current) {
        current = el('div', 'footer-link-group');
        groups.push(current);
        column.append(current);
      }
      current.append(child);
      if (child.children.length > WIDE_LIST_MIN_ITEMS) {
        current.classList.add('footer-link-group-wide');
        column.classList.add('footer-column-wide');
      }
      current = null;
    } else if (isConsentLink(child)) {
      column.append(buildConsentControl(child));
      current = null;
    } else if (child.textContent.trim()) {
      child.classList.add('footer-link-note');
      column.append(child);
    }
  });
  return { column, groups };
}

/**
 * Stacked (mobile) reading order: the first row of link groups, then wide groups, then the rest,
 * then consent controls. Exposed as --footer-order; only applies where groups are grid items.
 */
function assignStackedOrder(groups, consentControls) {
  let regular = 0;
  groups.forEach((group) => {
    if (group.classList.contains('footer-link-group-wide')) {
      group.style.setProperty('--footer-order', STACKED_ROW_SIZE);
      return;
    }
    const order = regular < STACKED_ROW_SIZE ? regular : regular + STACKED_ROW_SIZE + 1;
    group.style.setProperty('--footer-order', order);
    regular += 1;
  });
  consentControls.forEach((c) => c.style.setProperty('--footer-order', 1000));
}

function buildMainBand(brandSections, columnSections) {
  const columns = el('div', 'footer-columns');
  const groups = [];
  columnSections.forEach((section) => {
    const built = buildColumn(section);
    groups.push(...built.groups);
    columns.append(built.column);
  });
  assignStackedOrder(groups, [...columns.querySelectorAll('.footer-consent')]);
  return el('div', 'footer-band footer-main', [...brandSections.map(buildBrand), columns]);
}

/** icon-only links become CSS-masked icons so they inherit text colour (hover tint) */
function buildIconLink(link) {
  const img = link.querySelector('img');
  link.classList.add('footer-social-link');
  link.setAttribute('aria-label', img.getAttribute('alt') || link.getAttribute('href'));
  const icon = el('span', 'footer-social-icon');
  icon.setAttribute('aria-hidden', 'true');
  icon.style.setProperty('--footer-icon', `url("${img.getAttribute('src')}")`);
  img.replaceWith(icon);
}

function buildBottomBand(sections) {
  const band = el('div', 'footer-band footer-bottom');
  sections.forEach((section) => {
    [...section.children].forEach((child) => {
      if (child.matches('ul, ol') && isIconList(child)) {
        child.className = 'footer-social';
        child.querySelectorAll('a').forEach(buildIconLink);
      } else {
        child.classList.add('footer-legal');
      }
      band.append(child);
    });
  });
  return band;
}

/** external text links open in a new tab (icon links keep the same tab, as on the source) */
function decorateExternalLinks(root) {
  root.querySelectorAll('a[href]:not(.footer-social-link)').forEach((a) => {
    const url = new URL(a.href, window.location.href);
    if (/^https?:$/.test(url.protocol) && url.hostname !== window.location.hostname) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const sections = await fetchFooterSections();
  block.textContent = '';
  if (!sections || !sections.length) return;

  const byType = {
    promo: [], brand: [], column: [], bottom: [],
  };
  sections.forEach((section) => byType[classifySection(section)].push(section));

  const bands = [];
  byType.promo.forEach((section) => bands.push(buildPromoBand(section)));
  const dark = el('div', 'footer-dark');
  if (byType.brand.length || byType.column.length) {
    dark.append(buildMainBand(byType.brand, byType.column));
  }
  if (byType.bottom.length) dark.append(buildBottomBand(byType.bottom));
  if (dark.children.length) bands.push(dark);

  bands.forEach((band) => block.append(band));
  decorateExternalLinks(block);
}
