import { loadCSS } from './aem.js';

/**
 * Demonstration-site notice.
 *
 * Shown once per browser on first load: makes clear this is a prototype and not
 * the real Robert Walters website. Acknowledging it is remembered in localStorage.
 */

const STORAGE_KEY = 'rw-demo-notice-acknowledged';
const OFFICIAL_URL = 'https://www.robertwalters.co.uk/';

function isAcknowledged() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function acknowledge() {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // storage unavailable (private mode etc.): the notice will show again next visit
  }
}

function el(tag, props = {}, text = '') {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => node.setAttribute(key, value));
  if (text) node.textContent = text;
  return node;
}

async function showNotice() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/demo-notice.css`);

  const dialog = el('dialog', {
    class: 'demo-notice',
    'aria-labelledby': 'demo-notice-title',
    'aria-describedby': 'demo-notice-text',
  });

  const eyebrow = el('p', { class: 'demo-notice-eyebrow' }, 'Demonstration site');
  const title = el('h2', { id: 'demo-notice-title', class: 'demo-notice-title' }, 'This is not the Robert Walters website');
  const text = el('div', { id: 'demo-notice-text', class: 'demo-notice-text' });
  text.append(
    el('p', {}, 'This site is a design prototype built to demonstrate a possible redesign of the Robert Walters UK website on Adobe Edge Delivery Services. It is not operated by, affiliated with or endorsed by Robert Walters plc or any Robert Walters group company.'),
    el('p', {}, 'No recruitment services are offered here. The jobs, forms and accounts on this site are not real. Never submit your CV or personal details on this site.'),
  );

  const actions = el('div', { class: 'demo-notice-actions' });
  const accept = el('button', { type: 'button', class: 'button primary demo-notice-accept' }, 'I understand, continue to the demo');
  const official = el('a', { href: OFFICIAL_URL, class: 'button secondary demo-notice-official' }, 'Go to the official Robert Walters site');
  actions.append(accept, official);

  dialog.append(eyebrow, title, text, actions);

  const { overflow } = document.body.style;
  accept.addEventListener('click', () => {
    acknowledge();
    dialog.close();
  });
  // the notice must be answered: Esc does not dismiss it without acknowledgement
  dialog.addEventListener('cancel', (e) => e.preventDefault());
  dialog.addEventListener('close', () => {
    document.body.style.overflow = overflow;
    dialog.remove();
  });

  document.body.append(dialog);
  document.body.style.overflow = 'hidden';
  dialog.showModal();
  accept.focus();
}

if (!isAcknowledged()) showNotice();
