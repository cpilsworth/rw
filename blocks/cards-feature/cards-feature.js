import { createOptimizedPicture } from '../../scripts/aem.js';

const OPTION_CLASSES = [];

function isImageOnly(cell) {
  if (!cell.querySelector('picture')) return false;
  const clone = cell.cloneNode(true);
  clone.querySelectorAll('picture').forEach((p) => p.remove());
  return !clone.textContent.trim();
}

export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const cells = [...row.children].filter((cell) => cell.textContent.trim() || cell.querySelector('picture'));
    if (!cells.length) return;

    const li = document.createElement('li');
    li.className = 'cards-feature-card';
    let body;
    cells.forEach((cell) => {
      if (isImageOnly(cell) && !li.querySelector('.cards-feature-card-image')) {
        cell.className = 'cards-feature-card-image';
        li.append(cell);
      } else {
        // merge any additional text cells into a single body
        if (!body) {
          body = document.createElement('div');
          body.className = 'cards-feature-card-body';
        }
        body.append(...cell.childNodes);
      }
    });
    if (body) li.append(body);

    // make the whole image clickable when the card has a single destination link
    const links = body ? [...body.querySelectorAll('a[href]')] : [];
    const image = li.querySelector('.cards-feature-card-image');
    if (image && links.length === 1) {
      const a = document.createElement('a');
      a.href = links[0].href;
      a.tabIndex = -1;
      a.setAttribute('aria-hidden', 'true');
      a.append(...image.childNodes);
      image.append(a);
    }
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]),
    );
  });

  block.replaceChildren(ul);
}
