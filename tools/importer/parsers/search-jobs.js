/* eslint-disable */
/* global WebImporter */
/**
 * Parser for search-jobs. Base: search.
 * Source: https://www.robertwalters.co.uk/ (.rw-jobs-search-box)
 * Generated: 2026-09-30
 *
 * Block content model (blocks/search-jobs/search-jobs.js readConfig): one column,
 * rows classified by content:
 *   - plain-text row      -> label ("Looking for a job?")
 *   - first link row      -> form action + submit button label
 *   - list row (ul)       -> location options
 *   - further link rows   -> secondary links ("Looking to hire?")
 */
const DEFAULT_ACTION = '/jobs.html';

export default function parse(element, { document }) {
  const title = element.querySelector('.job-search-box__title, .title, h2, h3');
  const form = element.querySelector('form');
  const button = element.querySelector('form button, form [type="submit"]');
  const options = [...element.querySelectorAll('select option')]
    .filter((o) => !o.classList.contains('placeholder') && o.textContent.trim()
      && o.textContent.trim().toLowerCase() !== 'location');
  const secondaryLinks = [...element.querySelectorAll('.job-search-box__link a[href], .additional-link a[href]')];

  if (!title && !form && !secondaryLinks.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row: label
  const labelText = (title && title.textContent.trim()) || 'Looking for a job?';
  const label = document.createElement('p');
  label.textContent = labelText;
  cells.push([label]);

  // Row: search action + button label
  // The live form posts to a server-side redirect service
  // (/services/search-service/...) which does not exist on EDS; use the jobs
  // page unless the form targets a regular page.
  const formAction = form && form.getAttribute('action');
  const action = formAction && !/\/services\//.test(formAction) ? formAction : DEFAULT_ACTION;
  const actionLink = document.createElement('a');
  actionLink.href = action;
  actionLink.textContent = (button && button.textContent.trim()) || 'Search';
  cells.push([actionLink]);

  // Row: location list
  if (options.length) {
    const ul = document.createElement('ul');
    options.forEach((o) => {
      const li = document.createElement('li');
      li.textContent = o.textContent.trim();
      ul.append(li);
    });
    cells.push([ul]);
  }

  // Rows: secondary links
  secondaryLinks.forEach((a) => {
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    link.textContent = a.textContent.trim();
    cells.push([link]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'search-jobs', cells });
  element.replaceWith(block);
}
