window.onscroll = function () {
  'use strict';
  if (window.scrollY > 200 || document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
    document.getElementById('back-to-top').style.display = 'block';
  } else {
    document.getElementById('back-to-top').style.display = 'none';
  }
};

function scrollToTop() {
  'use strict';
  window.scrollTo(0, 0);
  document.body.scrollTop = 0; // Safari
  document.documentElement.scrollTop = 0; // Chrome, Firefox, IE, Opera
}

function tocToggle() {
  'use strict';
  var tocContainer = document.getElementById('post-toc');
  if (tocContainer != null) {
    if (!tocContainer.getAttribute('toc-show')) {
      tocContainer.setAttribute('toc-show', true);
      // 
      if (document.getElementById('hbePass')) {
        document.getElementById('toc-body').style.display = 'none';
      } else {
        document.getElementById('toc-body').style.display = 'block';
      }
    } else {
      tocContainer.removeAttribute('toc-show')
    }
  }
}

function gotoComment() {
  'use strict';
  var commentContainer = document.getElementById('comment');
  if (commentContainer) {
    commentContainer.scrollIntoView({ behavior: 'smooth' });
  }
}

function toolToggle() {
  'use strict';
  var moreToolsContainer = document.getElementById('tool-bar-more');
  if (moreToolsContainer.style.display == 'none') {
    moreToolsContainer.style.display = 'block';
  } else {
    moreToolsContainer.style.display = 'none';
  }
}

function darkmodeSwitch(closeTools) {
  'use strict';
  darkMode.toggleMode();
  // change comment theme synchronously 同步修改评论区主题
  if (document.getElementById('comment')) {
    if (darkMode.getMode() == "dark") {
      sendGiscusMessage({
        setConfig: {
          theme: 'noborder_dark',
        }
      });
    } else {
      sendGiscusMessage({
        setConfig: {
          theme: GLOBAL_CONFIG.comment.theme,
        }
      });
    }
  }
  syncThemeToggle();
  if (closeTools) toolToggle();
}

function syncThemeToggle() {
  'use strict';
  var button = document.getElementById('theme-mode-switch');
  if (!button) return;

  var icon = button.querySelector('i');
  var isDark = document.body.classList.contains('dm-dark');
  button.setAttribute('aria-pressed', String(isDark));
  button.title = isDark ? '切换到白天模式' : '切换到黑夜模式';
  if (icon) icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

document.addEventListener('DOMContentLoaded', syncThemeToggle);

function sendGiscusMessage(message) {
  const iframe = document.getElementsByClassName('giscus-frame')[0];
  if (!iframe) return;
  iframe.contentWindow.postMessage({ giscus: message }, 'https://giscus.app');
}

function fontSizeIncrease() {
  'use strict';
  var postContent = document.querySelector('.post-content');
  if (postContent) {
    var sizeNum = 18;
    if (localStorage.getItem('font-size')) {
      sizeNum = parseInt(localStorage.getItem('font-size')) + 2;
    } else {
      var currentSize = window.getComputedStyle(postContent).getPropertyValue('font-size');
      sizeNum = parseInt(currentSize) + 2;
    }
    postContent.style.fontSize = sizeNum + 'px';
    localStorage.setItem('font-size', sizeNum);
  }
}

function fontSizeDecrease() {
  'use strict';
  var postContent = document.querySelector('.post-content');
  if (postContent) {
    var sizeNum = 18;
    if (localStorage.getItem('font-size')) {
      sizeNum = parseInt(localStorage.getItem('font-size')) - 2;
    } else {
      var currentSize = window.getComputedStyle(postContent).getPropertyValue('font-size');
      sizeNum = parseInt(currentSize) - 2;
    }
    postContent.style.fontSize = sizeNum + 'px';
    localStorage.setItem('font-size', sizeNum);
  }
}
