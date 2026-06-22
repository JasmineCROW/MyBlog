(function (window, document) {
  'use strict';

  const linkId = 'cms-return-home-link';
  const headerSelectors = '[class*="AppHeader"], header';
  const workspaceSelectors = [
    'li[class*="GridCard-card-card"]',
    'li[class*="ListCard-card-card"]',
    'a[href^="#/collections/"][href*="/entries/"]',
    'a[href^="#/collections/"][href$="/new"]',
    '[class*="EditorContainer"]',
    '[class*="Sidebar"] a[href^="#/collections/"]'
  ];

  function addStyles() {
    if (document.getElementById('cms-return-home-link-styles')) return;

    const style = document.createElement('style');
    style.id = 'cms-return-home-link-styles';
    style.textContent = `
      #${linkId} {
        z-index: 2;
        display: inline-flex;
        flex: 0 0 auto;
        align-items: center;
        gap: 6px;
        margin: 0 10px;
        padding: 6px 12px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        background: #f8fafc;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
        color: #475569;
        font: 600 13px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        text-decoration: none;
        white-space: nowrap;
        transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease, transform 100ms ease;
      }
      #${linkId}:hover {
        border-color: #94a3b8;
        background: #e2e8f0;
        box-shadow: 0 2px 5px rgba(15, 23, 42, 0.12);
        color: #334155;
      }
      #${linkId}:active {
        box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.14);
        transform: translateY(1px);
      }
      #${linkId}:focus-visible {
        outline: 2px solid #64748b;
        outline-offset: 2px;
      }
      @media (max-width: 640px) {
        #${linkId} { margin: 0 8px; padding: 6px 9px; }
      }
    `;
    document.head.appendChild(style);
  }

  function isWorkspaceVisible() {
    return workspaceSelectors.some(selector => document.querySelector(selector));
  }

  function removeLink() {
    const link = document.getElementById(linkId);
    if (link) link.remove();
  }

  function mount() {
    if (!isWorkspaceVisible()) {
      removeLink();
      return;
    }

    const header = document.querySelector(headerSelectors);
    if (!header) return;

    const existingLink = document.getElementById(linkId);
    const collectionLink = header.querySelector('a[href^="#/collections/"]');
    const logo = header.querySelector('[class*="Logo"], a[href="#/"]');
    const link = existingLink || document.createElement('a');

    link.id = linkId;
    link.dataset.cmsHomeLinkMounted = 'true';
    link.href = '/MyBlog/';
    link.setAttribute('aria-label', '返回博客首页');
    link.innerHTML = '<span aria-hidden="true">←</span><span>返回首页</span>';

    if (collectionLink) {
      header.insertBefore(link, collectionLink);
    } else if (logo) {
      logo.insertAdjacentElement('afterend', link);
    } else {
      header.insertBefore(link, header.firstChild);
    }
  }

  function start() {
    addStyles();
    mount();

    let scheduled = false;
    const reconcile = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        mount();
      });
    };

    new MutationObserver(reconcile).observe(document.body, {
      childList: true,
      subtree: true
    });
    window.addEventListener('hashchange', reconcile);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})(window, document);
