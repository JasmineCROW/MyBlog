const pagination = require('hexo-pagination');

hexo.extend.generator.register('categories', function (locals) {
  const perPage = hexo.config.per_page || 3; // 每页显示的分类数
  const categories = locals.categories.sort('name'); // 按名称排序

  return pagination('categories/page/index.html', categories, {
    perPage: perPage,
    layout: ['categories'],
    data: {
      type: 'categories'
    }
  });
});
