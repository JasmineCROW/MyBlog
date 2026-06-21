(function (window, document) {
  'use strict';

  const entrySelector = 'a[href*="#/collections/posts/entries/"], a[href*="/collections/posts/entries/"]';
  const datePattern = /(\d{4}-\d{2}-\d{2})(?:[ T]\d{2}:\d{2}(?::\d{2})?)?\s*$/;

  function addStyles() {
    if (document.getElementById('cms-post-list-ui-styles')) return;

    const style = document.createElement('style');
    style.id = 'cms-post-list-ui-styles';
    style.textContent = `
      .cms-post-list-entry { display: flex !important; flex-direction: column !important; align-items: flex-start !important; gap: 7px !important; }
      .cms-post-list-entry .cms-post-list-title { color: #1f2937 !important; font-size: 16px !important; font-weight: 700 !important; line-height: 1.45 !important; }
      .cms-post-list-entry .cms-post-list-date { color: #9ca3af !important; font-size: 12px !important; font-weight: 400 !important; line-height: 1.4 !important; }
      .cms-post-list-entry:hover .cms-post-list-title { color: #1d4ed8 !important; }
      @media (max-width: 640px) { .cms-post-list-entry .cms-post-list-title { font-size: 15px !important; } }
    `;
    document.head.appendChild(style);
  }

  function decorateEntry(entry) {
    if (entry.dataset.cmsPostListDecorated === 'true') return;

    const text = (entry.textContent || '').replace(/\s+/g, ' ').trim();
    const match = text.match(datePattern);

    if (!match) return;

    const title = text.slice(0, match.index).replace(/[·•—–-]\s*$/, '').trim();
    if (!title) return;

    entry.dataset.cmsPostListDecorated = 'true';
    entry.classList.add('cms-post-list-entry');
    entry.replaceChildren();

    const titleNode = document.createElement('span');
    titleNode.className = 'cms-post-list-title';
    titleNode.textContent = title;

    const dateNode = document.createElement('span');
    dateNode.className = 'cms-post-list-date';
    dateNode.textContent = `发布日期：${match[1]}`;

    entry.append(titleNode, dateNode);
  }

  function decoratePostList() {
    document.querySelectorAll(entrySelector).forEach(decorateEntry);
  }

  function start() {
    addStyles();
    decoratePostList();

    const observer = new MutationObserver(decoratePostList);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})(window, document);
