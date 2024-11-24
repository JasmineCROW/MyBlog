document.addEventListener("DOMContentLoaded", function () {
    const button = document.getElementById("sortButton");
    const archivesWrap = document.querySelectorAll(".archives-wrap .archives");

    button.addEventListener("click", function () {
        // 获取当前排序方式
        const currentOrder = button.getAttribute("data-order");

        archivesWrap.forEach(archive => {
            const posts = Array.from(archive.getElementsByClassName("post"));

            // 根据排序方式重新排序
            posts.sort((a, b) => {
                const topA = parseInt(a.getAttribute("data-top"), 10);
                const topB = parseInt(b.getAttribute("data-top"), 10);
                const dateA = new Date(a.getAttribute("data-date"));
                const dateB = new Date(b.getAttribute("data-date"));

                if (currentOrder === "asc") {
                    // 升序排序
                    if (topA === topB) return dateB - dateA; // 按日期降序
                    return topA - topB;
                } else {
                    // 降序排序
                    if (topA === topB) return dateB - dateA; // 按日期降序
                    return topB - topA;
                }
            });

            // 更新 DOM
            posts.forEach(post => archive.appendChild(post));
        });

        // 切换排序方式
        button.setAttribute("data-order", currentOrder === "asc" ? "desc" : "asc");
        button.textContent = currentOrder === "asc" ? "按 Top 值降序" : "按 Top 值升序";
    });
});
