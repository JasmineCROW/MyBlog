(function (window, document) {
  'use strict';

  const linkId = 'cms-return-home-link';

  function addStyles() {
    if (document.getElementById('cms-return-home-link-styles')) return;

    const style = document.createElement('style');
    style.id = 'cms-return-home-link-styles';
    style.textContent = `
      #${linkId} {
        position: fixed;
        top: 14px;
        left: 16px;
        z-index: 40;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 11px;
        border: 1px solid #dbe4ee;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
        color: #475569;
        font: 600 13px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        text-decoration: none;
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
      @media (max-width: 640px) {
        #${linkId} { top: 10px; left: 10px; padding: 6px 9px; }
      }
    `;
    document.head.appendChild(style);
  }

  function mount() {
    if (document.getElementById(linkId)) return;

    const link = document.createElement('a');
    link.id = linkId;
    link.href = '/MyBlog/';
    link.setAttribute('aria-label', '返回博客首页');
    link.innerHTML = '<span aria-hidden="true">←</span><span>返回首页</span>';
    document.body.appendChild(link);
  }

  function start() {
    addStyles();
    mount();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})(window, document);
