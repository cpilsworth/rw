/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Robert Walters (robertwalters.co.uk) site-wide cleanup.
 * All selectors verified in migration-work/cleaned.html.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Overlays / modals that can interfere with block parsing.
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk', // OneTrust cookie banner + preference centre
      '#myModal', // "Important information" impersonation-scam modal (inside <main>)
      '.modal-backdrop', // backdrop for #myModal
      '#abandoned-job', // abandoned-job lightbox trigger (inside <main>)
      '.header-menu-overlay', // header menu overlay
      '.overlay-background', // generic overlay background
      '.overlay-container', // generic overlay container
    ]);

    // Footer contains a second .hero-large ("Are you looking to hire?" fragment);
    // remove before parsing so it can never be picked up by the hero-video parser.
    WebImporter.DOMUtils.remove(element, [
      'footer', // both <footer> (extended-footer hero fragment) and footer.rw-footer
    ]);

    // body has class "modal-open" and inline overflow hidden due to the modal.
    const body = element.ownerDocument && element.ownerDocument.body;
    if (body) {
      body.classList.remove('modal-open');
      if (body.style && body.style.overflow) body.style.overflow = 'scroll';
    }
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome.
    WebImporter.DOMUtils.remove(element, [
      'header.rw-header', // global header / navigation
      'nav.cmp-languagenavigation', // language navigation (in header)
      'footer',
      'noscript',
      'script',
      'style',
      'link',
    ]);
  }
}
