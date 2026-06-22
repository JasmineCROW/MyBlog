(function (window, document) {
  'use strict';

  const gridCardSelector = 'li[class*="GridCard-card-card"]';
  const headingSelector = 'h2[class*="CardHeading"]';
  const contentSelector = 'div[class*="CardBody"]';
  const decoratedSelector = 'li[data-cms-grid-decorated="true"]';
  const titlePattern = /^(.*?)\s*[·•]\s*(\d{4}-\d{2}-\d{2})(?:[ T]\d{2}:\d{2}(?::\d{2})?)?\s*$/;

  function isGridCard(card) {
    return card && card.matches(gridCardSelector) && !String(card.className).includes('ListCard');
  }

  function addStyles() {
    if (document.getElementById('cms-grid-view-ui-styles')) return;

    const style = document.createElement('style');
    style.id = 'cms-grid-view-ui-styles';
    style.textContent = `
      .cms-grid-post-card { align-self: start !important; min-height: 0 !important; height: auto !important; border-radius: 10px !important; overflow: hidden !important; }
      .cms-grid-post-card > a { display: block !important; height: auto !important; min-height: 0 !important; }
      .cms-grid-post-card .cms-grid-post-content { min-height: 0 !important; padding: 20px 24px !important; }
      .cms-grid-post-card .cms-grid-post-heading { display: flex !important; flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; min-height: 0 !important; margin: 0 !important; color: #1f2937 !important; font-size: 16px !important; font-weight: 700 !important; line-height: 1.45 !important; }
      .cms-grid-post-card .cms-grid-post-title { color: #1f2937 !important; font-weight: 700 !important; }
      .cms-grid-post-card .cms-grid-post-date { align-self: flex-end !important; color: #9ca3af !important; font-size: 12px !important; font-weight: 400 !important; line-height: 1.4 !important; white-space: nowrap !important; }
      .cms-grid-post-card:hover .cms-grid-post-title { color: #1d4ed8 !important; }
      @media (max-width: 640px) { .cms-grid-post-card .cms-grid-post-content { padding: 16px 18px !important; } .cms-grid-post-card .cms-grid-post-heading { font-size: 15px !important; } }
    `;
    document.head.appendChild(style);
  }

  function restoreCard(card) {
    if (card.dataset.cmsGridDecorated !== 'true') return;

    const heading = card.querySelector('h2.cms-grid-post-heading');
    const originalTitle = card.dataset.cmsGridOriginalTitle;

    if (heading && originalTitle) {
      const titleIcons = heading.querySelector('[class*="TitleIcons"]');
      heading.replaceChildren(document.createTextNode(originalTitle));
      if (titleIcons) heading.appendChild(titleIcons);
      heading.classList.remove('cms-grid-post-heading');
    }

    const content = card.querySelector('.cms-grid-post-content');
    if (content) content.classList.remove('cms-grid-post-content');

    card.classList.remove('cms-grid-post-card');
    delete card.dataset.cmsGridDecorated;
    delete card.dataset.cmsGridOriginalTitle;
  }

  function decorateCard(card) {
    if (!isGridCard(card) || card.dataset.cmsGridDecorated === 'true') return;

    const heading = card.querySelector(headingSelector);
    if (!heading) return;

    const originalTitle = (heading.textContent || '').trim();
    const match = originalTitle.match(titlePattern);
    if (!match || !match[1]) return;

    const titleIcons = heading.querySelector('[class*="TitleIcons"]');
    const titleNode = document.createElement('span');
    titleNode.className = 'cms-grid-post-title';
    titleNode.textContent = match[1].trim();

    const dateNode = document.createElement('time');
    dateNode.className = 'cms-grid-post-date';
    dateNode.dateTime = match[2];
    dateNode.textContent = match[2];

    card.dataset.cmsGridDecorated = 'true';
    card.dataset.cmsGridOriginalTitle = originalTitle;
    card.classList.add('cms-grid-post-card');
    heading.classList.add('cms-grid-post-heading');
    heading.replaceChildren(titleNode, dateNode);
    if (titleIcons) heading.appendChild(titleIcons);

    const content = card.querySelector(contentSelector);
    if (content) content.classList.add('cms-grid-post-content');
  }

  function reconcile() {
    document.querySelectorAll(decoratedSelector).forEach(card => {
      if (!isGridCard(card)) restoreCard(card);
    });

    const gridCards = Array.from(document.querySelectorAll(gridCardSelector)).filter(isGridCard);
    const hasListCards = document.querySelector('li[class*="ListCard-card-card"]') !== null;

    // Decap renders one view mode at a time. List View is a hard stop: no
    // Grid styles are injected and no list nodes are inspected or modified.
    if (gridCards.length === 0 || hasListCards) return;

    addStyles();
    gridCards.forEach(decorateCard);
  }

  function start() {
    reconcile();

    let scheduled = false;
    const scheduleReconcile = () => {
      if (scheduled) return;
      scheduled = true;

      const run = () => {
        scheduled = false;
        reconcile();
      };

      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(run);
      } else {
        window.setTimeout(run, 0);
      }
    };

    const observer = new MutationObserver(scheduleReconcile);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})(window, document);
