const pagination = require('hexo-pagination');

function isPinned(post) {
  return post.top === true;
}

function postDate(post) {
  return new Date(post.date).getTime();
}

hexo.extend.generator.register('index', function (locals) {
  const config = this.config;
  const posts = locals.posts;

  posts.data = posts.data.slice().sort((a, b) => {
    const aPinned = isPinned(a);
    const bPinned = isPinned(b);

    if (aPinned && bPinned) {
      return postDate(b) - postDate(a);
    }

    if (aPinned) return -1;
    if (bPinned) return 1;

    return postDate(b) - postDate(a);
  });

  const paginationDir = config.pagination_dir || 'page';

  return pagination('', posts, {
    perPage: config.index_generator.per_page,
    layout: ['index', 'archive'],
    format: `${paginationDir}/%d/`,
    data: {
      __index: true
    }
  });
});
