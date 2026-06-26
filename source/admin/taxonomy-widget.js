(function (window, document) {
  'use strict';

  const CMS = window.CMS;

  if (!CMS || typeof CMS.registerWidget !== 'function') {
    console.error('[CMS taxonomy] Decap CMS is unavailable; category_tree and tag_picker were not registered.');
    return;
  }

  const h = window.h || (window.React && window.React.createElement);

  if (typeof h !== 'function') {
    console.error('[CMS taxonomy] Decap CMS rendering helpers are unavailable; category_tree and tag_picker were not registered.');
    return;
  }

  addStyles();

  const scriptUrl = document.currentScript && document.currentScript.src;
  const taxonomyUrl = new URL('taxonomy.json', scriptUrl || window.location.href).toString();
  const taxonomy = loadTaxonomy(taxonomyUrl);

  function addStyles() {
    if (document.getElementById('cms-taxonomy-widget-styles')) return;

    const style = document.createElement('style');
    style.id = 'cms-taxonomy-widget-styles';
    style.textContent = `
      .cms-taxonomy-card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; color: #1f2937; box-sizing: border-box; }
      .cms-taxonomy-card * { box-sizing: border-box; }
      .cms-taxonomy-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
      .cms-taxonomy-title { margin: 0; color: #111827; font-size: 16px; font-weight: 650; }
      .cms-taxonomy-subtitle { margin: 4px 0 0; color: #6b7280; font-size: 13px; line-height: 1.5; }
      .cms-taxonomy-help { margin: 0 0 14px; border: 1px solid #bfdbfe; border-radius: 8px; background: #eff6ff; color: #1e40af; padding: 10px 12px; font-size: 13px; line-height: 1.5; }
      .cms-taxonomy-primary-button, .cms-taxonomy-secondary-button { border-radius: 7px; cursor: pointer; font-size: 13px; font-weight: 600; transition: background .15s ease, border-color .15s ease, color .15s ease; }
      .cms-taxonomy-primary-button { border: 1px solid #2563eb; background: #2563eb; color: #ffffff; padding: 7px 10px; white-space: nowrap; }
      .cms-taxonomy-primary-button:hover { border-color: #1d4ed8; background: #1d4ed8; }
      .cms-taxonomy-secondary-button { border: 1px solid #d1d5db; background: #ffffff; color: #374151; padding: 7px 10px; }
      .cms-taxonomy-secondary-button:hover { border-color: #93c5fd; background: #eff6ff; color: #1d4ed8; }
      .cms-taxonomy-cascade { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
      .cms-taxonomy-separator { color: #9ca3af; font-size: 16px; }
      .cms-taxonomy-menu { position: relative; }
      .cms-taxonomy-menu summary { display: flex; align-items: center; gap: 7px; min-width: 148px; border: 1px solid #d1d5db; border-radius: 8px; background: #ffffff; color: #374151; cursor: pointer; list-style: none; padding: 9px 10px; font-size: 14px; user-select: none; }
      .cms-taxonomy-menu summary::-webkit-details-marker { display: none; }
      .cms-taxonomy-menu summary:hover { border-color: #93c5fd; background: #f8fbff; }
      .cms-taxonomy-folder { position: relative; display: inline-block; width: 14px; height: 10px; border: 1.5px solid #60a5fa; border-radius: 2px; background: #dbeafe; flex: 0 0 auto; }
      .cms-taxonomy-folder::before { content: ''; position: absolute; top: -4px; left: 1px; width: 6px; height: 4px; border: 1.5px solid #60a5fa; border-bottom: 0; border-radius: 2px 2px 0 0; background: #dbeafe; }
      .cms-taxonomy-arrow { margin-left: auto; color: #6b7280; font-size: 12px; }
      .cms-taxonomy-menu-list { position: absolute; z-index: 20; top: calc(100% + 6px); left: 0; width: max-content; min-width: 208px; max-width: 320px; max-height: 230px; overflow-y: auto; margin: 0; padding: 6px; border: 1px solid #dbe3ef; border-radius: 8px; background: #ffffff; box-shadow: 0 10px 22px rgba(15, 23, 42, .12); }
      .cms-taxonomy-menu-item { display: block; width: 100%; border: 0; border-radius: 6px; background: transparent; color: #374151; cursor: pointer; padding: 8px 9px; text-align: left; font-size: 14px; }
      .cms-taxonomy-menu-item:hover, .cms-taxonomy-menu-item.is-selected { background: #eff6ff; color: #1d4ed8; }
      .cms-taxonomy-current-path { margin: 13px 0 0; color: #4b5563; font-size: 13px; }
      .cms-taxonomy-current-path strong { color: #1f2937; }
      .cms-taxonomy-path-button { border: 0; border-radius: 5px; background: transparent; color: #2563eb; cursor: pointer; padding: 2px 4px; font-size: 13px; }
      .cms-taxonomy-path-button:hover { background: #dbeafe; color: #1d4ed8; }
      .cms-taxonomy-modal { position: fixed; z-index: 1000; inset: 0; display: none; align-items: center; justify-content: center; padding: 20px; background: rgba(15, 23, 42, .42); }
      .cms-taxonomy-modal.is-open { display: flex; }
      .cms-taxonomy-modal-panel { width: min(460px, 100%); border: 1px solid #e5e7eb; border-radius: 10px; background: #ffffff; box-shadow: 0 24px 48px rgba(15, 23, 42, .2); padding: 18px; }
      .cms-taxonomy-modal-title { margin: 0 0 6px; color: #111827; font-size: 16px; font-weight: 650; }
      .cms-taxonomy-modal-text { margin: 0 0 14px; color: #6b7280; font-size: 13px; line-height: 1.5; }
      .cms-taxonomy-input { width: 100%; border: 1px solid #d1d5db; border-radius: 8px; background: #ffffff; color: #1f2937; outline: none; padding: 9px 10px; font-size: 14px; }
      .cms-taxonomy-input:focus { border-color: #60a5fa; box-shadow: 0 0 0 3px rgba(96, 165, 250, .18); }
      .cms-taxonomy-modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
      .cms-taxonomy-chip-list { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 12px; }
      .cms-taxonomy-chip { border: 1px solid #d1d5db; border-radius: 999px; background: #ffffff; color: #4b5563; cursor: pointer; padding: 6px 10px; font-size: 13px; transition: background .15s ease, border-color .15s ease, color .15s ease; }
      .cms-taxonomy-chip:hover { border-color: #93c5fd; background: #f8fbff; color: #1d4ed8; }
      .cms-taxonomy-chip.is-selected { border-color: #60a5fa; background: #eff6ff; color: #1d4ed8; }
      .cms-taxonomy-tag-entry { display: flex; gap: 8px; }
      .cms-taxonomy-tag-entry .cms-taxonomy-input { flex: 1; }
      .cms-taxonomy-date-row { display: grid; grid-template-columns: minmax(0, 1fr) 126px; gap: 10px; }
      .cms-taxonomy-date-label { display: block; margin-bottom: 5px; color: #4b5563; font-size: 13px; font-weight: 600; }
      .cms-taxonomy-date-input { width: 100%; min-height: 39px; border: 1px solid #d1d5db; border-radius: 8px; background: #ffffff; color: #1f2937; outline: none; padding: 8px 10px; font-size: 14px; }
      .cms-taxonomy-date-input:focus { border-color: #60a5fa; box-shadow: 0 0 0 3px rgba(96, 165, 250, .18); }
      .cms-taxonomy-date-actions { display: flex; gap: 8px; margin-top: 12px; }
      .cms-taxonomy-date-format { margin: 10px 0 0; color: #6b7280; font-size: 12px; }
      @media (max-width: 560px) { .cms-taxonomy-heading { flex-direction: column; } .cms-taxonomy-primary-button { width: 100%; } .cms-taxonomy-menu summary { min-width: 0; } .cms-taxonomy-date-row { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(style);
  }

  function loadTaxonomy(url) {
    const emptyTaxonomy = { categories: [], tags: [] };

    try {
      const request = new XMLHttpRequest();
      request.open('GET', url, false);
      request.send(null);

      if (request.status < 200 || request.status >= 300) {
        throw new Error(`HTTP ${request.status}`);
      }

      const parsed = JSON.parse(request.responseText);
      return {
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        tags: Array.isArray(parsed.tags) ? parsed.tags : []
      };
    } catch (error) {
      console.warn('[CMS taxonomy] Unable to load taxonomy.json; manual category and tag entry is still available.', error);
      return emptyTaxonomy;
    }
  }

  function collectionValue(value) {
    if (!value) return value;

    if (Array.isArray(value) || typeof value === 'string') return value;
    if (typeof value.toJS === 'function') return value.toJS();
    if (typeof value.toArray === 'function') return value.toArray();
    if (typeof value.toObject === 'function') return value.toObject();

    return value;
  }

  function entryFieldValue(props, fieldNames) {
    const entry = props && props.entry;
    if (!entry || typeof entry.getIn !== 'function') return undefined;

    for (const fieldName of fieldNames) {
      const value = entry.getIn(['data', fieldName]);
      if (value !== undefined && value !== null) return value;
    }

    return undefined;
  }

  function fieldValue(props, fallbackNames) {
    if (props && props.value !== undefined && props.value !== null) return props.value;
    return entryFieldValue(props, fallbackNames);
  }

  function normalizePath(value) {
    const rawValue = collectionValue(value);
    const values = Array.isArray(rawValue)
      ? rawValue
      : typeof rawValue === 'string'
        ? rawValue.split('/')
        : [];

    return values
      .map(item => String(item || '').trim())
      .filter(Boolean);
  }

  function normalizeTags(value) {
    const rawValue = collectionValue(value);
    const values = Array.isArray(rawValue)
      ? rawValue
      : typeof rawValue === 'string'
        ? rawValue.split(/\s*,\s*/)
        : [];

    return Array.from(new Set(values.map(item => String(item || '').trim()).filter(Boolean)));
  }

  function pathLabel(path) {
    return path.join(' / ');
  }

  function selectedPathDisplay(selectedPath, onChange) {
    if (selectedPath.length === 0) return '未选择';

    const content = [];

    selectedPath.forEach((name, index) => {
      if (index > 0) content.push(h('span', { className: 'cms-taxonomy-separator', key: `path-separator-${index}` }, '/'));
      content.push(h('button', {
        key: `path-${index}`,
        type: 'button',
        className: 'cms-taxonomy-path-button',
        title: `仅使用：${pathLabel(selectedPath.slice(0, index + 1))}`,
        onClick: () => onChange(selectedPath.slice(0, index + 1))
      }, name));
    });

    return content;
  }

  function folderIcon() {
    return h('span', { className: 'cms-taxonomy-folder', 'aria-hidden': 'true' });
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('is-open');
  }

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.add('is-open');
    const input = modal.querySelector('input');
    if (input) input.focus();
  }

  function commitNewCategory(inputId, modalId, onChange) {
    const input = document.getElementById(inputId);
    const path = normalizePath(input && input.value);

    if (path.length === 0) return;

    onChange(path);
    input.value = '';
    closeModal(modalId);
  }

  function categoryMenu(nodes, selectedPath, level, prefix, onChange) {
    const selectedName = selectedPath[level];
    const selectedNode = nodes.find(node => node.name === selectedName);
    const label = selectedName || (level === 0 ? '选择一级分类' : '选择子分类');

    const selector = h('details', { className: 'cms-taxonomy-menu', key: `menu-${level}-${pathLabel(prefix)}` }, [
      h('summary', {}, [folderIcon(), h('span', {}, label), h('span', { className: 'cms-taxonomy-arrow' }, '⌄')]),
      h('div', { className: 'cms-taxonomy-menu-list' }, nodes.map(node => h('button', {
        key: node.name,
        type: 'button',
        className: `cms-taxonomy-menu-item${node.name === selectedName ? ' is-selected' : ''}`,
        onClick: event => {
          onChange(prefix.concat(node.name));
          event.currentTarget.closest('details').removeAttribute('open');
        }
      }, node.name)))
    ]);

    if (!selectedNode || !selectedNode.children || selectedNode.children.length === 0) {
      return [selector];
    }

    return [selector, h('span', { className: 'cms-taxonomy-separator', key: `separator-${level}` }, '/'), ...categoryMenu(selectedNode.children, selectedPath, level + 1, prefix.concat(selectedName), onChange)];
  }

  function CategoryTreeControl(props) {
    const selectedPath = normalizePath(fieldValue(props, ['categories', 'category']));
    const modalId = `${props.forID || 'categories'}-new-category-modal`;
    const inputId = `${props.forID || 'categories'}-new-category-path`;

    return h('section', { className: `cms-taxonomy-card ${props.classNameWrapper || ''}` }, [
      h('div', { className: 'cms-taxonomy-heading' }, [
        h('div', {}, [
          h('h3', { className: 'cms-taxonomy-title' }, '分类'),
          h('p', { className: 'cms-taxonomy-subtitle' }, '选择文章所属分类，支持多级分类路径。')
        ]),
        h('button', {
          type: 'button',
          className: 'cms-taxonomy-primary-button',
          onClick: () => openModal(modalId)
        }, '+ 新建分类')
      ]),
      h('p', { className: 'cms-taxonomy-help' }, '分类数组表示父级到子级的唯一层级路径；选择子分类时会自动保留全部父级。'),
      h('div', { className: 'cms-taxonomy-cascade' }, categoryMenu(taxonomy.categories, selectedPath, 0, [], props.onChange)),
      h('p', { className: 'cms-taxonomy-current-path' }, [
        h('strong', {}, '当前分类路径：'),
        selectedPathDisplay(selectedPath, props.onChange)
      ]),
      h('div', {
        id: modalId,
        className: 'cms-taxonomy-modal',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': `${modalId}-title`,
        onClick: event => {
          if (event.target && event.target.id === modalId) closeModal(modalId);
        }
      }, h('div', { className: 'cms-taxonomy-modal-panel' }, [
        h('h4', { id: `${modalId}-title`, className: 'cms-taxonomy-modal-title' }, '新建分类'),
        h('p', { className: 'cms-taxonomy-modal-text' }, '输入完整分类路径，使用 / 分隔每一级。'),
        h('input', {
          id: inputId,
          className: 'cms-taxonomy-input',
          type: 'text',
          autoComplete: 'off',
          placeholder: '例如：主明 / 正义即正义 / 5嫉妒之章',
          onKeyDown: event => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitNewCategory(inputId, modalId, props.onChange);
            }
            if (event.key === 'Escape') closeModal(modalId);
          }
        }),
        h('div', { className: 'cms-taxonomy-modal-actions' }, [
          h('button', { type: 'button', className: 'cms-taxonomy-secondary-button', onClick: () => closeModal(modalId) }, '取消'),
          h('button', { type: 'button', className: 'cms-taxonomy-primary-button', onClick: () => commitNewCategory(inputId, modalId, props.onChange) }, '确认并选择')
        ])
      ]))
    ]);
  }

  function addTag(value, selectedTags, onChange) {
    const tag = String(value || '').trim();
    if (!tag) return;

    onChange(normalizeTags(selectedTags.concat(tag)));
  }

  function TagPickerControl(props) {
    const selectedTags = normalizeTags(fieldValue(props, ['tags']));
    const availableTags = normalizeTags(taxonomy.tags.concat(selectedTags));
    const inputId = `${props.forID || 'tags'}-new-tag`;

    return h('section', { className: `cms-taxonomy-card ${props.classNameWrapper || ''}` }, [
      h('div', { className: 'cms-taxonomy-heading' }, h('div', {}, [
        h('h3', { className: 'cms-taxonomy-title' }, '标签'),
        h('p', { className: 'cms-taxonomy-subtitle' }, '点击标签可选择/取消，已选标签会显示为蓝色。')
      ])),
      h('div', { className: 'cms-taxonomy-chip-list' }, availableTags.map(tag => {
        const selected = selectedTags.includes(tag);

        return h('button', {
          key: tag,
          type: 'button',
          className: `cms-taxonomy-chip${selected ? ' is-selected' : ''}`,
          onClick: () => props.onChange(selected ? selectedTags.filter(item => item !== tag) : selectedTags.concat(tag))
        }, selected ? `${tag} ×` : tag);
      })),
      h('div', { className: 'cms-taxonomy-tag-entry' }, [
        h('input', {
          id: inputId,
          className: 'cms-taxonomy-input',
          type: 'text',
          name: `${inputId}-value`,
          autoComplete: 'off',
          'aria-autocomplete': 'none',
          placeholder: '输入新标签并按 Enter 添加',
          onKeyDown: event => {
            if (event.key !== 'Enter') return;

            event.preventDefault();
            addTag(event.currentTarget.value, selectedTags, props.onChange);
            event.currentTarget.value = '';
          }
        }),
        h('button', {
          type: 'button',
          className: 'cms-taxonomy-secondary-button',
          onClick: () => {
            const input = document.getElementById(inputId);
            addTag(input && input.value, selectedTags, props.onChange);
            if (input) input.value = '';
          }
        }, '添加标签')
      ])
    ]);
  }

  function localDateTimeParts(value) {
    const source = value instanceof Date ? value.toISOString() : String(value || '').trim();
    const match = source.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{2}:\d{2})(?::\d{2})?)?/);

    if (match) return { date: match[1], time: match[2] || '' };

    const parsed = new Date(source);
    if (Number.isNaN(parsed.getTime())) return { date: '', time: '' };

    return {
      date: `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`,
      time: `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`
    };
  }

  function formatDateTime(date, time) {
    if (!date) return '';
    return `${date} ${time || '00:00'}:00`;
  }

  function currentDateTime() {
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return formatDateTime(date, time);
  }

  function LocalizedDateTimeControl(props) {
    const value = localDateTimeParts(props.value);
    const dateId = `${props.forID || 'date'}-date`;
    const timeId = `${props.forID || 'date'}-time`;

    return h('section', { className: `cms-taxonomy-card ${props.classNameWrapper || ''}` }, [
      h('div', { className: 'cms-taxonomy-heading' }, h('div', {}, [
        h('h3', { className: 'cms-taxonomy-title' }, '发布日期'),
        h('p', { className: 'cms-taxonomy-subtitle' }, '设置文章公开显示的日期和时间。')
      ])),
      h('div', { className: 'cms-taxonomy-date-row' }, [
        h('label', { htmlFor: dateId }, [
          h('span', { className: 'cms-taxonomy-date-label' }, '日期'),
          h('input', {
            id: dateId,
            className: 'cms-taxonomy-date-input',
            type: 'date',
            value: value.date,
            autoComplete: 'off',
            'aria-label': '发布日期，年 / 月 / 日',
            onChange: event => props.onChange(formatDateTime(event.currentTarget.value, value.time))
          })
        ]),
        h('label', { htmlFor: timeId }, [
          h('span', { className: 'cms-taxonomy-date-label' }, '时间'),
          h('input', {
            id: timeId,
            className: 'cms-taxonomy-date-input',
            type: 'time',
            value: value.time,
            autoComplete: 'off',
            'aria-label': '发布时间，时和分',
            onChange: event => props.onChange(formatDateTime(value.date, event.currentTarget.value))
          })
        ])
      ]),
      h('div', { className: 'cms-taxonomy-date-actions' }, [
        h('button', { type: 'button', className: 'cms-taxonomy-primary-button', onClick: () => props.onChange(currentDateTime()) }, '现在'),
        h('button', { type: 'button', className: 'cms-taxonomy-secondary-button', onClick: () => props.onChange('') }, '清除')
      ]),
      h('p', { className: 'cms-taxonomy-date-format' }, '保存格式：年 / 月 / 日  --:--（例如 2026-06-21 14:30:00）')
    ]);
  }

  CMS.registerWidget('category_tree', CategoryTreeControl);
  CMS.registerWidget('tag_picker', TagPickerControl);
  CMS.registerWidget('localized_datetime', LocalizedDateTimeControl);
})(window, document);
