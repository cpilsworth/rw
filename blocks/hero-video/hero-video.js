import { createOptimizedPicture } from '../../scripts/aem.js';

const OPTION_CLASSES = [];

const VIDEO_PATTERN = /(vimeo\.com|youtube\.com|youtu\.be|\.mp4(\?|$))/i;

/**
 * Converts a video page URL into an embeddable URL.
 * @param {string} href the authored video link
 * @returns {{ type: string, src: string } | null}
 */
function getEmbed(href) {
  let url;
  try {
    url = new URL(href, window.location.href);
  } catch {
    return null;
  }
  const { hostname, pathname } = url;
  if (/\.mp4$/i.test(pathname)) return { type: 'video', src: url.href };
  if (hostname.includes('vimeo.com')) {
    const id = pathname.split('/').filter(Boolean).find((part) => /^\d+$/.test(part));
    if (!id) return null;
    return {
      type: 'iframe',
      src: `https://player.vimeo.com/video/${id}?autoplay=1&badge=0&byline=0&title=0&portrait=0&dnt=true`,
    };
  }
  if (hostname.includes('youtu')) {
    const id = hostname.includes('youtu.be')
      ? pathname.split('/').filter(Boolean)[0]
      : url.searchParams.get('v') || pathname.split('/').filter(Boolean).pop();
    if (!id) return null;
    return { type: 'iframe', src: `https://www.youtube.com/embed/${id}?autoplay=1` };
  }
  return null;
}

function createPlayer(embed, title) {
  let player;
  if (embed.type === 'video') {
    player = document.createElement('video');
    player.src = embed.src;
    player.controls = true;
    player.autoplay = true;
    player.playsInline = true;
  } else {
    player = document.createElement('iframe');
    player.src = embed.src;
    player.title = title || 'Video';
    player.allow = 'autoplay; fullscreen; picture-in-picture';
    player.setAttribute('allowfullscreen', '');
  }
  player.className = 'hero-video-player';
  return player;
}

/**
 * Plays the video in a modal viewer over a blurred page (as on the source site).
 * The player is created on open and removed on close so playback stops.
 */
function openVideoModal(block, embed, title) {
  const dialog = document.createElement('dialog');
  dialog.className = 'hero-video-modal';
  dialog.setAttribute('aria-label', title || 'Video');

  const frame = document.createElement('div');
  frame.className = 'hero-video-modal-frame';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'hero-video-modal-close';
  close.setAttribute('aria-label', 'Close video');
  frame.append(close, createPlayer(embed, title));
  dialog.append(frame);

  const { overflow } = document.body.style;
  dialog.addEventListener('close', () => {
    document.body.style.overflow = overflow;
    dialog.remove();
  });
  close.addEventListener('click', () => dialog.close());
  // a click outside the player lands on the dialog itself (the backdrop area)
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  block.append(dialog);
  document.body.style.overflow = 'hidden';
  dialog.showModal();
  close.focus();
}

export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  // gather all authored content defensively, regardless of row/cell layout
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const picture = block.querySelector('picture');

  const content = document.createElement('div');
  content.className = 'hero-video-content';
  const media = document.createElement('div');
  media.className = 'hero-video-media';

  // find the video link (first link that looks like a video)
  const videoLink = [...block.querySelectorAll('a[href]')].find((a) => VIDEO_PATTERN.test(a.href));

  cells.forEach((cell) => {
    [...cell.children].forEach((el) => {
      if (picture && (el === picture || el.contains(picture))) return;
      if (videoLink && (el === videoLink || el.contains(videoLink))) return;
      if (!el.textContent.trim() && !el.querySelector('img')) return;
      content.append(el);
    });
    // loose text nodes inside a cell
    if (!cell.children.length && cell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = cell.textContent.trim();
      content.append(p);
    }
  });

  // structural hooks: standalone CTA links render as buttons (first primary, rest outline),
  // and the first remaining text paragraph is the large statement line
  let ctaCount = 0;
  let statement;
  [...content.querySelectorAll(':scope > p')].forEach((p) => {
    const links = p.querySelectorAll('a[href]');
    const link = links.length === 1 ? links[0] : null;
    if (link && p.textContent.trim() === link.textContent.trim()) {
      if (!link.classList.contains('button')) {
        link.classList.add('button', ctaCount === 0 ? 'primary' : 'secondary');
      }
      p.classList.add('button-wrapper');
      ctaCount += 1;
    } else if (!statement && !p.querySelector('img')) {
      statement = p;
      p.classList.add('hero-video-statement');
    }
  });

  if (picture) {
    const img = picture.querySelector('img');
    const optimized = img
      ? createOptimizedPicture(img.src, img.alt, true, [
        { media: '(width >= 900px)', width: '1600' },
        { width: '900' },
      ])
      : picture;
    if (img) {
      const newImg = optimized.querySelector('img');
      newImg.loading = 'eager';
      newImg.fetchPriority = 'high';
    }
    media.append(optimized);
  }

  const embed = videoLink ? getEmbed(videoLink.href) : null;
  if (videoLink) {
    const label = videoLink.textContent.trim() || 'Watch the Video';
    if (embed) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'hero-video-launcher';
      button.setAttribute('aria-label', label);
      const text = document.createElement('span');
      text.className = 'hero-video-launcher-label';
      text.textContent = label;
      const icon = document.createElement('span');
      icon.className = 'hero-video-launcher-icon';
      icon.setAttribute('aria-hidden', 'true');
      button.append(text, icon);
      button.setAttribute('aria-haspopup', 'dialog');
      button.addEventListener('click', () => openVideoModal(block, embed, label));
      media.append(button);
    } else {
      // unknown provider: keep it as a plain link
      videoLink.className = 'hero-video-launcher';
      media.append(videoLink);
    }
  }

  const children = [content];
  if (media.children.length) children.push(media);
  else block.classList.add('hero-video-no-media');
  block.replaceChildren(...children);
}
