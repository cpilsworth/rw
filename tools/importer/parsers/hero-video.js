/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-video. Base: hero.
 * Source: https://www.robertwalters.co.uk/ (.hero-large.hero-large--style-01)
 * Generated: 2026-09-30
 *
 * Block content model (blocks/hero-video): single block table, one row, one cell.
 * The block pulls out the first <picture> as the video poster and the first
 * vimeo/youtube/mp4 link as the video launcher (link text = launcher label);
 * everything else (heading, subheading, description, CTAs) becomes content.
 */
export default function parse(element, { document }) {
  // Heading: source uses h1.rw-hero__heading-2; fall back to any heading.
  const heading = element.querySelector('.rw-hero__content h1, .rw-hero__content h2')
    || element.querySelector('h1, h2, h3');

  // Subheading + description paragraphs inside the content column.
  const paragraphs = [...element.querySelectorAll('.rw-hero__content > p')];
  if (!paragraphs.length) {
    const sub = element.querySelector('.rw-hero__heading');
    const desc = element.querySelector('.rw-hero__description');
    if (sub) paragraphs.push(sub);
    if (desc) paragraphs.push(desc);
  }

  // CTAs: a.cmp-button__cta inside the content column.
  let ctas = [...element.querySelectorAll('.rw-hero__content a.cmp-button__cta')];
  if (!ctas.length) ctas = [...element.querySelectorAll('.rw-hero__content a[href]')];

  // Video poster image.
  const posterImg = element.querySelector('.rw-video-container__thumbnail img, .rw-hero__video img');

  // Video URL from the embedded iframe (vimeo/youtube).
  const iframe = element.querySelector('.rw-video-container iframe, iframe[src]');
  let videoLink = null;
  if (iframe && iframe.getAttribute('src')) {
    let href = iframe.getAttribute('src');
    const vimeo = href.match(/player\.vimeo\.com\/video\/(\d+)/);
    if (vimeo) href = `https://vimeo.com/${vimeo[1]}`;
    if (href.startsWith('//')) href = `https:${href}`;
    const label = element.querySelector('.rw-video-container__title');
    videoLink = document.createElement('a');
    videoLink.href = href;
    videoLink.textContent = (label && label.textContent.trim()) || 'Watch the Video';
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
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    link.textContent = a.textContent.trim();
    p.append(link);
    contentCell.push(p);
  });
  if (videoLink) {
    const p = document.createElement('p');
    p.append(videoLink);
    contentCell.push(p);
  }

  const cells = [[contentCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-video', cells });
  element.replaceWith(block);
}
