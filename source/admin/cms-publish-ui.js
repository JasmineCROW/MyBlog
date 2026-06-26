(function (window, document) {
  'use strict';

  const newEntryPattern = /\/collections\/posts\/new(?:$|[/?#])/;
  const existingEntryPattern = /\/collections\/posts\/entries\//;
  const actionTextPattern = /(发布|Publish|保存|Save|更新|Update)/i;
  const dropdownTextPattern = /(发布，然后新建内容|发布，然后复制内容|Publish and create new|Publish and duplicate|复制|Copy|Duplicate)/i;
  const successTextPattern = /(发布成功|保存成功|更新成功|Published|Saved|Updated|Entry saved|Entry published)/i;
  const errorTextPattern = /(发布失败|保存失败|更新失败|失败|错误|Error|Failed|Unable)/i;
  const proxyButtonId = 'cms-direct-publish-button';
  const toastId = 'cms-publish-toast';

  let pendingAction = null;
  let feedbackTimer = null;

  function addStyles() {
    if (document.getElementById('cms-publish-ui-styles')) return;

    const style = document.createElement('style');
    style.id = 'cms-publish-ui-styles';
    style.textContent = `
      .cms-direct-update-button {
        border: 1px solid #fecaca !important;
        background: #fee2e2 !important;
        color: #991b1b !important;
        box-shadow: none !important;
      }
      .cms-direct-update-button:hover,
      .cms-direct-update-button:focus {
        border-color: #fca5a5 !important;
        background: #fecaca !important;
        color: #7f1d1d !important;
      }
      .cms-publish-dropdown-trigger-hidden,
      .cms-publish-dropdown-menu-hidden {
        display: none !important;
      }
      #${proxyButtonId} {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 36px;
        border-radius: 4px;
        border: 1px solid #14b8a6;
        background: #14b8a6;
        color: #ffffff;
        cursor: pointer;
        font: 600 14px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        padding: 8px 14px;
      }
      #${proxyButtonId}.cms-direct-update-button {
        border: 1px solid #fecaca;
        background: #fee2e2;
        color: #991b1b;
      }
      #${proxyButtonId}.cms-direct-update-button:hover,
      #${proxyButtonId}.cms-direct-update-button:focus {
        border-color: #fca5a5;
        background: #fecaca;
        color: #7f1d1d;
      }
      #${toastId} {
        position: fixed;
        right: 24px;
        top: 72px;
        z-index: 10000;
        max-width: min(360px, calc(100vw - 32px));
        border: 1px solid #bbf7d0;
        border-radius: 8px;
        background: #f0fdf4;
        color: #166534;
        box-shadow: 0 12px 28px rgba(15, 23, 42, 0.16);
        font: 600 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        padding: 10px 14px;
      }
      #${toastId}.is-error {
        border-color: #fecaca;
        background: #fef2f2;
        color: #991b1b;
      }
    `;
    document.head.appendChild(style);
  }

  function routeState() {
    const hash = window.location.hash || '';

    return {
      isEditor: newEntryPattern.test(hash) || existingEntryPattern.test(hash),
      isNewEntry: newEntryPattern.test(hash),
      isExistingEntry: existingEntryPattern.test(hash)
    };
  }

  function labelForState(state) {
    return state.isExistingEntry ? '更新' : '发布';
  }

  function successLabelForState(state) {
    return state.isExistingEntry ? '已更新' : '已发布';
  }

  function buttonText(button) {
    return (button.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function isInsideCustomUi(element) {
    return Boolean(element.closest('.cms-taxonomy-card, .cms-taxonomy-modal, #' + proxyButtonId));
  }

  function visibleElement(element) {
    return element.offsetParent !== null || element.getClientRects().length > 0;
  }

  function allButtons() {
    return Array.from(document.querySelectorAll('button')).filter(button => !isInsideCustomUi(button));
  }

  function isDropdownTrigger(button) {
    const text = buttonText(button);
    const label = `${button.getAttribute('aria-label') || ''} ${button.title || ''}`.toLowerCase();

    return (
      button.getAttribute('aria-haspopup') === 'true' ||
      button.getAttribute('aria-expanded') !== null ||
      /dropdown|menu|more|更多|菜单/.test(label) ||
      text === '' ||
      text === '▾' ||
      text === '▼' ||
      text === '⌄'
    );
  }

  function isActionButton(button) {
    const text = buttonText(button);
    if (!text || dropdownTextPattern.test(text)) return false;
    if (isDropdownTrigger(button) && !actionTextPattern.test(text)) return false;

    return actionTextPattern.test(text);
  }

  function actionButtons() {
    return allButtons().filter(button => visibleElement(button) && isActionButton(button));
  }

  function primaryActionButton() {
    const buttons = actionButtons();

    return (
      buttons.find(button => /发布|Publish/i.test(buttonText(button))) ||
      buttons.find(button => /保存|Save|更新|Update/i.test(buttonText(button))) ||
      null
    );
  }

  function setButtonLabel(button, label) {
    const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
    const textNodes = [];
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

  function styleActionButton(button, state) {
    if (!button) return;

    button.classList.toggle('cms-direct-update-button', state.isExistingEntry);
    setButtonLabel(button, labelForState(state));
  }

  function hideDropdownTriggers() {
    allButtons().forEach(button => {
      if (!isDropdownTrigger(button)) return;
      if (isActionButton(button)) return;

      button.classList.add('cms-publish-dropdown-trigger-hidden');
      button.setAttribute('aria-hidden', 'true');
      button.tabIndex = -1;
      button.setAttribute('data-cms-publish-dropdown-hidden', 'true');
    });
  }

  function hideDropdownMenus() {
    document.querySelectorAll('[role="menu"], [class*="Dropdown"], [class*="Menu"], [class*="Popover"]').forEach(menu => {
      const text = (menu.textContent || '').replace(/\s+/g, ' ').trim();
      if (!dropdownTextPattern.test(text)) return;

      menu.classList.add('cms-publish-dropdown-menu-hidden');
      menu.setAttribute('aria-hidden', 'true');
    });
  }

  function appHeaderActions() {
    return document.querySelector('[class*="AppHeaderActions"]');
  }

  function ensureProxyButton(state, nativeButton) {
    let proxyButton = document.getElementById(proxyButtonId);

    if (!state.isEditor) {
      if (proxyButton) proxyButton.remove();
      return null;
    }

    if (nativeButton && visibleElement(nativeButton)) {
      if (proxyButton) proxyButton.remove();
      return null;
    }

    if (!proxyButton) {
      proxyButton = document.createElement('button');
      proxyButton.id = proxyButtonId;
      proxyButton.type = 'button';
      proxyButton.addEventListener('click', event => {
        event.preventDefault();
        runDirectPublish();
      });
    }

    proxyButton.textContent = labelForState(state);
    proxyButton.classList.toggle('cms-direct-update-button', state.isExistingEntry);

    const actions = appHeaderActions();
    if (actions && proxyButton.parentElement !== actions) {
      actions.insertBefore(proxyButton, actions.firstChild);
    } else if (!actions && !proxyButton.parentElement) {
      proxyButton.style.position = 'fixed';
      proxyButton.style.right = '24px';
      proxyButton.style.top = '18px';
      proxyButton.style.zIndex = '10000';
      document.body.appendChild(proxyButton);
    }

    return proxyButton;
  }

  function showToast(message, isError) {
    let toast = document.getElementById(toastId);

    if (!toast) {
      toast = document.createElement('div');
      toast.id = toastId;
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }

    toast.classList.toggle('is-error', Boolean(isError));
    toast.textContent = message;

    window.clearTimeout(feedbackTimer);
    feedbackTimer = window.setTimeout(() => {
      toast.remove();
    }, 3200);
  }

  function setTemporaryLabel(label) {
    const nativeButton = primaryActionButton();
    const proxyButton = document.getElementById(proxyButtonId);

    if (nativeButton) setButtonLabel(nativeButton, label);
    if (proxyButton) proxyButton.textContent = label;
  }

  function completePending(success, message) {
    if (!pendingAction) return;

    const state = routeState();
    const finalLabel = success ? successLabelForState(state) : labelForState(state);

    setTemporaryLabel(finalLabel);
    showToast(message || finalLabel, !success);
    pendingAction = null;

    window.setTimeout(() => {
      reconcile();
    }, 1400);
  }

  function watchForFeedback() {
    if (!pendingAction) return;

    const text = (document.body.textContent || '').replace(/\s+/g, ' ');

    if (errorTextPattern.test(text)) {
      completePending(false, '发布或更新失败，请查看页面提示。');
      return;
    }

    if (successTextPattern.test(text)) {
      completePending(true);
    }
  }

  function clickFirstPublishMenuItem() {
    const menuItems = Array.from(document.querySelectorAll('[role="menu"] button, [role="menuitem"], [class*="Dropdown"] button, [class*="Menu"] button'));
    const item = menuItems.find(element => {
      const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
      return /(立即发布|Publish now|Publish|发布)$/i.test(text) && !dropdownTextPattern.test(text);
    });

    if (item) {
      item.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      return true;
    }

    return false;
  }

  function runDirectPublish() {
    const state = routeState();
    const button = primaryActionButton();

    if (!state.isEditor) return;

    if (!button) {
      showToast('当前没有可提交的更改。', false);
      return;
    }

    pendingAction = {
      startedAt: Date.now(),
      state
    };

    setTemporaryLabel(state.isExistingEntry ? '更新中...' : '发布中...');

    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));

    window.setTimeout(() => {
      hideDropdownMenus();
      clickFirstPublishMenuItem();
    }, 40);

    window.setTimeout(() => {
      if (pendingAction) completePending(true);
    }, 7000);
  }

  function interceptDropdownClicks() {
    if (document.documentElement.dataset.cmsPublishDropdownIntercepted === 'true') return;

    document.documentElement.dataset.cmsPublishDropdownIntercepted = 'true';
    document.addEventListener('click', event => {
      const button = event.target && event.target.closest && event.target.closest('button');
      if (!button || !isDropdownTrigger(button) || isActionButton(button)) return;

      button.classList.add('cms-publish-dropdown-trigger-hidden');
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      hideDropdownMenus();
    }, true);
  }

  function attachActionHandler(button) {
    if (!button || button.dataset.cmsDirectPublishReady === 'true') return;

    button.dataset.cmsDirectPublishReady = 'true';
    button.addEventListener('click', () => {
      const state = routeState();
      pendingAction = { startedAt: Date.now(), state };
      setTemporaryLabel(state.isExistingEntry ? '更新中...' : '发布中...');

      window.setTimeout(() => {
        hideDropdownMenus();
        clickFirstPublishMenuItem();
      }, 40);

      window.setTimeout(() => {
        if (pendingAction) completePending(true);
      }, 7000);
    });
  }

  function reconcile() {
    const state = routeState();

    hideDropdownTriggers();
    hideDropdownMenus();

    const nativeButton = primaryActionButton();
    if (nativeButton && state.isEditor) {
      styleActionButton(nativeButton, state);
      attachActionHandler(nativeButton);
    }

    ensureProxyButton(state, nativeButton);
    watchForFeedback();
  }

  function start() {
    addStyles();
    interceptDropdownClicks();
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
