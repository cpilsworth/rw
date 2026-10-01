/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/hero-video.js
  function parse(element, { document: document2 }) {
    const heading = element.querySelector(".rw-hero__content h1, .rw-hero__content h2") || element.querySelector("h1, h2, h3");
    const paragraphs = [...element.querySelectorAll(".rw-hero__content > p")];
    if (!paragraphs.length) {
      const sub = element.querySelector(".rw-hero__heading");
      const desc = element.querySelector(".rw-hero__description");
      if (sub) paragraphs.push(sub);
      if (desc) paragraphs.push(desc);
    }
    let ctas = [...element.querySelectorAll(".rw-hero__content a.cmp-button__cta")];
    if (!ctas.length) ctas = [...element.querySelectorAll(".rw-hero__content a[href]")];
    const posterImg = element.querySelector(".rw-video-container__thumbnail img, .rw-hero__video img");
    const iframe = element.querySelector(".rw-video-container iframe, iframe[src]");
    let videoLink = null;
    if (iframe && iframe.getAttribute("src")) {
      let href = iframe.getAttribute("src");
      const vimeo = href.match(/player\.vimeo\.com\/video\/(\d+)/);
      if (vimeo) href = `https://vimeo.com/${vimeo[1]}`;
      if (href.startsWith("//")) href = `https:${href}`;
      const label = element.querySelector(".rw-video-container__title");
      videoLink = document2.createElement("a");
      videoLink.href = href;
      videoLink.textContent = label && label.textContent.trim() || "Watch the Video";
    }
    if (!heading && !paragraphs.length && !ctas.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const contentCell = [];
    if (posterImg) contentCell.push(posterImg);
    if (heading) contentCell.push(heading);
    contentCell.push(...paragraphs);
    ctas.forEach((a) => {
      const p = document2.createElement("p");
      const link2 = document2.createElement("a");
      link2.href = a.getAttribute("href");
      link2.textContent = a.textContent.trim();
      p.append(link2);
      contentCell.push(p);
    });
    if (videoLink) {
      const p = document2.createElement("p");
      p.append(videoLink);
      contentCell.push(p);
    }
    const cells = [[contentCell]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-video", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/search-jobs.js
  var DEFAULT_ACTION = "/jobs.html";
  function parse2(element, { document: document2 }) {
    const title = element.querySelector(".job-search-box__title, .title, h2, h3");
    const form = element.querySelector("form");
    const button = element.querySelector('form button, form [type="submit"]');
    const options = [...element.querySelectorAll("select option")].filter((o) => !o.classList.contains("placeholder") && o.textContent.trim() && o.textContent.trim().toLowerCase() !== "location");
    const secondaryLinks = [...element.querySelectorAll(".job-search-box__link a[href], .additional-link a[href]")];
    if (!title && !form && !secondaryLinks.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    const labelText = title && title.textContent.trim() || "Looking for a job?";
    const label = document2.createElement("p");
    label.textContent = labelText;
    cells.push([label]);
    const formAction = form && form.getAttribute("action");
    const action = formAction && !/\/services\//.test(formAction) ? formAction : DEFAULT_ACTION;
    const actionLink = document2.createElement("a");
    actionLink.href = action;
    actionLink.textContent = button && button.textContent.trim() || "Search";
    cells.push([actionLink]);
    if (options.length) {
      const ul = document2.createElement("ul");
      options.forEach((o) => {
        const li = document2.createElement("li");
        li.textContent = o.textContent.trim();
        ul.append(li);
      });
      cells.push([ul]);
    }
    secondaryLinks.forEach((a) => {
      const link2 = document2.createElement("a");
      link2.href = a.getAttribute("href");
      link2.textContent = a.textContent.trim();
      cells.push([link2]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "search-jobs", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-promo.js
  function parse3(element, { document: document2 }) {
    const img = element.querySelector(".rw-cta__image img, .cmp-image img, img");
    const heading = element.querySelector(".rw-cta__title") || element.querySelector("h1, h2, h3, h4");
    const textEl = element.querySelector(".rw-cta__text, .cmp-text");
    const buttons = [...element.querySelectorAll(".rw-cta__buttons .cmp-button")].filter((b) => b.querySelector("a[href]"));
    if (!heading && !textEl && !buttons.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const textCell = [];
    if (heading) textCell.push(heading);
    if (textEl) {
      const p = document2.createElement("p");
      p.innerHTML = textEl.innerHTML;
      textCell.push(p);
    }
    let ctas = buttons.map((b) => ({ a: b.querySelector("a[href]"), primary: b.classList.contains("cmp-button--primary") }));
    if (!ctas.length) {
      ctas = [...element.querySelectorAll("a[href]")].map((a) => ({ a, primary: false }));
    }
    ctas.forEach(({ a, primary }) => {
      const p = document2.createElement("p");
      const link2 = document2.createElement("a");
      link2.href = a.getAttribute("href");
      link2.textContent = a.textContent.trim();
      if (primary) {
        const strong = document2.createElement("strong");
        strong.append(link2);
        p.append(strong);
      } else {
        p.append(link2);
      }
      textCell.push(p);
    });
    const cells = [[img || "", textCell]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-promo", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-feature.js
  function isBlank(node) {
    return !node.textContent.replace(/ /g, " ").trim();
  }
  function textParagraphs(textEl, document2) {
    const out = [];
    const blockChildren = [...textEl.children].filter((c) => /^(P|H[1-6]|UL|OL)$/.test(c.tagName));
    if (blockChildren.length) {
      blockChildren.forEach((child) => {
        if (isBlank(child)) return;
        while (child.firstChild && (child.firstChild.nodeName === "BR" || child.firstChild.nodeType === 3 && !child.firstChild.textContent.trim())) {
          child.firstChild.remove();
        }
        out.push(child);
      });
    } else if (!isBlank(textEl)) {
      const p = document2.createElement("p");
      p.innerHTML = textEl.innerHTML.trim();
      out.push(p);
    }
    return out;
  }
  function parse4(element, { document: document2 }) {
    let columns = [...element.querySelectorAll(".rw-column-control__column")];
    if (!columns.length) {
      const wrapper = element.querySelector('[class*="__wrapper"]') || element;
      columns = [...wrapper.children];
    }
    const cells = [];
    columns.forEach((col) => {
      const img = col.querySelector(".cmp-image img, img");
      const body = [];
      col.querySelectorAll(".cmp-text").forEach((t) => body.push(...textParagraphs(t, document2)));
      let ctas = [...col.querySelectorAll("a.cmp-button__cta[href]")];
      if (!ctas.length) ctas = [...col.querySelectorAll("a[href]")].filter((a) => !a.closest(".cmp-text"));
      ctas.forEach((a) => {
        const p = document2.createElement("p");
        const link2 = document2.createElement("a");
        link2.href = a.getAttribute("href");
        link2.textContent = a.textContent.trim();
        p.append(link2);
        body.push(p);
      });
      if (!img && !body.length) return;
      cells.push([img || "", body.length ? body : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-feature", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-areas.js
  function normalize(href) {
    if (!href) return "";
    try {
      return new URL(href, "https://www.robertwalters.co.uk/").pathname.replace(/\/$/, "");
    } catch (e) {
      return href;
    }
  }
  function parse5(element, { document: document2 }) {
    const title = element.querySelector(".rw-links-content__title") || element.querySelector(":scope > h2, :scope > h3");
    let labelItems = [...element.querySelectorAll(".rw-links-content__link-list > li")];
    if (!labelItems.length) labelItems = [...element.querySelectorAll(".rw-links-content__list-item")];
    const cardItems = [...element.querySelectorAll(".rw-links-content__cards-list > li")];
    const panels = cardItems.map((li) => {
      const body = li.querySelector(".feature-card__body");
      const anchor = li.querySelector("a[href]") || body && body.closest("a[href]");
      return {
        href: normalize(anchor && anchor.getAttribute("href")),
        rawHref: anchor && anchor.getAttribute("href"),
        img: li.querySelector(".feature-card__image img, img"),
        heading: li.querySelector(".feature-card__heading"),
        description: li.querySelector(".feature-card__description"),
        cta: li.querySelector(".feature-card__cta")
      };
    });
    if (!labelItems.length && !panels.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const used = /* @__PURE__ */ new Set();
    const cells = [];
    labelItems.forEach((li, i) => {
      const a = li.querySelector("a[href]");
      const text = (li.querySelector(".rw-links-content__item-link__wrapper__text") || a || li).textContent.trim();
      if (!text) return;
      let labelCell;
      if (a) {
        labelCell = document2.createElement("a");
        labelCell.href = a.getAttribute("href");
        labelCell.textContent = text;
      } else {
        labelCell = text;
      }
      const href = normalize(a && a.getAttribute("href"));
      let panel = panels.find((p, idx) => !used.has(idx) && href && p.href === href);
      if (!panel && panels[i] && !used.has(i)) panel = panels[i];
      const panelCell = [];
      if (panel) {
        used.add(panels.indexOf(panel));
        if (panel.img) panelCell.push(panel.img);
        if (panel.heading) {
          const h = document2.createElement("h3");
          h.textContent = panel.heading.textContent.trim();
          panelCell.push(h);
        }
        if (panel.description) {
          const p = document2.createElement("p");
          p.textContent = panel.description.textContent.trim();
          panelCell.push(p);
        }
        const ctaHref = panel.rawHref || a && a.getAttribute("href");
        if (ctaHref) {
          const p = document2.createElement("p");
          const link2 = document2.createElement("a");
          link2.href = ctaHref;
          link2.textContent = panel.cta && panel.cta.textContent.trim() || "Learn More";
          p.append(link2);
          panelCell.push(p);
        }
      }
      cells.push([labelCell, panelCell.length ? panelCell : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "tabs-areas", cells });
    if (title) element.before(title);
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-insights.js
  function link(document2, href, text) {
    const a = document2.createElement("a");
    a.href = href;
    a.textContent = text;
    return a;
  }
  function para(document2, ...children) {
    const p = document2.createElement("p");
    p.append(...children);
    return p;
  }
  function header(document2, col) {
    const out = [];
    if (!col) return out;
    const title = col.querySelector(".rw-latest-articles__title, h2, h3, h4");
    const viewAll = col.querySelector(".rw-latest-articles__info-link, a[href]");
    if (title) {
      const h = document2.createElement("h4");
      h.textContent = title.textContent.trim();
      out.push(h);
    }
    if (viewAll) out.push(para(document2, link(document2, viewAll.getAttribute("href"), viewAll.textContent.trim())));
    return out;
  }
  function parse6(element, { document: document2 }) {
    const headRow = element.querySelector(":scope > .row");
    const headCols = headRow ? [...headRow.children] : [];
    const bodyRow = element.querySelector(":scope > .row + .row") || element;
    const bodyCols = [...bodyRow.children];
    const col1 = header(document2, headCols[0]);
    const cardScope = bodyCols[0] || element;
    cardScope.querySelectorAll(".source-card").forEach((card) => {
      const img = card.querySelector(".cmp-image img, img");
      const titleLink = card.querySelector(".source-card__title");
      if (!img && !titleLink) return;
      if (img) col1.push(para(document2, img));
      const topic = card.querySelector(".source-card--v2__head__headline");
      if (topic) col1.push(para(document2, link(document2, topic.getAttribute("href"), topic.textContent.trim())));
      if (titleLink) {
        const h = document2.createElement("h4");
        h.append(link(document2, titleLink.getAttribute("href"), titleLink.textContent.trim()));
        col1.push(h);
      }
      const text = card.querySelector(".source-card__text");
      if (text && text.textContent.trim()) {
        const p = document2.createElement("p");
        p.textContent = text.textContent.trim();
        col1.push(p);
      }
      const more = card.querySelector(".source-card__read-more");
      if (more) col1.push(para(document2, link(document2, more.getAttribute("href"), more.textContent.trim())));
      const tags = [...card.querySelectorAll(".source-card--v2__footer__item")];
      if (tags.length) {
        const p = document2.createElement("p");
        tags.forEach((t, i) => {
          if (i) p.append(document2.createTextNode(", "));
          const label = t.textContent.trim();
          if (t.tagName === "A" && t.getAttribute("href")) p.append(link(document2, t.getAttribute("href"), label));
          else p.append(document2.createTextNode(label));
        });
        col1.push(p);
      }
    });
    const col2 = header(document2, headCols[1]);
    const tileScope = bodyCols[1] || element;
    let tiles = [...tileScope.querySelectorAll(".rw-tile__image")].map((imageWrap) => {
      const tile = imageWrap.closest(".rw-tile") || imageWrap.parentElement;
      const anchor = imageWrap.closest("a[href]");
      return {
        img: imageWrap.querySelector("img"),
        text: tile && tile.querySelector(".rw-tile__text"),
        href: anchor && anchor.getAttribute("href")
      };
    });
    if (!tiles.length) {
      tiles = [...tileScope.querySelectorAll("a.rw-tile")].map((a) => ({
        img: a.querySelector("img"),
        text: a.querySelector(".rw-tile__text"),
        href: a.getAttribute("href")
      }));
    }
    tiles.forEach(({ img, text, href }) => {
      const label = text ? text.textContent.trim() : "";
      if (!img && !label) return;
      if (img) col2.push(para(document2, img));
      if (label) col2.push(para(document2, href ? link(document2, href, label) : document2.createTextNode(label)));
    });
    if (!col1.length && !col2.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[col1.length ? col1 : "", col2.length ? col2 : ""]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-insights", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/robertwalters-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk",
        // OneTrust cookie banner + preference centre
        "#myModal",
        // "Important information" impersonation-scam modal (inside <main>)
        ".modal-backdrop",
        // backdrop for #myModal
        "#abandoned-job",
        // abandoned-job lightbox trigger (inside <main>)
        ".header-menu-overlay",
        // header menu overlay
        ".overlay-background",
        // generic overlay background
        ".overlay-container"
        // generic overlay container
      ]);
      WebImporter.DOMUtils.remove(element, [
        "footer"
        // both <footer> (extended-footer hero fragment) and footer.rw-footer
      ]);
      const body = element.ownerDocument && element.ownerDocument.body;
      if (body) {
        body.classList.remove("modal-open");
        if (body.style && body.style.overflow) body.style.overflow = "scroll";
      }
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header.rw-header",
        // global header / navigation
        "nav.cmp-languagenavigation",
        // language navigation (in header)
        "footer",
        "noscript",
        "script",
        "style",
        "link"
      ]);
    }
  }

  // tools/importer/transformers/robertwalters-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      if (!sel) continue;
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2) return;
    const doc = element.ownerDocument || document;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = doc.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-home.js
  var parsers = {
    "hero-video": parse,
    "search-jobs": parse2,
    "columns-promo": parse3,
    "cards-feature": parse4,
    "tabs-areas": parse5,
    "columns-insights": parse6
  };
  var PAGE_TEMPLATE = {
    name: "home",
    description: "Robert Walters UK homepage: video hero, job search, promos, services, areas we recruit in, insights, customer stories",
    urls: [
      "https://www.robertwalters.co.uk/"
    ],
    blocks: [
      { name: "hero-video", instances: [".hero-large.hero-large--style-01"] },
      { name: "search-jobs", instances: [".rw-jobs-search-box"] },
      { name: "columns-promo", instances: [".rw-cta"] },
      { name: "cards-feature", instances: [".rw-column-control"] },
      { name: "tabs-areas", instances: [".rw-links-content"] },
      { name: "columns-insights", instances: [".rw-latest-articles"] }
    ],
    sections: [
      { id: "rc2c1c1", name: "hero", selector: [".hero-large.hero-large--style-01"], style: null, blocks: ["hero-video"], defaultContent: [] },
      { id: "rc2c1c2", name: "job-search", selector: [".rw-jobs-search-box"], style: null, blocks: ["search-jobs"], defaultContent: [] },
      { id: "rc2c1c3", name: "salary-survey-promo", selector: ["main .aem-Grid > .container.responsivegrid:nth-of-type(3)"], style: null, blocks: ["columns-promo"], defaultContent: [] },
      { id: "rc2c1c4", name: "our-services", selector: ["main .aem-Grid > .container.responsivegrid:nth-of-type(4)"], style: null, blocks: ["cards-feature"], defaultContent: [".cmp-container > .text h2"] },
      { id: "rc2c1c5c1", name: "areas-we-recruit", selector: [".links-with-associated-content"], style: null, blocks: ["tabs-areas"], defaultContent: ["h2.rw-links-content__title"] },
      { id: "rc2c1c5c2", name: "insights", selector: [".latest-articles-v2"], style: null, blocks: ["columns-insights"], defaultContent: [] },
      { id: "rc2c1c5c3", name: "benefits-guide-promo", selector: ["main .aem-Grid > .container.responsivegrid:nth-of-type(5) > .cmp-container > .rw-cta"], style: null, blocks: ["columns-promo"], defaultContent: [] },
      { id: "rc2c1c5c4", name: "customer-stories", selector: ["main .aem-Grid > .container.responsivegrid:nth-of-type(5) > .cmp-container > .rw-column-control"], style: null, blocks: ["cards-feature"], defaultContent: [] }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_home_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_home_exports);
})();
