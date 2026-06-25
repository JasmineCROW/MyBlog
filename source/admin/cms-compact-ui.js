(function (window, document) {
  'use strict';

  const styleId = 'cms-compact-ui-styles';

  function addStyles() {
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Hide Decap's default sidebar collection search area. */
      [class*="SidebarContainer"] > [class*="SidebarHeading"],
      [class*="SidebarContainer"] > [class*="SearchContainer"] {
        display: none !important;
      }

      [class*="SidebarContainer"] {
        padding-top: 14px !important;
      }

      [class*="SidebarContainer"] > [class*="SidebarNavList"] {
        margin-top: 0 !important;
      }

      /* Hide the default Quick Create button in the top bar. */
      [class*="AppHeaderQuickNewButton"] {
        display: none !important;
      }

      [class*="AppHeaderActions"] {
        gap: 8px;
      }
    `;
    document.head.appendChild(style);
  }

  function markHiddenElements() {
    document
      .querySelectorAll('[class*="SidebarContainer"] > [class*="SidebarHeading"], [class*="SidebarContainer"] > [class*="SearchContainer"]')
      .forEach(element => {
        element.dataset.cmsCompactHidden = 'collection-search';
        element.setAttribute('aria-hidden', 'true');
      });

    document
      .querySelectorAll('[class*="AppHeaderQuickNewButton"]')
      .forEach(element => {
        element.dataset.cmsCompactHidden = 'quick-create';
        element.setAttribute('aria-hidden', 'true');
      });
  }

  function start() {
    addStyles();
    markHiddenElements();

    let scheduled = false;
    const reconcile = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        markHiddenElements();
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
