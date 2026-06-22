(function (window, document) {
  'use strict';

  const storagePrefix = 'meow-category-expanded:';

  function getDirectChild(element, selector) {
    return Array.from(element.children).find(child => child.matches(selector));
  }

  function setExpanded(item, expanded, persist) {
    const toggle = item.querySelector(':scope > .category-tree-row .category-tree-toggle');
    const childList = getDirectChild(item, '.category-list-child');
    if (!toggle || !childList) return;

    item.classList.toggle('is-collapsed', !expanded);
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.setAttribute('aria-label', expanded ? '收起子分类' : '展开子分类');

    if (persist) {
      window.sessionStorage.setItem(storagePrefix + item.dataset.categoryKey, String(expanded));
    }
  }

  function decorateList(list, depth) {
    Array.from(list.children).forEach((item, index) => {
      if (!item.matches('.category-list-item') || item.dataset.categoryTreeReady === 'true') return;

      const link = getDirectChild(item, '.category-list-link');
      const count = getDirectChild(item, '.category-list-count');
      const childList = getDirectChild(item, '.category-list-child');
      if (!link) return;

      item.dataset.categoryTreeReady = 'true';
      item.dataset.categoryDepth = String(depth);
      item.dataset.categoryKey = encodeURIComponent(link.getAttribute('href') || String(index));

      const row = document.createElement('div');
      row.className = 'category-tree-row';
      const icon = document.createElement('i');
      icon.className = childList
        ? 'category-tree-icon fa-regular fa-folder-open'
        : 'category-tree-icon fa-regular fa-file-lines';

      if (childList) {
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'category-tree-toggle';
        toggle.innerHTML = '<i class="fa-solid fa-chevron-right" aria-hidden="true"></i>';
        toggle.addEventListener('click', event => {
          event.preventDefault();
          setExpanded(item, item.classList.contains('is-collapsed'), true);
        });
        row.appendChild(toggle);
      } else {
        const spacer = document.createElement('span');
        spacer.className = 'category-tree-toggle-spacer';
        row.appendChild(spacer);
      }

      row.append(icon, link);
      if (count) row.appendChild(count);
      item.insertBefore(row, item.firstChild);

      if (childList) {
        decorateList(childList, depth + 1);
        const savedState = window.sessionStorage.getItem(storagePrefix + item.dataset.categoryKey);
        setExpanded(item, savedState === 'true', false);
      }
    });
  }

  function init() {
    const rootList = document.querySelector('.categories-list-container-helpers > .category-list');
    if (rootList) decorateList(rootList, 0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})(window, document);
