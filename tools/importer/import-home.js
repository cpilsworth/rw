/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroVideoParser from './parsers/hero-video.js';
import searchJobsParser from './parsers/search-jobs.js';
import columnsPromoParser from './parsers/columns-promo.js';
import cardsFeatureParser from './parsers/cards-feature.js';
import tabsAreasParser from './parsers/tabs-areas.js';
import columnsInsightsParser from './parsers/columns-insights.js';

// TRANSFORMER IMPORTS
import robertwaltersCleanupTransformer from './transformers/robertwalters-cleanup.js';
import robertwaltersSectionsTransformer from './transformers/robertwalters-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-video': heroVideoParser,
  'search-jobs': searchJobsParser,
  'columns-promo': columnsPromoParser,
  'cards-feature': cardsFeatureParser,
  'tabs-areas': tabsAreasParser,
  'columns-insights': columnsInsightsParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'home',
  description: 'Robert Walters UK homepage: video hero, job search, promos, services, areas we recruit in, insights, customer stories',
  urls: [
    'https://www.robertwalters.co.uk/',
  ],
  blocks: [
    { name: 'hero-video', instances: ['.hero-large.hero-large--style-01'] },
    { name: 'search-jobs', instances: ['.rw-jobs-search-box'] },
    { name: 'columns-promo', instances: ['.rw-cta'] },
    { name: 'cards-feature', instances: ['.rw-column-control'] },
    { name: 'tabs-areas', instances: ['.rw-links-content'] },
    { name: 'columns-insights', instances: ['.rw-latest-articles'] },
  ],
  sections: [
    { id: 'rc2c1c1', name: 'hero', selector: ['.hero-large.hero-large--style-01'], style: null, blocks: ['hero-video'], defaultContent: [] },
    { id: 'rc2c1c2', name: 'job-search', selector: ['.rw-jobs-search-box'], style: null, blocks: ['search-jobs'], defaultContent: [] },
    { id: 'rc2c1c3', name: 'salary-survey-promo', selector: ['main .aem-Grid > .container.responsivegrid:nth-of-type(3)'], style: null, blocks: ['columns-promo'], defaultContent: [] },
    { id: 'rc2c1c4', name: 'our-services', selector: ['main .aem-Grid > .container.responsivegrid:nth-of-type(4)'], style: null, blocks: ['cards-feature'], defaultContent: ['.cmp-container > .text h2'] },
    { id: 'rc2c1c5c1', name: 'areas-we-recruit', selector: ['.links-with-associated-content'], style: null, blocks: ['tabs-areas'], defaultContent: ['h2.rw-links-content__title'] },
    { id: 'rc2c1c5c2', name: 'insights', selector: ['.latest-articles-v2'], style: null, blocks: ['columns-insights'], defaultContent: [] },
    { id: 'rc2c1c5c3', name: 'benefits-guide-promo', selector: ['main .aem-Grid > .container.responsivegrid:nth-of-type(5) > .cmp-container > .rw-cta'], style: null, blocks: ['columns-promo'], defaultContent: [] },
    { id: 'rc2c1c5c4', name: 'customer-stories', selector: ['main .aem-Grid > .container.responsivegrid:nth-of-type(5) > .cmp-container > .rw-column-control'], style: null, blocks: ['cards-feature'], defaultContent: [] },
  ],
};

// TRANSFORMER REGISTRY - cleanup first, then sections
const transformers = [
  robertwaltersCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [robertwaltersSectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. beforeTransform (cleanup + section breaks)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse blocks (skip elements already replaced by an earlier parser)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + section metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path — map the root URL to /index
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
