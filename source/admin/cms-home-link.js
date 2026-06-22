(function (window, document) {
  'use strict';

  const linkId = 'cms-return-home-link';
  const workspaceSelectors = [
    'li[class*="GridCard-card-card"]',
    'li[class*="ListCard-card-card"]',
    'a[href^="#/collections/"][href*="/entries/"]',
    'a[href^="#/collections/"][href$="/new"]',
    '[class*="EditorContainer"]',
    '[class*="Sidebar"] a[href^="#/collections/"]'
  ];

  function addStyles() {
    if (document.getElementById('cms-back-home-styles')) return;

    const style = document.createElement('style');
    style.id = 'cms-back-home-styles';
    style.textContent = `
      .cms-back-home {
        position: fixed;
        right: 24px;
        bottom: 24px;
        z-index: 9999;
        display: inline-flex;
        align-items: center;
        padding: 10px 16px;
        border: 1px solid #d0d7e2;
        border-radius: 999px;
        background: #f8fafc;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
        color: #334155;
        font: 600 14px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        text-decoration: none;
        transition: background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease, transform 100ms ease;
      }
      .cms-back-home:hover {
        border-color: #b8c4d3;
        background: #e8eef7;
        box-shadow: 0 6px 16px rgba(15, 23, 42, 0.15);
        color: #1e293b;
      }
      .cms-back-home:active {
        box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.14);
        transform: translateY(1px);
      }
      .cms-back-home:focus-visible {
        outline: 2px solid #64748b;
        outline-offset: 3px;
      }
      @media (max-width: 640px) {
        .cms-back-home { right: 16px; bottom: 16px; padding: 9px 14px; }
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

    if (document.getElementById(linkId)) return;

    const link = document.createElement('a');
    link.id = linkId;
    link.className = 'cms-back-home';
    link.dataset.cmsHomeLinkMounted = 'true';
    link.href = '/MyBlog/';
    link.textContent = '返回博客';
    document.body.appendChild(link);
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
