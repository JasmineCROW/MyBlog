(function (window, document) {
  'use strict';

  console.log('[cms-publish-ui] loaded');

  const scriptName = 'cms-publish-ui';
  const editorRoutePattern = /#\/collections\/posts\/(?:new|entries\/)/;
  const newEntryPattern = /#\/collections\/posts\/new(?:$|[/?#])/;
  const existingEntryPattern = /#\/collections\/posts\/entries\//;
  const actionTextPattern = /(发布|已发布|Publish|Published|保存|Save|更新|Update)/i;
  const dropdownTextPattern = /(复制|Copy|Duplicate|发布，然后新建内容|发布，然后复制内容|Publish and create new|Publish and duplicate)/i;
  const unsavedTextPattern = /(含未保存的修改|未保存|Unsaved|modified|changes)/i;
  const successTextPattern = /(已发布|已更新|发布成功|保存成功|更新成功|Published|Saved|Updated|Entry saved|Entry published)/i;
  const errorTextPattern = /(发布失败|保存失败|更新失败|失败|错误|Error|Failed|Unable)/i;
  const toastId = 'cms-publish-ui-toast';

  let pendingAction = null;
  let toastTimer = null;
  let patchCounter = 0;

  function log(message, details) {
    if (details === undefined) {
      console.log(`[${scriptName}] ${message}`);
    } else {
      console.log(`[${scriptName}] ${message}`, details);
    }
  }

  function routeState() {
    const hash = window.location.hash || '';

    return {
      isEditor: editorRoutePattern.test(hash),
      isNewEntry: newEntryPattern.test(hash),
      isExistingEntry: existingEntryPattern.test(hash),
      hash
    };
  }

  function visible(element) {
    return Boolean(element && (element.offsetParent !== null || element.getClientRects().length > 0));
  }

  function textOf(element) {
    return (element && element.textContent ? element.textContent : '').replace(/\s+/g, ' ').trim();
  }

  function isCustomAdminControl(element) {
    return Boolean(element.closest('.cms-taxonomy-card, .cms-taxonomy-modal, #' + toastId));
  }

  function addStyles() {
    if (document.getElementById('cms-publish-ui-styles')) return;

    const style = document.createElement('style');
    style.id = 'cms-publish-ui-styles';
    style.textContent = `
      .cms-publish-ui-update-button {
        border: 1px solid #fecaca !important;
        background: #fee2e2 !important;
        color: #991b1b !important;
        box-shadow: none !important;
      }
      .cms-publish-ui-update-button:hover,
      .cms-publish-ui-update-button:focus {
        border-color: #fca5a5 !important;
        background: #fecaca !important;
        color: #7f1d1d !important;
      }
      .cms-publish-ui-dropdown-trigger {
        display: none !important;
        pointer-events: none !important;
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

    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.remove();
    }, 3200);
  }

  function allButtons() {
    return Array.from(document.querySelectorAll('button')).filter(button => !isCustomAdminControl(button));
  }

  function buttonLooksLikeCaret(button) {
    const text = textOf(button);
    const label = `${button.getAttribute('aria-label') || ''} ${button.title || ''}`.toLowerCase();
    const svgCount = button.querySelectorAll('svg').length;

    return (
      button.getAttribute('aria-haspopup') === 'true' ||
      button.getAttribute('aria-expanded') !== null ||
      /dropdown|menu|more|更多|菜单|展开/.test(label) ||
      text === '' ||
      text === '▾' ||
      text === '▼' ||
      text === '⌄' ||
      (text.length <= 2 && svgCount > 0)
    );
  }

  function buttonLooksLikePublishAction(button) {
    const text = textOf(button);
    if (!text || dropdownTextPattern.test(text)) return false;
    if (!actionTextPattern.test(text)) return false;
    if (buttonLooksLikeCaret(button) && !/(发布|已发布|Publish|Published|保存|Save|更新|Update)/i.test(text)) return false;

    return true;
  }

  function headerActionRoot() {
    return document.querySelector('[class*="AppHeaderActions"]') ||
      document.querySelector('[class*="EditorToolbar"]') ||
      document.querySelector('header');
  }

  function candidateActionButtons() {
    const root = headerActionRoot();
    const buttons = allButtons().filter(button => visible(button) && buttonLooksLikePublishAction(button));

    if (!root) return buttons;

    return buttons.sort((left, right) => {
      const leftInRoot = root.contains(left) ? 0 : 1;
      const rightInRoot = root.contains(right) ? 0 : 1;
      return leftInRoot - rightInRoot;
    });
  }

  function primaryActionButton(state) {
    const buttons = candidateActionButtons();

    if (state && state.isExistingEntry) {
      return (
        buttons.find(button => /(保存|Save|更新|Update)/i.test(textOf(button))) ||
        buttons.find(button => /(发布|Publish)/i.test(textOf(button)) && !/(已发布|Published)/i.test(textOf(button))) ||
        buttons.find(button => /(已发布|Published)/i.test(textOf(button))) ||
        null
      );
    }

    return (
      buttons.find(button => /(发布|Publish)/i.test(textOf(button))) ||
      buttons.find(button => /(保存|Save|更新|Update)/i.test(textOf(button))) ||
      buttons.find(button => /(已发布|Published)/i.test(textOf(button))) ||
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

  function patchMainButton(button, state) {
    if (!button || !state.isEditor) return;

    button.classList.remove('cms-publish-update-button', 'cms-direct-update-button');
    button.classList.toggle('cms-publish-ui-update-button', state.isExistingEntry);
    button.removeAttribute('data-cms-publish-dropdown-hidden');
    button.style.removeProperty('display');
    button.style.removeProperty('pointer-events');
    setButtonLabel(button, state.isExistingEntry ? '更新' : '发布');

    if (button.dataset.cmsPublishUiActionReady !== 'true') {
      button.dataset.cmsPublishUiActionReady = 'true';
      button.addEventListener('click', () => {
        pendingAction = {
          state: routeState(),
          startedAt: Date.now()
        };
        setButtonLabel(button, routeState().isExistingEntry ? '更新中...' : '发布中...');
        window.setTimeout(removeDropdownMenus, 20);
      });
    }
  }

  function dropdownTriggersNear(button) {
    if (!button || !button.parentElement) return [];

    const relatives = [
      button.previousElementSibling,
      button.nextElementSibling,
      ...Array.from(button.parentElement.children)
    ].filter(Boolean);

    return Array.from(new Set(relatives)).filter(element => {
      if (!(element instanceof HTMLElement) || element === button) return false;
      if (!element.matches('button')) return false;
      if (buttonLooksLikePublishAction(element)) return false;
      return buttonLooksLikeCaret(element);
    });
  }

  function disableDropdownTrigger(trigger) {
    trigger.classList.add('cms-publish-ui-dropdown-trigger');
    trigger.setAttribute('aria-hidden', 'true');
    trigger.setAttribute('tabindex', '-1');
    trigger.setAttribute('data-cms-publish-ui-disabled', 'true');
    trigger.style.setProperty('display', 'none', 'important');
    trigger.style.setProperty('pointer-events', 'none', 'important');
  }

  function disableDropdownTriggers(mainButton) {
    dropdownTriggersNear(mainButton).forEach(disableDropdownTrigger);

    allButtons().forEach(button => {
      if (!buttonLooksLikeCaret(button)) return;
      if (buttonLooksLikePublishAction(button)) return;
      const nearbyText = textOf(button.parentElement || button);
      if (/(发布|已发布|Publish|Published|保存|Save|更新|Update|复制|Copy)/i.test(nearbyText)) {
        disableDropdownTrigger(button);
      }
    });
  }

  function removeDropdownMenus() {
    const menuSelectors = [
      '[role="menu"]',
      '[role="listbox"]',
      '[class*="Dropdown"]',
      '[class*="Menu"]',
      '[class*="Popover"]',
      '[class*="Tooltip"]'
    ].join(',');

    document.querySelectorAll(menuSelectors).forEach(menu => {
      const text = textOf(menu);
      if (!dropdownTextPattern.test(text)) return;

      log('removed dropdown menu', text);
      menu.remove();
    });
  }

  function feedbackFromDom() {
    if (!pendingAction) return;

    const text = textOf(document.body);
    if (errorTextPattern.test(text)) {
      showToast('发布或更新失败，请查看页面提示。', true);
      pendingAction = null;
      return;
    }

    if (successTextPattern.test(text)) {
      const state = routeState();
      const message = state.isExistingEntry ? '已更新' : '已发布';
      showToast(message, false);
      pendingAction = null;
      return;
    }

    if (Date.now() - pendingAction.startedAt > 7000) {
      const state = routeState();
      showToast(state.isExistingEntry ? '已更新' : '已发布', false);
      pendingAction = null;
    }
  }

  function patch() {
    const state = routeState();
    patchCounter += 1;

    removeDropdownMenus();

    if (!state.isEditor) return;

    const mainButton = primaryActionButton(state);
    patchMainButton(mainButton, state);
    disableDropdownTriggers(mainButton);
    feedbackFromDom();

    if (patchCounter <= 8 || patchCounter % 20 === 0) {
      log('patch', {
        count: patchCounter,
        route: state.hash,
        mainButton: mainButton ? textOf(mainButton) : null,
        actionButtons: candidateActionButtons().map(textOf),
        dropdownTriggers: document.querySelectorAll('[data-cms-publish-ui-disabled="true"]').length
      });
    }
  }

  function schedulePatch() {
    if (schedulePatch.scheduled) return;
    schedulePatch.scheduled = true;

    window.requestAnimationFrame(() => {
      schedulePatch.scheduled = false;
      patch();
    });
  }

  function interceptDropdownEvents() {
    if (document.documentElement.dataset.cmsPublishUiEvents === 'true') return;
    document.documentElement.dataset.cmsPublishUiEvents = 'true';

    ['pointerdown', 'mousedown', 'click'].forEach(eventName => {
      document.addEventListener(eventName, event => {
        const button = event.target && event.target.closest && event.target.closest('button');
        if (!button) return;

        const disabled = button.dataset.cmsPublishUiDisabled === 'true';
        const dropdown = buttonLooksLikeCaret(button) && !buttonLooksLikePublishAction(button);
        const nearbyText = textOf(button.parentElement || button);

        if (!disabled && !(dropdown && /(发布|已发布|Publish|Published|复制|Copy)/i.test(nearbyText))) return;

        log('blocked dropdown event', eventName);
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        disableDropdownTrigger(button);
        removeDropdownMenus();
      }, true);
    });
  }

  function init() {
    console.log('[cms-publish-ui] init');
    addStyles();
    interceptDropdownEvents();
    patch();

    new MutationObserver(schedulePatch).observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true
    });

    window.addEventListener('hashchange', schedulePatch);
    window.addEventListener('popstate', schedulePatch);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})(window, document);
