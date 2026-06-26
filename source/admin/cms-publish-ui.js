(function (window, document) {
  'use strict';

  const publishTextPattern = /(发布|Publish|更新|Update)/i;
  const publishMenuTextPattern = /(发布，然后新建内容|发布，然后复制内容|Publish and create new|Publish and duplicate)/i;
  const newEntryPattern = /\/collections\/posts\/new(?:$|[/?#])/;
  const existingEntryPattern = /\/collections\/posts\/entries\//;

  function addStyles() {
    if (document.getElementById('cms-publish-ui-styles')) return;

    const style = document.createElement('style');
    style.id = 'cms-publish-ui-styles';
    style.textContent = `
      .cms-publish-update-button {
        border: 1px solid #fecaca !important;
        background: #fee2e2 !important;
        color: #991b1b !important;
        box-shadow: none !important;
      }
      .cms-publish-update-button:hover,
      .cms-publish-update-button:focus {
        border-color: #fca5a5 !important;
        background: #fecaca !important;
        color: #7f1d1d !important;
      }
      .cms-publish-menu-hidden {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function routeState() {
    const hash = window.location.hash || '';

    return {
      isNewEntry: newEntryPattern.test(hash),
      isExistingEntry: existingEntryPattern.test(hash)
    };
  }

  function buttonText(button) {
    return (button.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function isPublishButton(button) {
    const text = buttonText(button);
    return publishTextPattern.test(text) && !publishMenuTextPattern.test(text);
  }

  function visibleButtons() {
    return Array.from(document.querySelectorAll('button')).filter(button => {
      if (button.closest('.cms-taxonomy-card')) return false;
      if (button.closest('.cms-taxonomy-modal')) return false;
      return button.offsetParent !== null || button.getClientRects().length > 0;
    });
  }

  function candidatePublishButtons() {
    return visibleButtons().filter(isPublishButton);
  }

  function replaceButtonLabel(button, label) {
    const textNodes = [];
    const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();

    while (node) {
      if (node.nodeValue && node.nodeValue.trim()) textNodes.push(node);
      node = walker.nextNode();
    }

    if (textNodes.length > 0) {
      textNodes[0].nodeValue = label;
      textNodes.slice(1).forEach(textNode => {
        textNode.nodeValue = '';
      });
    } else {
      button.textContent = label;
    }
  }

  function isDropdownButton(button) {
    const text = buttonText(button);
    const label = `${button.getAttribute('aria-label') || ''} ${button.title || ''}`.toLowerCase();

    return (
      button.getAttribute('aria-haspopup') === 'true' ||
      button.getAttribute('aria-expanded') !== null ||
      /dropdown|menu|more|更多|菜单|選單/.test(label) ||
      text === '' ||
      text === '▾' ||
      text === '▼' ||
      text === '⌄'
    );
  }

  function hidePublishDropdown(publishButton) {
    const parent = publishButton.parentElement;
    if (!parent) return;

    Array.from(parent.children).forEach(child => {
      if (child === publishButton || child.nodeType !== 1) return;
      if (child.matches('button') && isDropdownButton(child)) {
        child.classList.add('cms-publish-menu-hidden');
        child.setAttribute('aria-hidden', 'true');
        child.tabIndex = -1;
      }
    });

    const sibling = publishButton.nextElementSibling;
    if (sibling && sibling.matches('button') && isDropdownButton(sibling)) {
      sibling.classList.add('cms-publish-menu-hidden');
      sibling.setAttribute('aria-hidden', 'true');
      sibling.tabIndex = -1;
    }
  }

  function removeOpenPublishMenus() {
    document.querySelectorAll('[role="menu"], [class*="Dropdown"], [class*="Menu"]').forEach(menu => {
      const text = (menu.textContent || '').replace(/\s+/g, ' ').trim();
      if (publishMenuTextPattern.test(text)) {
        menu.classList.add('cms-publish-menu-hidden');
        menu.setAttribute('aria-hidden', 'true');
      }
    });
  }

  function reconcile() {
    const state = routeState();
    const buttons = candidatePublishButtons();

    buttons.forEach(button => {
      button.classList.remove('cms-publish-update-button');

      if (state.isExistingEntry) {
        replaceButtonLabel(button, '更新');
        button.classList.add('cms-publish-update-button');
      } else if (state.isNewEntry) {
        replaceButtonLabel(button, '发布');
      }

      hidePublishDropdown(button);
    });

    removeOpenPublishMenus();
  }

  function start() {
    addStyles();
    reconcile();

    let scheduled = false;
    const scheduleReconcile = () => {
      if (scheduled) return;
      scheduled = true;

      window.requestAnimationFrame(() => {
        scheduled = false;
        reconcile();
      });
    };

    new MutationObserver(scheduleReconcile).observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true
    });
    window.addEventListener('hashchange', scheduleReconcile);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})(window, document);
