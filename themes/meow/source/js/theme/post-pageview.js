(() => {
  const container = document.getElementById('post-pageview-container');
  const valueElement = document.getElementById('post-pageview-value');
  if (!container || !valueElement) return;

  const api = String(container.dataset.api || '').replace(/\/+$/, '');
  const site = String(container.dataset.site || '').trim().toLowerCase();
  const canonicalPath = normalizePath(container.dataset.path);
  const currentPath = normalizePath(window.location.pathname);
  if (!api || !site || canonicalPath !== currentPath) return;

  const requestKey = `${site}\n${canonicalPath}`;
  const requests = window.__POST_PAGEVIEW_REQUESTS__ ||
    (window.__POST_PAGEVIEW_REQUESTS__ = new Map());

  let request = requests.get(requestKey);
  if (!request) {
    const query = new URLSearchParams({ site, path: canonicalPath });
    const trackUrl = `${api}/api/v1/track?${query}`;
    const viewsUrl = `${api}/api/v1/views?${query}`;

    request = fetch(trackUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      keepalive: true
    })
      .catch(() => null)
      .then(() => fetch(viewsUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit'
      }))
      .then(response => {
        if (!response.ok) throw new Error(`Pageview request failed: ${response.status}`);
        return response.json();
      })
      .then(data => {
        const views = Number(data.views);
        if (!Number.isFinite(views) || views < 0) throw new Error('Invalid pageview response');
        return Math.trunc(views);
      });

    requests.set(requestKey, request);
  }

  request
    .then(views => {
      valueElement.textContent = String(views);
    })
    .catch(() => {
      container.style.display = 'none';
    });

  function normalizePath(value) {
    let path = String(value || '').split(/[?#]/, 1)[0];
    try {
      path = decodeURI(path);
    } catch (_error) {
      // Keep the original encoded path when it contains malformed escapes.
    }
    path = `/${path}`.replace(/\/+/g, '/');
    return path.length > 1 ? path.replace(/\/+$/, '') : path;
  }
})();
