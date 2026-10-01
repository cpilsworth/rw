function element(doc, tag, className, children = []) {
  const node = doc.createElement(tag);
  node.className = className;
  node.append(...children);
  return node;
}

function decorateAttributes(sidebar) {
  [...sidebar.querySelectorAll('ul')].forEach((list) => {
    if (!list.querySelector('li > strong')) return;
    const doc = sidebar.ownerDocument;
    const facts = element(doc, 'dl', 'job-detail-attributes');
    [...list.children].forEach((item) => {
      const label = item.querySelector('strong');
      if (!label) {
        facts.append(element(doc, 'div', 'job-detail-fact', [...item.childNodes]));
        return;
      }
      const term = element(doc, 'dt', '', [...label.childNodes]);
      label.remove();
      const value = element(doc, 'dd', '', [...item.childNodes]);
      facts.append(element(doc, 'div', 'job-detail-fact', [term, value]));
    });
    list.replaceWith(facts);
  });
}

function decorateActions(sidebar) {
  const paragraphs = [...sidebar.querySelectorAll('p')]
    .filter((p) => p.querySelector('a.button, strong > a, em > a'));
  if (!paragraphs.length) return;
  const actions = element(sidebar.ownerDocument, 'div', 'job-detail-actions');
  paragraphs[0].before(actions);
  actions.append(...paragraphs);
  actions.querySelectorAll('a').forEach((link) => {
    link.title = `${link.textContent.trim()} on the official Robert Walters website`;
  });
}

function decorateShare(sidebar) {
  sidebar.querySelectorAll('ul').forEach((list) => {
    list.classList.add('job-detail-share-links');
  });
  const link = sidebar.querySelector('a[href$="#copy-job-link"]');
  if (!link) return;
  const doc = sidebar.ownerDocument;
  const url = new URL(link.href);
  url.hash = '';
  const button = element(doc, 'button', 'job-detail-copy', [link.textContent]);
  button.type = 'button';
  const status = element(doc, 'p', 'job-detail-copy-status');
  status.setAttribute('role', 'status');
  const paragraph = link.closest('p');
  link.replaceWith(button);
  (paragraph || button).after(status);
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url.href);
      status.textContent = 'Link copied';
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Unable to copy the job link', error);
      status.textContent = 'Could not copy the link. Please use one of the sharing links instead.';
    }
  });
}

export default function decorate(block) {
  const doc = block.ownerDocument;
  const header = element(doc, 'div', 'job-detail-header');
  const description = element(doc, 'div', 'job-detail-description');
  const sidebar = element(doc, 'aside', 'job-detail-sidebar');
  const cells = [...block.children].flatMap((row) => [...row.children]);

  cells.forEach((cell) => {
    if (!cell.textContent.trim() && !cell.querySelector('picture, img')) return;
    if (cell.querySelector('h1')) {
      const breadcrumbs = cell.querySelector('ol');
      if (breadcrumbs) {
        const nav = element(doc, 'nav', 'job-detail-breadcrumbs', [breadcrumbs]);
        nav.setAttribute('aria-label', 'Breadcrumb');
        breadcrumbs.lastElementChild?.setAttribute('aria-current', 'page');
        cell.prepend(nav);
      }
      cell.querySelectorAll('p').forEach((p) => p.classList.add('job-detail-save'));
      header.append(...cell.childNodes);
    } else if (cell.querySelector('ul > li > strong')
      || [...cell.querySelectorAll('h2')].some((heading) => heading.textContent.trim() === 'About the job')) {
      sidebar.append(...cell.childNodes);
    } else {
      description.append(...cell.childNodes);
    }
  });

  decorateAttributes(sidebar);
  decorateActions(sidebar);
  decorateShare(sidebar);

  const body = element(doc, 'div', 'job-detail-body');
  if (description.childNodes.length) body.append(description);
  if (sidebar.childNodes.length) body.append(sidebar);
  if (description.childNodes.length && sidebar.childNodes.length) {
    body.classList.add('job-detail-body-with-sidebar');
  }
  block.replaceChildren(
    ...(header.childNodes.length ? [header] : []),
    ...(body.childNodes.length ? [body] : []),
  );
}
