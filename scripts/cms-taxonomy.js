'use strict';

function normalizePath(path) {
  if (!Array.isArray(path)) return [];

  return path
    .map(item => String(item || '').trim())
    .filter(Boolean);
}

function addPath(nodes, path) {
  let branch = nodes;

  path.forEach(name => {
    let node = branch.find(item => item.name === name);

    if (!node) {
      node = { name, children: [] };
      branch.push(node);
    }

    branch = node.children;
  });
}

function sortTree(nodes) {
  return nodes
    .sort((left, right) => left.name.localeCompare(right.name, 'zh-Hans-CN'))
    .map(node => ({
      name: node.name,
      children: sortTree(node.children)
    }));
}

function addPostCategories(nodes, post) {
  const categories = post.categories && post.categories.data;

  if (!Array.isArray(categories) || categories.length === 0) return;

  addPath(nodes, categories.map(category => category.name));
}

function addPostTags(tags, post) {
  const postTags = post.tags && post.tags.data;

  if (!Array.isArray(postTags)) return;

  postTags.forEach(tag => {
    const name = String(tag.name || '').trim();
    if (name) tags.add(name);
  });
}

hexo.extend.generator.register('cms-taxonomy', function (locals) {
  const data = this.locals.get('data');
  const seed = data['cms-taxonomy'] || {};
  const categories = [];
  const tags = new Set((seed.tags || []).map(tag => String(tag).trim()).filter(Boolean));

  (seed.categories || []).forEach(path => addPath(categories, normalizePath(path)));

  (locals.posts.data || []).forEach(post => {
    addPostCategories(categories, post);
    addPostTags(tags, post);
  });

  return {
    path: 'admin/taxonomy.json',
    data: JSON.stringify({
      categories: sortTree(categories),
      tags: Array.from(tags).sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'))
    }, null, 2)
  };
});
