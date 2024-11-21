// top.js

// 滚动回到顶部函数
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'  // 平滑滚动
    });
}

// 监听滚动事件，显示/隐藏回到顶部按钮
window.onscroll = function () {
    var backToTopButton = document.getElementById("backToTop");
    if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
        backToTopButton.classList.add("show");  // 滚动超过200px时显示按钮
    } else {
        backToTopButton.classList.remove("show");  // 滚动回顶部时隐藏按钮
    }
};
