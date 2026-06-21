const pagination = require('hexo-pagination');

function pinnedOrder(post) {
  const top = Number(post.top);
  return Number.isFinite(top) && top > 0 ? top : 0;
}

function postDate(post) {
  return new Date(post.date).getTime();
}

hexo.extend.generator.register('index', function (locals) {
  const config = this.config;
  const posts = locals.posts;

  posts.data = posts.data.slice().sort((a, b) => {
    const aTop = pinnedOrder(a);
    const bTop = pinnedOrder(b);

    if (aTop && bTop) {
      return bTop - aTop || postDate(b) - postDate(a);
    }

    if (aTop) return -1;
    if (bTop) return 1;

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
