'use strict';

function taxonomyNames(post, kind) {
  const collection = kind === 'category' ? post.categories : post.tags;
  if (!collection || typeof collection.toArray !== 'function') return [];

  return collection.toArray()
    .map(item => String(item.name))
    .filter(Boolean);
}

function postsByDate(posts) {
  return posts.slice().sort((left, right) => {
    const dateDifference = right.date.valueOf() - left.date.valueOf();
    return dateDifference || String(left.path).localeCompare(String(right.path));
  });
}

function buildTaxonomyContexts(sitePosts, post, kind, urlFor) {
  const contexts = Object.create(null);

  taxonomyNames(post, kind).forEach(name => {
    const matchingPosts = postsByDate(sitePosts.filter(candidate =>
      taxonomyNames(candidate, kind).includes(name)
    ));
    const currentIndex = matchingPosts.findIndex(candidate => candidate.path === post.path);

    if (currentIndex === -1) return;

    const newer = matchingPosts[currentIndex - 1];
    const older = matchingPosts[currentIndex + 1];
    contexts[name] = {
      prev: newer ? urlFor(newer.path) : null,
      next: older ? urlFor(older.path) : null
    };
  });

  return contexts;
}

hexo.extend.helper.register('post_nav_context', function (post) {
  const sitePosts = this.site.posts.toArray();
  const urlFor = path => this.url_for(path);
  const contexts = {
    category: buildTaxonomyContexts(sitePosts, post, 'category', urlFor),
    tag: buildTaxonomyContexts(sitePosts, post, 'tag', urlFor)
  };

  return JSON.stringify(contexts)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
});
