(function (window, document) {
  'use strict';

  console.log('[cms-publish-ui] loaded');

  const menuTextPattern = /(复制|Copy|Duplicate|发布，然后新建内容|发布，然后复制内容|Publish and create new|Publish and duplicate)/i;
  const publishAreaTextPattern = /(发布|已发布|Publish|Published|保存|Save|更新|Update|复制|Copy)/i;

  function log(message, details) {
    if (details === undefined) {
      console.log(`[cms-publish-ui] ${message}`);
    } else {
      console.log(`[cms-publish-ui] ${message}`, details);
    }
  }

  function textOf(element) {
    return (element && element.textContent ? element.textContent : '').replace(/\s+/g, ' ').trim();
  }

  function addStyles() {
    if (document.getElementById('cms-publish-ui-styles')) return;

    const style = document.createElement('style');
    style.id = 'cms-publish-ui-styles';
    style.textContent = `
      .cms-publish-ui-dropdown-trigger,
      .cms-publish-ui-dropdown-menu {
        display: none !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function buttonHasUsefulText(button) {
    return /(发布|已发布|Publish|Published|保存|Save|更新|Update)/i.test(textOf(button));
  }

  function buttonLooksLikeBareCaret(button) {
    const text = textOf(button);
    const label = `${button.getAttribute('aria-label') || ''} ${button.title || ''}`.toLowerCase();
    const svgCount = button.querySelectorAll('svg').length;

    if (buttonHasUsefulText(button)) return false;

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

  function disableDropdownTrigger(button) {
    button.classList.add('cms-publish-ui-dropdown-trigger');
    button.setAttribute('aria-hidden', 'true');
    button.setAttribute('tabindex', '-1');
    button.dataset.cmsPublishUiDisabled = 'true';
    button.style.setProperty('display', 'none', 'important');
    button.style.setProperty('pointer-events', 'none', 'important');
  }

  function hideDropdownTriggers() {
    document.querySelectorAll('button').forEach(button => {
      if (!buttonLooksLikeBareCaret(button)) return;

      const parentText = textOf(button.parentElement || button);
      if (!publishAreaTextPattern.test(parentText)) return;

      disableDropdownTrigger(button);
    });
  }

  function hideDropdownMenus() {
    const selectors = [
      '[role="menu"]',
      '[role="listbox"]',
      '[class*="Dropdown"]',
      '[class*="Menu"]',
      '[class*="Popover"]'
    ].join(',');

    document.querySelectorAll(selectors).forEach(menu => {
      const text = textOf(menu);
      if (!menuTextPattern.test(text)) return;

      menu.classList.add('cms-publish-ui-dropdown-menu');
      menu.setAttribute('aria-hidden', 'true');
      if (menu instanceof HTMLElement) {
        menu.style.setProperty('display', 'none', 'important');
        menu.style.setProperty('pointer-events', 'none', 'important');
      }
      log('hid dropdown menu', text);
    });
  }

  function patch() {
    hideDropdownTriggers();
    hideDropdownMenus();
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

        if (button.dataset.cmsPublishUiDisabled !== 'true' && !buttonLooksLikeBareCaret(button)) return;

        const parentText = textOf(button.parentElement || button);
        if (!publishAreaTextPattern.test(parentText)) return;

        log('blocked dropdown event', eventName);
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        disableDropdownTrigger(button);
        hideDropdownMenus();
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
