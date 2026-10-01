const OPTION_CLASSES = [];

const DEFAULT_ACTION = '/jobs';
const KEYWORD_PARAM = 'keyword';
const LOCATION_PARAM = 'location';

let idCounter = 0;

/**
 * Reads the authored rows into a config object. Rows are classified by content,
 * not position, so authors may omit or reorder rows.
 * @param {Element} block
 */
function readConfig(block) {
  const config = {
    label: '',
    action: '',
    buttonLabel: '',
    locations: [],
    secondaryLinks: [],
  };

  [...block.children].forEach((row) => {
    const list = row.querySelector('ul, ol');
    if (list) {
      config.locations.push(...[...list.querySelectorAll('li')]
        .map((li) => li.textContent.trim())
        .filter(Boolean));
      return;
    }
    const link = row.querySelector('a[href]');
    if (link) {
      if (!config.action) {
        config.action = link.getAttribute('href');
        config.buttonLabel = link.textContent.trim();
      } else {
        config.secondaryLinks.push(link);
      }
      return;
    }
    const text = row.textContent.trim();
    if (!text) return;
    // a single cell with comma-separated values reads as a location list
    if (config.label && text.includes(',')) {
      config.locations.push(...text.split(',').map((t) => t.trim()).filter(Boolean));
    } else if (!config.label) {
      config.label = text;
    }
  });

  // a link whose text is a URL is not a sensible button label
  if (!config.buttonLabel || /^(https?:)?\//.test(config.buttonLabel)) config.buttonLabel = 'Search';
  if (!config.action) config.action = DEFAULT_ACTION;
  return config;
}

function field(className, control) {
  const wrapper = document.createElement('div');
  wrapper.className = `search-jobs-field ${className}`;
  wrapper.append(control);
  return wrapper;
}

export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));
  const config = readConfig(block);
  idCounter += 1;
  const uid = `search-jobs-${idCounter}`;

  const form = document.createElement('form');
  form.className = 'search-jobs-form';
  form.method = 'get';
  form.action = config.action;
  form.setAttribute('role', 'search');

  const keywordId = `${uid}-keyword`;
  const label = document.createElement('label');
  label.className = 'search-jobs-label';
  label.htmlFor = keywordId;
  label.textContent = config.label || 'Looking for a job?';

  const keyword = document.createElement('input');
  keyword.type = 'search';
  keyword.id = keywordId;
  keyword.name = KEYWORD_PARAM;
  keyword.placeholder = 'Search by job title';
  keyword.autocomplete = 'off';

  form.append(label, field('search-jobs-keyword', keyword));

  if (config.locations.length) {
    const select = document.createElement('select');
    select.name = LOCATION_PARAM;
    select.setAttribute('aria-label', 'Location');
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Location';
    select.append(placeholder);
    config.locations.forEach((loc) => {
      const option = document.createElement('option');
      option.value = loc;
      option.textContent = loc;
      select.append(option);
    });
    form.append(field('search-jobs-location', select));
  }

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'button primary search-jobs-submit';
  submit.textContent = config.buttonLabel;
  form.append(submit);

  // drop empty params so the target URL stays clean
  form.addEventListener('submit', () => {
    form.querySelectorAll('input[name], select[name]').forEach((el) => {
      if (!el.value) el.disabled = true;
    });
    setTimeout(() => {
      form.querySelectorAll('[disabled]').forEach((el) => { el.disabled = false; });
    });
  });

  const children = [form];
  if (config.secondaryLinks.length) {
    const links = document.createElement('div');
    links.className = 'search-jobs-links';
    config.secondaryLinks.forEach((a) => {
      a.className = 'search-jobs-link';
      links.append(a);
    });
    children.push(links);
  }

  block.replaceChildren(...children);
}
