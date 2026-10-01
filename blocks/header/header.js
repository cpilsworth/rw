// Desktop layout breakpoint (source switches from hamburger to full nav at 1200px)
const isDesktop = window.matchMedia('(width >= 1200px)');

/**
 * Fetches the nav fragment. Metadata-independent dual fetch:
 * /content/nav.plain.html (local aem up) first, then /nav.plain.html (DA/EDS).
 * @returns {Promise<HTMLElement|null>} container holding the fragment sections
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  // resolve relative image paths against the fragment location, not the page
  const base = new URL(resp.url || '/nav.plain.html', window.location.href);
  wrap.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (!/^(https?:|data:|\/)/.test(src)) img.src = new URL(src, base).href;
    img.loading = 'eager';
  });
  return wrap;
}

function el(tag, className, children = []) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  children.filter(Boolean).forEach((c) => e.append(c));
  return e;
}

/** text nodes (trimmed) of an element, excluding descendant elements */
function ownText(node) {
  return [...node.childNodes]
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent.trim())
    .filter(Boolean)
    .join(' ');
}

/**
 * Splits a list item into text segments separated by <br> / block children.
 * @returns {Array<Array<Node>>}
 */
function segments(li) {
  const segs = [[]];
  [...li.childNodes].forEach((n) => {
    if (n.nodeName === 'BR' || n.nodeName === 'UL') {
      segs.push([]);
      return;
    }
    if (n.nodeType === Node.TEXT_NODE && !n.textContent.trim()) return;
    segs[segs.length - 1].push(n);
  });
  return segs.filter((s) => s.length);
}

function segText(seg) {
  return seg.map((n) => n.textContent).join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Builds a dropdown toggle button from a "<p><img> Label</p>" paragraph.
 */
function buildToggle(p, className) {
  const btn = el('button', className);
  btn.type = 'button';
  btn.setAttribute('aria-expanded', 'false');
  const img = p.querySelector('img');
  if (img) {
    img.setAttribute('aria-hidden', 'true');
    btn.append(el('span', `${className}-icon`, [img]));
  }
  const label = ownText(p);
  btn.append(el('span', `${className}-label`, [label]));
  return btn;
}

/* ---------- megamenu panel builders (generic, content-driven) ---------- */

function buildInfo(section) {
  const info = el('div', 'nav-panel-info');
  const heading = section.querySelector('h3');
  if (heading) info.append(el('p', 'nav-panel-heading', [el('strong', '', [heading.textContent.trim()])]));
  let n = heading ? heading.nextElementSibling : section.querySelector('h2 + *');
  while (n && n.tagName === 'P') {
    const next = n.nextElementSibling;
    const link = n.querySelector('a');
    if (link && n.textContent.trim() === link.textContent.trim()) {
      link.className = 'nav-panel-cta';
      info.append(link);
    } else {
      info.append(el('p', 'nav-panel-intro', [...n.childNodes]));
    }
    n = next;
  }
  return info;
}

function buildGrid(ul) {
  const grid = el('div', 'nav-panel-grid');
  [...ul.children].forEach((li) => {
    const a = li.querySelector('a');
    const segs = segments(li);
    const item = el('a', 'nav-panel-item');
    item.href = a.href;
    item.append(el('strong', '', [a.textContent.trim()]));
    const desc = segs.slice(1).map(segText).join(' ');
    if (desc) item.append(' ', el('span', 'nav-panel-item-info', [desc]));
    grid.append(item);
  });
  return el('div', 'nav-panel-col nav-panel-col-grid', [grid]);
}

function buildLinkLists(ul) {
  const cols = [...ul.children].map((li) => {
    const first = li.firstElementChild;
    const head = first && first.tagName === 'A' ? first : null;
    const heading = el('p', 'nav-link-list-heading');
    if (head && head.getAttribute('href')) {
      heading.append(head);
    } else {
      heading.textContent = head ? head.textContent.trim() : ownText(li);
    }
    const list = li.querySelector('ul');
    list.className = 'nav-link-list-items';
    const col = el('div', 'nav-panel-col nav-panel-col-list', [el('div', 'nav-link-list', [heading, list])]);
    if (list.children.length > 12) col.classList.add('nav-panel-col-wide');
    return col;
  });
  if (cols.length >= 3) cols.forEach((c) => c.classList.add('nav-panel-col-narrow'));
  return cols;
}

function buildMedia(ul) {
  const col = el('div', 'nav-panel-col nav-panel-col-media');
  [...ul.children].forEach((li) => {
    const img = li.querySelector('img');
    const links = [...li.querySelectorAll('a')];
    const link = links[links.length - 1];
    const strong = li.querySelector('strong');
    const segs = segments(li);
    if (strong) {
      // card: image, title, description, link
      const card = el('div', 'nav-card');
      card.append(el('div', 'nav-card-image', [img]));
      const body = el('div', 'nav-card-body', [el('p', 'nav-card-title', [strong.textContent.trim()])]);
      const skip = [strong.textContent.trim(), link.textContent.trim()];
      const desc = segs.map(segText).filter((t) => t && !skip.includes(t));
      if (desc.length) body.append(el('p', 'nav-card-text', [desc.join(' ')]));
      link.className = 'nav-panel-cta';
      body.append(link);
      card.append(el('div', 'nav-card-content', [body]));
      col.append(card);
    } else {
      // horizontal tile: thumbnail, eyebrow, title (whole tile is the link)
      const tile = el('a', 'nav-tile');
      tile.href = link.href;
      const eyebrow = li.querySelector('em');
      tile.append(el('div', 'nav-tile-image', [img]));
      tile.append(el('span', 'nav-tile-text', [
        eyebrow ? el('span', 'nav-tile-eyebrow', [eyebrow.textContent.trim()]) : null,
        eyebrow ? ' ' : null,
        el('span', 'nav-tile-title', [link.textContent.trim()]),
      ]));
      col.append(tile);
    }
  });
  return col;
}

function buildPanel(section, footerLinks) {
  const panel = el('div', 'nav-panel');
  const body = el('div', 'nav-panel-body');
  body.append(el('div', 'nav-panel-col nav-panel-col-info', [buildInfo(section)]));
  [...section.children].filter((c) => c.tagName === 'UL').forEach((ul) => {
    const first = ul.firstElementChild;
    if (!first) return;
    if (first.querySelector('img')) body.append(buildMedia(ul));
    else if (first.querySelector('ul')) buildLinkLists(ul).forEach((c) => body.append(c));
    else body.append(buildGrid(ul));
  });
  if (body.querySelector('.nav-panel-col-media')) body.classList.add('nav-panel-body-has-media');
  panel.append(body);
  if (footerLinks.length) {
    const inner = el('div', 'nav-panel-footer-inner');
    footerLinks.forEach((a, i) => {
      if (i) inner.append(el('span', 'nav-panel-footer-divider'));
      const c = a.cloneNode(true);
      c.className = 'nav-panel-footer-link';
      inner.append(c);
    });
    panel.append(el('div', 'nav-panel-footer', [inner]));
  }
  return panel;
}

/* ---------- state helpers ---------- */

function setExpanded(btn, expanded) {
  if (btn) btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
}

// nav item -> its megamenu/accordion panel (panels move between the item and a
// shared desktop container, so they are tracked here rather than by DOM position)
const panelFor = new WeakMap();

function setItemOpen(li, open) {
  li.setAttribute('aria-expanded', open ? 'true' : 'false');
  setExpanded(li.querySelector('.nav-item-toggle'), open);
  const panel = panelFor.get(li);
  if (panel) panel.classList.toggle('nav-panel-open', open);
}

function closeMegamenus(nav) {
  nav.querySelectorAll('.nav-item').forEach((li) => setItemOpen(li, false));
  nav.classList.remove('nav-has-open-item');
}

function openMegamenu(nav, li) {
  nav.querySelectorAll('.nav-item').forEach((o) => setItemOpen(o, o === li));
  nav.classList.add('nav-has-open-item');
}

/**
 * Desktop: panels live in one shared container after the trigger list (as on the
 * source). Mobile: each panel sits inside its item so the accordion expands in place.
 */
function placePanels(list, container) {
  list.querySelectorAll('.nav-item').forEach((li) => {
    const panel = panelFor.get(li);
    if (!panel) return;
    if (isDesktop.matches) container.append(panel);
    else li.append(panel);
  });
}

function closeDropdowns(nav, except) {
  nav.querySelectorAll('.nav-dropdown-toggle[aria-expanded="true"]').forEach((b) => {
    if (b !== except) setExpanded(b, false);
  });
}

function toggleMobileMenu(nav, force) {
  const open = typeof force === 'boolean' ? force : nav.getAttribute('aria-expanded') !== 'true';
  nav.setAttribute('aria-expanded', open ? 'true' : 'false');
  const burger = nav.querySelector('.nav-hamburger');
  if (burger) {
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  }
  document.body.classList.toggle('nav-mobile-open', open && !isDesktop.matches);
  if (!open) closeMegamenus(nav);
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  block.textContent = '';
  if (!fragment) return;

  const sections = [...fragment.children].filter((c) => c.tagName === 'DIV');
  const panelSections = sections.filter((s) => s.querySelector(':scope > h2'));
  const others = sections.filter((s) => !panelSections.includes(s));
  const brandSection = others.find((s) => s.querySelector('a img') && !s.querySelector('ul'));
  const firstPanelIdx = sections.indexOf(panelSections[0]);
  const utilitySection = others
    .find((s) => s !== brandSection && sections.indexOf(s) < firstPanelIdx);
  const toolsSection = others.find((s) => s !== brandSection && s !== utilitySection);

  const nav = el('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');
  nav.setAttribute('aria-label', 'Main navigation');

  /* row 0: utility bar */
  let footerLinks = [];
  const utility = el('div', 'nav-utility');
  if (utilitySection) {
    const inner = el('div', 'nav-utility-inner');
    const lists = [...utilitySection.querySelectorAll(':scope > ul')];
    const linksUl = lists[0];
    if (linksUl) {
      linksUl.className = 'nav-utility-links';
      footerLinks = [...linksUl.querySelectorAll('a')];
      inner.append(linksUl);
    }
    const langP = utilitySection.querySelector(':scope > p');
    if (langP) {
      const toggle = buildToggle(langP, 'nav-lang-toggle');
      toggle.classList.add('nav-dropdown-toggle');
      toggle.setAttribute('aria-controls', 'nav-lang-panel');
      inner.append(toggle);
      const langPanel = el('div', 'nav-lang-panel');
      langPanel.id = 'nav-lang-panel';
      const sib = langP.nextElementSibling;
      const langList = sib && sib.tagName === 'UL' ? sib : null;
      if (langList) {
        langList.className = 'nav-lang-list';
        langPanel.append(el('div', 'nav-lang-inner', [langList]));
      }
      utility.append(inner, langPanel);
      toggle.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') !== 'true';
        closeDropdowns(nav, toggle);
        setExpanded(toggle, open);
      });
    } else {
      utility.append(inner);
    }
  }

  /* row 1: main bar */
  const bar = el('div', 'nav-bar');
  const barInner = el('div', 'nav-bar-inner');
  const brand = el('div', 'nav-brand');
  if (brandSection) {
    const link = brandSection.querySelector('a');
    link.className = 'nav-brand-link';
    brand.append(link);
  }

  const sectionsWrap = el('div', 'nav-sections');
  const list = el('ul', 'nav-list');
  const panels = el('div', 'nav-panels');
  panelSections.forEach((section) => {
    const trigger = section.querySelector(':scope > h2 a') || section.querySelector(':scope > h2');
    const li = el('li', 'nav-item');
    li.setAttribute('aria-expanded', 'false');
    const a = el('a', 'nav-trigger', [trigger.textContent.trim()]);
    if (trigger.href) a.href = trigger.href;
    a.setAttribute('aria-haspopup', 'true');
    const expand = el('button', 'nav-item-toggle', [trigger.textContent.trim()]);
    expand.type = 'button';
    expand.setAttribute('aria-expanded', 'false');
    const panel = buildPanel(section, footerLinks);
    panelFor.set(li, panel);
    li.append(a, expand);
    list.append(li);

    // desktop hover: trigger and its panel form one hover zone
    const open = () => {
      if (!isDesktop.matches) return;
      closeDropdowns(nav);
      openMegamenu(nav, li);
    };
    const leave = (e) => {
      if (!isDesktop.matches) return;
      const to = e.relatedTarget;
      if (to && (li.contains(to) || panel.contains(to))) return;
      closeMegamenus(nav);
    };
    li.addEventListener('mouseenter', open);
    li.addEventListener('mouseleave', leave);
    li.addEventListener('focusin', open);
    panel.addEventListener('mouseenter', open);
    panel.addEventListener('mouseleave', leave);
    panel.addEventListener('focusin', open);
    // mobile accordion: the toggle row expands its panel in place (one open at a time)
    expand.addEventListener('click', () => {
      const willOpen = li.getAttribute('aria-expanded') !== 'true';
      list.querySelectorAll('.nav-item').forEach((o) => setItemOpen(o, o === li && willOpen));
    });
  });
  sectionsWrap.append(list, panels);
  placePanels(list, panels);

  /* account dropdown */
  const account = el('div', 'nav-account');
  if (toolsSection) {
    const p = toolsSection.querySelector(':scope > p');
    const toggle = buildToggle(p, 'nav-account-toggle');
    toggle.classList.add('nav-dropdown-toggle');
    toggle.setAttribute('aria-controls', 'nav-account-panel');
    const panel = el('div', 'nav-account-panel');
    panel.id = 'nav-account-panel';
    // signed-in links (a text-link list after the social icons) render in a second
    // panel that stays collapsed for anonymous visitors, as on the source
    const signedIn = el('div', 'nav-account-panel nav-account-panel-signed-in');
    signedIn.inert = true;
    let target = panel;
    let n = p.nextElementSibling;
    while (n) {
      const next = n.nextElementSibling;
      const links = n.tagName === 'UL' ? [...n.querySelectorAll('a')] : [];
      const iconOnly = links.length && links.every((a) => !a.textContent.trim() && a.querySelector('img'));
      if (iconOnly) {
        n.className = 'nav-account-social';
        (target.querySelector('.nav-account-footer') || target).append(n);
        target = signedIn;
      } else if (links.length) {
        const dest = target;
        links.forEach((a) => {
          a.className = 'nav-account-link';
          const icon = a.querySelector('img');
          if (icon) icon.className = 'nav-account-link-icon';
          dest.append(a);
        });
      } else if (n.tagName === 'P') {
        target.append(el('div', 'nav-account-footer', [el('span', 'nav-account-footer-text', [n.textContent.trim()])]));
      }
      n = next;
    }
    account.append(toggle, panel);
    if (signedIn.children.length) account.append(signedIn);
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      closeDropdowns(nav, toggle);
      closeMegamenus(nav);
      setExpanded(toggle, open);
    });
  }

  /* hamburger (mobile) */
  const hamburger = el('button', 'nav-hamburger', [el('span', 'nav-hamburger-icon')]);
  hamburger.type = 'button';
  hamburger.setAttribute('aria-controls', 'nav');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.setAttribute('aria-label', 'Open navigation menu');
  hamburger.addEventListener('click', () => toggleMobileMenu(nav));

  /* mobile menu footer (same links as the utility bar) */
  const mobileFooter = el('div', 'nav-mobile-footer');
  footerLinks.forEach((a) => {
    const c = a.cloneNode(true);
    c.className = 'nav-mobile-footer-link';
    mobileFooter.append(c);
  });
  sectionsWrap.append(mobileFooter);

  barInner.append(brand, sectionsWrap, account, hamburger);
  bar.append(barInner);
  nav.append(utility, bar);

  const overlay = el('div', 'nav-overlay');
  overlay.setAttribute('aria-hidden', 'true');
  const navWrapper = el('div', 'nav-wrapper', [overlay, nav]);
  block.append(navWrapper);

  // close open dropdowns on outside click / Escape
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-dropdown-toggle, .nav-account-panel, .nav-lang-panel')) {
      // keep language bar open until its toggle is clicked again (matches source)
      closeDropdowns(nav, nav.querySelector('.nav-lang-toggle'));
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeDropdowns(nav);
    if (isDesktop.matches) closeMegamenus(nav);
    else toggleMobileMenu(nav, false);
  });
  nav.addEventListener('focusout', (e) => {
    if (isDesktop.matches && !nav.contains(e.relatedTarget)) closeMegamenus(nav);
  });

  /* viewport resize: reset state when crossing the breakpoint */
  isDesktop.addEventListener('change', () => {
    toggleMobileMenu(nav, false);
    closeMegamenus(nav);
    closeDropdowns(nav);
    placePanels(list, panels);
  });
}
