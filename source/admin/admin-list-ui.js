(function (window, document) {
  'use strict';

  const entrySelector = 'a[href*="#/collections/posts/entries/"], a[href*="/collections/posts/entries/"]';
  const datePattern = /^(\d{4}-\d{2}-\d{2})(?:[ T]\d{2}:\d{2}(?::\d{2})?)?\s*$/;

  function addStyles() {
    if (document.getElementById('cms-post-list-ui-styles')) return;

    const style = document.createElement('style');
    style.id = 'cms-post-list-ui-styles';
    style.textContent = `
      .cms-post-list-entry { display: flex !important; flex-direction: column !important; align-items: flex-start !important; min-height: 0 !important; height: auto !important; box-sizing: border-box !important; gap: 8px !important; padding: 20px 24px !important; }
      .cms-post-list-entry .cms-post-list-title { color: #1f2937 !important; font-size: 16px !important; font-weight: 700 !important; line-height: 1.45 !important; }
      .cms-post-list-entry .cms-post-list-meta { display: flex !important; flex-wrap: wrap !important; align-items: center !important; gap: 6px 8px !important; min-height: 18px !important; }
      .cms-post-list-entry .cms-post-list-category { color: #6b7280 !important; font-size: 13px !important; font-weight: 400 !important; line-height: 1.45 !important; }
      .cms-post-list-entry .cms-post-list-pinned { border: 1px solid #bfdbfe !important; border-radius: 999px !important; background: #eff6ff !important; color: #2563eb !important; font-size: 11px !important; font-weight: 600 !important; line-height: 1 !important; padding: 3px 7px !important; }
      .cms-post-list-entry .cms-post-list-date { align-self: flex-end !important; color: #9ca3af !important; font-size: 12px !important; font-weight: 400 !important; line-height: 1.4 !important; margin-top: 6px !important; white-space: nowrap !important; }
      .cms-post-list-entry:hover .cms-post-list-title { color: #1d4ed8 !important; }
      @media (max-width: 640px) { .cms-post-list-entry { padding: 16px 18px !important; } .cms-post-list-entry .cms-post-list-title { font-size: 15px !important; } }
    `;
    document.head.appendChild(style);
  }

  function categoryPath(value) {
    return String(value || '')
      .replace(/^\[|\]$/g, '')
      .split(/\s*(?:,|\/)\s*/)
      .map(item => item.trim())
      .filter(item => item && item !== 'undefined' && item !== 'null')
      .join(' / ');
  }

  function entryData(text) {
    const parts = text.split('|||').map(item => item.trim());

    if (parts.length === 4 && datePattern.test(parts[3])) {
      return {
        title: parts[0],
        categories: categoryPath(parts[1]),
        pinned: parts[2].toLowerCase() === 'true',
        date: parts[3].match(datePattern)[1]
      };
    }

    const match = text.match(/(\d{4}-\d{2}-\d{2})(?:[ T]\d{2}:\d{2}(?::\d{2})?)?\s*$/);
    if (!match) return null;

    return {
      title: text.slice(0, match.index).replace(/[·•—–-]\s*$/, '').trim(),
      categories: '',
      pinned: false,
      date: match[1]
    };
  }

  function decorateEntry(entry) {
    if (entry.dataset.cmsPostListDecorated === 'true') return;

    const text = (entry.textContent || '').replace(/\s+/g, ' ').trim();
    const data = entryData(text);
    if (!data || !data.title) return;

    entry.dataset.cmsPostListDecorated = 'true';
    entry.classList.add('cms-post-list-entry');
    entry.replaceChildren();

    const titleNode = document.createElement('span');
    titleNode.className = 'cms-post-list-title';
    titleNode.textContent = data.title;

    const metaNode = document.createElement('div');
    metaNode.className = 'cms-post-list-meta';

    if (data.categories) {
      const categoryNode = document.createElement('span');
      categoryNode.className = 'cms-post-list-category';
      categoryNode.textContent = data.categories;
      metaNode.append(categoryNode);
    }

    if (data.pinned) {
      const pinnedNode = document.createElement('span');
      pinnedNode.className = 'cms-post-list-pinned';
      pinnedNode.textContent = '置顶';
      metaNode.append(pinnedNode);
    }

    const dateNode = document.createElement('span');
    dateNode.className = 'cms-post-list-date';
    dateNode.textContent = data.date;

    entry.append(titleNode, metaNode, dateNode);
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
