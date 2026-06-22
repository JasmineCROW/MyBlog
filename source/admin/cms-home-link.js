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
        margin: 0 12px;
        padding: 7px 11px;
        border: 1px solid #dbe4ee;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
        color: #475569;
        font: 600 13px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        text-decoration: none;
        white-space: nowrap;
        transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease;
      }
      #${linkId}:hover {
        border-color: #f59e0b;
        background: #fff7ed;
        box-shadow: 0 3px 8px rgba(245, 158, 11, 0.16);
        color: #c2410c;
      }
      #${linkId}:focus-visible {
        outline: 2px solid #fb923c;
        outline-offset: 2px;
      }
      #${linkId}.cms-return-home-link--floating {
        position: fixed;
        top: 14px;
        left: 16px;
        margin: 0;
        z-index: 40;
      }
      @media (max-width: 640px) {
        #${linkId} { margin: 0 8px; padding: 6px 9px; }
        #${linkId}.cms-return-home-link--floating { top: 10px; left: 10px; }
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
    const header = document.querySelector(headerSelectors);

    link.id = linkId;
    link.dataset.cmsHomeLinkMounted = 'true';
    link.href = '/MyBlog/';
    link.setAttribute('aria-label', '返回博客首页');
    link.innerHTML = '<span aria-hidden="true">←</span><span>返回首页</span>';

    if (header) {
      header.insertBefore(link, header.firstChild);
    } else {
      link.classList.add('cms-return-home-link--floating');
      document.body.appendChild(link);
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
