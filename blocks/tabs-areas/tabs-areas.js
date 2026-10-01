import { createOptimizedPicture, toClassName } from '../../scripts/aem.js';

const OPTION_CLASSES = [];

let blockCounter = 0;

export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));
  blockCounter += 1;
  const prefix = `tabs-areas-${blockCounter}`;

  const list = document.createElement('ul');
  list.className = 'tabs-areas-list';
  const panels = document.createElement('div');
  panels.className = 'tabs-areas-panels';

  const items = [];

  [...block.children].forEach((row, i) => {
    const [labelCell, ...contentCells] = [...row.children];
    if (!labelCell || !labelCell.textContent.trim()) return;

    const id = `${prefix}-${toClassName(labelCell.textContent) || i}`;
    const li = document.createElement('li');
    li.className = 'tabs-areas-item';

    // the label stays a real link when authored as one; otherwise a focusable button
    const authoredLink = labelCell.querySelector('a[href]');
    let trigger;
    if (authoredLink) {
      trigger = authoredLink;
      trigger.classList.remove('button', 'primary', 'secondary', 'accent');
    } else {
      trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.textContent = labelCell.textContent.trim();
    }
    trigger.classList.add('tabs-areas-trigger');
    trigger.id = `${id}-trigger`;
    // label wrapper (vertically centred) + inline text so the underline follows each text line
    const label = document.createElement('span');
    label.className = 'tabs-areas-trigger-label';
    const text = document.createElement('span');
    text.className = 'tabs-areas-trigger-text';
    text.append(...trigger.childNodes);
    label.append(text);
    trigger.append(label);
    li.append(trigger);
    list.append(li);

    let panel = null;
    const content = contentCells.filter((c) => c.textContent.trim() || c.querySelector('picture'));
    if (content.length) {
      panel = document.createElement('div');
      panel.className = 'tabs-areas-panel';
      panel.id = `${id}-panel`;
      panel.setAttribute('role', 'region');
      panel.setAttribute('aria-labelledby', trigger.id);
      content.forEach((cell) => panel.append(...cell.childNodes));
      // wrapTextNodes() wraps a picture-first cell in one <p>; unwrap it so block children survive
      const blockChild = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol']
        .map((tag) => `:scope > ${tag}`).join(', ');
      [...panel.children].forEach((el) => {
        if (el.tagName === 'P' && el.querySelector(blockChild)) {
          el.replaceWith(...el.childNodes);
        }
      });

      const pic = panel.querySelector('picture');
      if (pic) {
        const picWrapper = document.createElement('div');
        picWrapper.className = 'tabs-areas-panel-image';
        const parent = pic.parentElement;
        picWrapper.append(pic);
        const parentEmpty = !parent.textContent.trim() && !parent.children.length;
        if (parent !== panel && parentEmpty) parent.remove();
        panel.prepend(picWrapper);
      }
      const body = document.createElement('div');
      body.className = 'tabs-areas-panel-body';
      [...panel.children].forEach((el) => {
        if (!el.classList.contains('tabs-areas-panel-image')) body.append(el);
      });
      panel.append(body);
      trigger.setAttribute('aria-controls', panel.id);
      panels.append(panel);
    }
    items.push({ li, trigger, panel });
  });

  panels.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]),
    );
  });

  const activate = (item) => {
    if (!item.panel) return;
    items.forEach(({ li, trigger, panel }) => {
      const isActive = trigger === item.trigger;
      li.classList.toggle('tabs-areas-item-active', isActive);
      if (panel) panel.setAttribute('aria-hidden', String(!isActive));
    });
  };

  items.forEach((item) => {
    item.trigger.addEventListener('mouseenter', () => activate(item));
    item.trigger.addEventListener('focus', () => activate(item));
    if (item.trigger.tagName === 'BUTTON') {
      item.trigger.addEventListener('click', () => activate(item));
    }
  });

  const first = items.find((item) => item.panel);
  if (first) activate(first);
  else block.classList.add('tabs-areas-no-panels');

  const children = [list];
  if (panels.children.length) children.push(panels);
  block.replaceChildren(...children);
}
