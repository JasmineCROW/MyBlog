(() => {
  const dataElement = document.getElementById('post-nav-context');
  if (!dataElement) return;

  const params = new URLSearchParams(window.location.search);
  const kind = params.get('nav');
  const term = params.get('term');
  if ((kind !== 'category' && kind !== 'tag') || term === null) return;

  let contexts;
  try {
    contexts = JSON.parse(dataElement.textContent);
  } catch (_error) {
    return;
  }

  const kindContexts = contexts[kind];
  if (!kindContexts || !Object.prototype.hasOwnProperty.call(kindContexts, term)) return;

  const context = kindContexts[term];
  const updateLink = (selector, path) => {
    const container = document.querySelector(selector);
    if (!container) return;

    const link = container.querySelector('a');
    if (!path) {
      if (link) link.remove();
      return;
    }
    if (!link) return;

    const target = new URL(path, window.location.href);
    target.search = '';
    target.searchParams.set('nav', kind);
    target.searchParams.set('term', term);
    link.href = `${target.pathname}${target.search}${target.hash}`;
  };

  updateLink('.post-prev', context.prev);
  updateLink('.post-next', context.next);
})();

