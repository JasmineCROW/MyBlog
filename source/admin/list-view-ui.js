(function (window, document) {
  'use strict';

  const listCardSelector = 'li[class*="ListCard-card-card"]';
  const headingSelector = 'h2[class*="ListCardTitle"]';
  const decoratedSelector = 'li[data-cms-list-decorated="true"]';
  const titlePattern = /^(.*?)\s*[·•]\s*(\d{4}-\d{2}-\d{2})(?:[ T]\d{2}:\d{2}(?::\d{2})?)?\s*$/;

  function isListCard(card) {
    return card && card.matches(listCardSelector) && !String(card.className).includes('GridCard');
  }

  function addStyles() {
    if (document.getElementById('cms-list-view-ui-styles')) return;

    const style = document.createElement('style');
    style.id = 'cms-list-view-ui-styles';
    style.textContent = `
      .cms-list-post-card {
        align-self: start !important;
        min-height: 0 !important;
        height: auto !important;
        overflow: hidden !important;
        border-radius: 10px !important;
        background: #ffffff !important;
        box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08) !important;
        transition: background-color 160ms ease, box-shadow 160ms ease, transform 160ms ease !important;
      }
      .cms-list-post-card > a {
        display: block !important;
        min-height: 0 !important;
        height: auto !important;
        padding: 15px 20px !important;
      }
      .cms-list-post-card .cms-list-post-heading {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 16px !important;
        min-height: 0 !important;
        margin: 0 !important;
        color: #1f2937 !important;
        font-size: 16px !important;
        font-weight: 700 !important;
        line-height: 1.45 !important;
      }
      .cms-list-post-card .cms-list-post-title {
        min-width: 0 !important;
        flex: 1 1 auto !important;
        overflow: hidden !important;
        color: #1f2937 !important;
        font-weight: 700 !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }
      .cms-list-post-card .cms-list-post-date {
        flex: 0 0 auto !important;
        color: #9ca3af !important;
        font-size: 12px !important;
        font-weight: 400 !important;
        line-height: 1.4 !important;
        white-space: nowrap !important;
      }
      .cms-list-post-card:hover {
        background: #f8fafc !important;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1) !important;
        transform: translateY(-1px) !important;
      }
      .cms-list-post-card:hover .cms-list-post-title { color: #1d4ed8 !important; }
      @media (max-width: 640px) {
        .cms-list-post-card > a { padding: 14px 16px !important; }
        .cms-list-post-card .cms-list-post-heading {
          align-items: flex-start !important;
          flex-direction: column !important;
          gap: 6px !important;
          font-size: 15px !important;
        }
        .cms-list-post-card .cms-list-post-title { white-space: normal !important; }
        .cms-list-post-card .cms-list-post-date { align-self: flex-end !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function restoreCard(card) {
    if (card.dataset.cmsListDecorated !== 'true') return;

    const heading = Array.from(card.querySelectorAll('h2')).find(node =>
      node.classList.contains('cms-list-post-heading') || node.querySelector('.cms-list-post-title')
    );
    const originalTitle = card.dataset.cmsListOriginalTitle;

    if (heading && originalTitle) {
      const titleIcons = heading.querySelector('[class*="TitleIcons"]');
      heading.replaceChildren(document.createTextNode(originalTitle));
      if (titleIcons) heading.appendChild(titleIcons);
      heading.classList.remove('cms-list-post-heading');
    }

    card.classList.remove('cms-list-post-card');
    delete card.dataset.cmsListDecorated;
    delete card.dataset.cmsListOriginalTitle;
  }

  function decorateCard(card) {
    if (!isListCard(card) || card.dataset.cmsListDecorated === 'true') return;

    const heading = card.querySelector(headingSelector);
    if (!heading) return;

    const originalTitle = (heading.textContent || '').trim();
    const match = originalTitle.match(titlePattern);
    if (!match || !match[1]) return;

    const titleIcons = heading.querySelector('[class*="TitleIcons"]');
    const titleNode = document.createElement('span');
    titleNode.className = 'cms-list-post-title';
    titleNode.textContent = match[1].trim();

    const dateNode = document.createElement('time');
    dateNode.className = 'cms-list-post-date';
    dateNode.dateTime = match[2];
    dateNode.textContent = match[2];

    card.dataset.cmsListDecorated = 'true';
    card.dataset.cmsListOriginalTitle = originalTitle;
    card.classList.add('cms-list-post-card');
    heading.classList.add('cms-list-post-heading');
    heading.replaceChildren(titleNode, dateNode);
    if (titleIcons) heading.appendChild(titleIcons);
  }

  function reconcile() {
    document.querySelectorAll(decoratedSelector).forEach(card => {
      if (!isListCard(card)) restoreCard(card);
    });

    const listCards = Array.from(document.querySelectorAll(listCardSelector)).filter(isListCard);
    const hasGridCards = document.querySelector('li[class*="GridCard-card-card"]') !== null;

    // A Grid card means Decap is rendering Grid View (or changing views), so
    // List View does not inspect or decorate any nodes in that state.
    if (listCards.length === 0 || hasGridCards) return;

    addStyles();
    listCards.forEach(decorateCard);
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
