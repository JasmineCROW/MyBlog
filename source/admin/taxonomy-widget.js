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

  const scriptUrl = document.currentScript && document.currentScript.src;
  const taxonomyUrl = new URL('taxonomy.json', scriptUrl || window.location.href).toString();
  const taxonomy = loadTaxonomy(taxonomyUrl);

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

  function normalizePath(value) {
    const values = Array.isArray(value) ? value : typeof value === 'string' ? value.split('/') : [];

    return values
      .map(item => String(item || '').trim())
      .filter(Boolean);
  }

  function normalizeTags(value) {
    const values = Array.isArray(value) ? value : [];
    return Array.from(new Set(values.map(item => String(item || '').trim()).filter(Boolean)));
  }

  function pathLabel(path) {
    return path.join(' / ');
  }

  function treeNode(node, path, selectedPath, onChange, depth) {
    const currentPath = path.concat(node.name);
    const isSelected = pathLabel(currentPath) === pathLabel(selectedPath);
    const buttonStyle = {
      display: 'block',
      width: '100%',
      padding: '5px 8px',
      margin: '2px 0',
      border: isSelected ? '2px solid #3b82f6' : '1px solid #d1d5db',
      borderRadius: '4px',
      background: isSelected ? '#eff6ff' : '#fff',
      color: '#111827',
      cursor: 'pointer',
      textAlign: 'left',
      fontSize: '14px'
    };

    return h('li', {
      key: pathLabel(currentPath),
      style: { listStyle: 'none', marginLeft: `${depth * 16}px` }
    }, [
      h('button', {
        type: 'button',
        style: buttonStyle,
        onClick: () => onChange(currentPath)
      }, `${node.children && node.children.length ? '▾ ' : '• '}${node.name}`),
      node.children && node.children.length
        ? h('ul', { style: { margin: 0, padding: 0 } }, node.children.map(child => treeNode(child, currentPath, selectedPath, onChange, depth + 1)))
        : null
    ]);
  }

  function useNewCategory(inputId, onChange) {
    const input = document.getElementById(inputId);
    const path = normalizePath(input && input.value);

    if (path.length === 0) return;

    onChange(path);
    input.value = '';
  }

  function CategoryTreeControl(props) {
    const selectedPath = normalizePath(props.value);
    const inputId = `${props.forID || 'categories'}-new-path`;

    return h('div', { className: props.classNameWrapper }, [
      h('p', { style: { margin: '0 0 8px' } }, '选择一个分类节点；子分类会自动保存完整层级路径。'),
      h('ul', {
        style: {
          margin: '0 0 12px',
          padding: 0,
          maxHeight: '260px',
          overflowY: 'auto'
        }
      }, taxonomy.categories.map(node => treeNode(node, [], selectedPath, props.onChange, 0))),
      h('label', { htmlFor: inputId, style: { display: 'block', marginBottom: '4px' } }, '新建分类路径'),
      h('div', { style: { display: 'flex', gap: '8px' } }, [
        h('input', {
          id: inputId,
          type: 'text',
          placeholder: '例如：主明 / 正义即正义 / 5嫉妒之章',
          style: { flex: 1 },
          onKeyDown: event => {
            if (event.key === 'Enter') {
              event.preventDefault();
              useNewCategory(inputId, props.onChange);
            }
          }
        }),
        h('button', {
          type: 'button',
          onClick: () => useNewCategory(inputId, props.onChange)
        }, '新增并选择')
      ]),
      selectedPath.length > 0
        ? h('p', { style: { margin: '8px 0 0', color: '#374151' } }, `当前分类：${pathLabel(selectedPath)}`)
        : null
    ]);
  }

  function addTag(inputId, selectedTags, onChange) {
    const input = document.getElementById(inputId);
    const tag = String(input && input.value || '').trim();

    if (!tag) return;

    onChange(normalizeTags(selectedTags.concat(tag)));
    input.value = '';
  }

  function TagPickerControl(props) {
    const selectedTags = normalizeTags(props.value);
    const inputId = `${props.forID || 'tags'}-new-tag`;
    const listId = `${inputId}-options`;

    return h('div', { className: props.classNameWrapper }, [
      h('p', { style: { margin: '0 0 8px' } }, '搜索已有标签，或输入新标签后按 Enter 添加。'),
      h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' } }, selectedTags.map(tag => h('button', {
        key: tag,
        type: 'button',
        title: `移除标签：${tag}`,
        style: {
          border: '1px solid #93c5fd',
          borderRadius: '999px',
          background: '#eff6ff',
          color: '#1d4ed8',
          cursor: 'pointer',
          padding: '3px 8px'
        },
        onClick: () => props.onChange(selectedTags.filter(item => item !== tag))
      }, `${tag} ×`))),
      h('div', { style: { display: 'flex', gap: '8px' } }, [
        h('input', {
          id: inputId,
          type: 'text',
          list: listId,
          placeholder: '搜索或新建标签',
          style: { flex: 1 },
          onKeyDown: event => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addTag(inputId, selectedTags, props.onChange);
            }
          }
        }),
        h('datalist', { id: listId }, taxonomy.tags.map(tag => h('option', { key: tag, value: tag }))),
        h('button', {
          type: 'button',
          onClick: () => addTag(inputId, selectedTags, props.onChange)
        }, '添加标签')
      ])
    ]);
  }

  CMS.registerWidget('category_tree', CategoryTreeControl);
  CMS.registerWidget('tag_picker', TagPickerControl);
})(window, document);
