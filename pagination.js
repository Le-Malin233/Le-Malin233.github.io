// pagination.js
document.addEventListener('DOMContentLoaded', () => {
    const pageContainer = document.getElementById('page-container');
    const paginationDiv = document.getElementById('pagination');
    const mainContent = document.querySelector('.main-content');  // 获取主内容容器

    if (!pageContainer || !paginationDiv || !mainContent) {
        console.error('缺少必要元素');
        return;
    }

    const pages = Array.from(pageContainer.querySelectorAll('.page'));
    const totalPages = pages.length;

    if (totalPages <= 1) {
        paginationDiv.style.display = 'none';
        return;
    }

    let currentPage = 1;
    let isAnimating = false; // 防止动画冲突

    // 获取指定页面的高度
    function getPageHeight(pageElement) {
        // 临时显示页面以获取真实高度（但不影响当前显示）
        const wasActive = pageElement.classList.contains('active');
        if (!wasActive) {
            pageElement.style.display = 'block';
            pageElement.style.visibility = 'hidden';
            pageElement.style.position = 'absolute';
            pageElement.style.top = '-9999px';
        }
        const height = pageElement.offsetHeight;
        if (!wasActive) {
            pageElement.style.display = '';
            pageElement.style.visibility = '';
            pageElement.style.position = '';
            pageElement.style.top = '';
        }
        return height;
    }

    // 平滑过渡主容器高度到目标高度
    function animateHeightTo(targetHeight) {
        if (isAnimating) return;
        const currentHeight = mainContent.offsetHeight;
        if (currentHeight === targetHeight) return;

        isAnimating = true;
        mainContent.style.height = currentHeight + 'px';
        // 强制重绘
        void mainContent.offsetHeight;
        mainContent.style.height = targetHeight + 'px';

        // 动画结束后恢复 auto
        const onTransitionEnd = () => {
            mainContent.style.height = '';
            mainContent.removeEventListener('transitionend', onTransitionEnd);
            isAnimating = false;
        };
        mainContent.addEventListener('transitionend', onTransitionEnd, { once: true });
    }

    // 更新页面显示（带动画）
    function updatePageDisplay() {
        // 先获取即将显示的页面的高度
        const nextPage = pages[currentPage - 1];
        const nextHeight = getPageHeight(nextPage);

        // 执行高度过渡
        animateHeightTo(nextHeight);

        // 更新页面显示（稍后执行，确保高度过渡开始）
        setTimeout(() => {
            pages.forEach((page, idx) => {
                const isActive = (idx + 1 === currentPage);
                page.classList.toggle('active', isActive);
            });
        }, 0);
    }

    // 生成页码范围（最多4个）
    function getPageRange(current, total) {
        let start = Math.max(1, current - 1);
        let end = Math.min(total, start + 3);
        if (end - start < 3) {
            start = Math.max(1, end - 3);
        }
        return { start, end };
    }

    // 渲染分页按钮
    function renderPagination() {
        paginationDiv.innerHTML = '';

        // 首页按钮
        const firstBtn = document.createElement('button');
        firstBtn.className = 'first-btn';
        firstBtn.innerHTML = '<i class="fas fa-angle-double-left"></i>';
        if (currentPage === 1) firstBtn.classList.add('disabled');
        firstBtn.addEventListener('click', () => {
            if (currentPage !== 1) {
                currentPage = 1;
                updatePageDisplay();
                renderPagination();
            }
        });
        paginationDiv.appendChild(firstBtn);

        // 上一页按钮
        const prevBtn = document.createElement('button');
        prevBtn.className = 'nav-btn';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        if (currentPage === 1) prevBtn.classList.add('disabled');
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                updatePageDisplay();
                renderPagination();
            }
        });
        paginationDiv.appendChild(prevBtn);

        // 页码按钮（最多4个）
        const { start, end } = getPageRange(currentPage, totalPages);
        for (let i = start; i <= end; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = 'page-btn';
            if (i === currentPage) pageBtn.classList.add('active');
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                if (i !== currentPage) {
                    currentPage = i;
                    updatePageDisplay();
                    renderPagination();
                }
            });
            paginationDiv.appendChild(pageBtn);
        }

        // 下一页按钮
        const nextBtn = document.createElement('button');
        nextBtn.className = 'nav-btn';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        if (currentPage === totalPages) nextBtn.classList.add('disabled');
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                updatePageDisplay();
                renderPagination();
            }
        });
        paginationDiv.appendChild(nextBtn);

        // 尾页按钮
        const lastBtn = document.createElement('button');
        lastBtn.className = 'last-btn';
        lastBtn.innerHTML = '<i class="fas fa-angle-double-right"></i>';
        if (currentPage === totalPages) lastBtn.classList.add('disabled');
        lastBtn.addEventListener('click', () => {
            if (currentPage !== totalPages) {
                currentPage = totalPages;
                updatePageDisplay();
                renderPagination();
            }
        });
        paginationDiv.appendChild(lastBtn);
    }

    // 初始化：先获取初始页面的高度，并确保主容器高度正确
    function initHeight() {
        const initialPage = pages[0];
        const initialHeight = getPageHeight(initialPage);
        mainContent.style.height = initialHeight + 'px';
        // 短暂延迟后移除内联高度，让后续过渡正常工作
        setTimeout(() => {
            mainContent.style.height = '';
        }, 50);
    }

    // 执行初始化
    updatePageDisplay();
    renderPagination();
    initHeight();
});