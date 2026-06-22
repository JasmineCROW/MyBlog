(function (window, document) {
  'use strict';

  const linkId = 'cms-return-home-link';
  const headerSelectors = '[class*="AppHeader"], header';
  const actionAnchorSelectors = [
    '[class*="QuickNew"]',
    '[class*="QuickAdd"]',
    '[aria-label*="Quick"]',
    '[aria-label*="快速"]',
    '[title*="Quick"]',
    '[title*="快速"]',
    '[class*="Avatar"]',
    '[class*="UserMenu"]'
  ];
  const actionGroupSelectors = [
    '[class*="AppHeaderActions"]',
    '[class*="HeaderActions"]',
    '[class*="ToolbarActions"]'
  ];
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
        gap: 7px;
        margin: 0 8px;
        padding: 7px 13px;
        border: 1px solid #cbd5e1;
        border-radius: 999px;
        background: #f1f5f9;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
        color: #334155;
        font: 600 13px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        text-decoration: none;
        white-space: nowrap;
        transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease, transform 100ms ease;
      }
      #${linkId}:hover {
        border-color: #94a3b8;
        background: #e2e8f0;
        box-shadow: 0 2px 5px rgba(15, 23, 42, 0.12);
        color: #1e293b;
      }
      #${linkId}:active {
        box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.14);
        transform: translateY(1px);
      }
      #${linkId}:focus-visible {
        outline: 2px solid #64748b;
        outline-offset: 2px;
      }
      #${linkId} svg {
        width: 14px;
        height: 14px;
        fill: currentColor;
      }
      #${linkId}.cms-return-home-link--right {
        margin-left: auto;
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

  function findActionAnchor(header) {
    for (const selector of actionAnchorSelectors) {
      const anchor = header.querySelector(selector);
      if (anchor) return anchor;
    }

    for (const selector of actionGroupSelectors) {
      const group = header.querySelector(selector);
      if (group && group.firstElementChild) return group.firstElementChild;
    }

    return null;
  }

  function bindNavigation(link) {
    if (link.dataset.cmsHomeLinkBound === 'true') return;

    link.dataset.cmsHomeLinkBound = 'true';
    link.addEventListener('click', event => {
      event.preventDefault();
      window.location.href = '/MyBlog/';
    });
  }

  function mount() {
    if (!isWorkspaceVisible()) {
      removeLink();
      return;
    }

    const header = document.querySelector(headerSelectors);
    if (!header) return;

    const existingLink = document.getElementById(linkId);
    const actionAnchor = findActionAnchor(header);
    const link = existingLink || document.createElement('a');

    link.id = linkId;
    link.dataset.cmsHomeLinkMounted = 'true';
    link.href = '/MyBlog/';
    link.setAttribute('aria-label', '返回博客');
    link.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3-9 8h2v9h5v-6h4v6h5v-9h2l-9-8Zm5 15h-1v-6H8v6H7v-9.1l5-4.45 5 4.45V18Z"/></svg><span>返回博客</span>';
    link.classList.remove('cms-return-home-link--right');
    bindNavigation(link);

    if (actionAnchor) {
      actionAnchor.insertAdjacentElement('beforebegin', link);
    } else {
      link.classList.add('cms-return-home-link--right');
      header.appendChild(link);
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
