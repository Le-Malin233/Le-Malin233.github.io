// pagination.js - 支持从外部 .md 文件加载并分页
document.addEventListener('DOMContentLoaded', async () => {
    const paginationDiv = document.getElementById('pagination');
    const mainContent = document.querySelector('.main-content');
    const articleBody = document.getElementById('articleBody');

    if (!articleBody || !paginationDiv || !mainContent) {
        console.error('缺少必要的 DOM 元素');
        return;
    }

    // 获取要加载的 .md 文件路径（优先从 URL 参数 md= 获取）
    const urlParams = new URLSearchParams(window.location.search);
    let mdFilePath = urlParams.get('md');
    if (!mdFilePath) {
        // 如果没有提供，使用默认路径（可根据页面名称自动推断，或使用固定默认值）
        // 例如：根据当前页面文件名推断 data-structure.html -> data-structure.md
        const pageName = window.location.pathname.split('/').pop().replace('.html', '');
        mdFilePath = `${pageName}.md`;
        console.log(`未指定 md 参数，使用默认路径: ${mdFilePath}`);
    }

    let markdownContent = null;

    try {
        const response = await fetch(mdFilePath);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        markdownContent = await response.text();
    } catch (error) {
        console.error('加载 Markdown 文件失败:', error);
        articleBody.innerHTML = `<p style="color: red;">无法加载内容：${error.message}</p>`;
        return;
    }

    // 解析分页
    const rawPages = markdownContent.split(/<!--\s*pagebreak\s*-->/);
    let pages = rawPages.map(pageMd => marked.parse(pageMd.trim()));
    const totalPages = pages.length;
    if (totalPages === 0) pages = ['<p>暂无内容</p>'];

    let currentPage = 1;
    let isAnimating = false;

    function getPageHeight(pageIndex) {
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.visibility = 'hidden';
        tempDiv.style.top = '-9999px';
        tempDiv.innerHTML = pages[pageIndex - 1];
        document.body.appendChild(tempDiv);
        const height = tempDiv.offsetHeight;
        document.body.removeChild(tempDiv);
        return height;
    }

    function animateHeightTo(targetHeight) {
        if (isAnimating) return;
        const currentHeight = mainContent.offsetHeight;
        if (currentHeight === targetHeight) return;
        isAnimating = true;
        mainContent.style.height = currentHeight + 'px';
        void mainContent.offsetHeight;
        mainContent.style.height = targetHeight + 'px';
        const onTransitionEnd = () => {
            mainContent.style.height = '';
            mainContent.removeEventListener('transitionend', onTransitionEnd);
            isAnimating = false;
        };
        mainContent.addEventListener('transitionend', onTransitionEnd, { once: true });
    }

    function updatePageDisplay() {
        if (!articleBody) return;
        if (pages[currentPage - 1]) {
            const nextHeight = getPageHeight(currentPage);
            animateHeightTo(nextHeight);
            setTimeout(() => {
                articleBody.innerHTML = pages[currentPage - 1];
            }, 0);
        }
    }

    function renderPaginationControls() {
        paginationDiv.innerHTML = '';
        if (totalPages <= 1) {
            paginationDiv.style.display = 'none';
            return;
        }
        paginationDiv.style.display = 'flex';

        const createNavBtn = (type, html, enabled, clickHandler) => {
            const btn = document.createElement('button');
            btn.className = 'nav-btn';
            btn.innerHTML = html;
            if (!enabled) btn.classList.add('disabled');
            btn.addEventListener('click', clickHandler);
            return btn;
        };

        const firstBtn = createNavBtn('first', '<i class="fas fa-angle-double-left"></i>', currentPage !== 1, () => {
            if (currentPage !== 1) {
                currentPage = 1;
                updatePageDisplay();
                renderPaginationControls();
            }
        });
        paginationDiv.appendChild(firstBtn);

        const prevBtn = createNavBtn('prev', '<i class="fas fa-chevron-left"></i>', currentPage > 1, () => {
            if (currentPage > 1) {
                currentPage--;
                updatePageDisplay();
                renderPaginationControls();
            }
        });
        paginationDiv.appendChild(prevBtn);

        let start = Math.max(1, currentPage - 1);
        let end = Math.min(totalPages, start + 3);
        if (end - start < 3) start = Math.max(1, end - 3);
        for (let i = start; i <= end; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = 'page-btn';
            if (i === currentPage) pageBtn.classList.add('active');
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                if (i !== currentPage) {
                    currentPage = i;
                    updatePageDisplay();
                    renderPaginationControls();
                }
            });
            paginationDiv.appendChild(pageBtn);
        }

        const nextBtn = createNavBtn('next', '<i class="fas fa-chevron-right"></i>', currentPage < totalPages, () => {
            if (currentPage < totalPages) {
                currentPage++;
                updatePageDisplay();
                renderPaginationControls();
            }
        });
        paginationDiv.appendChild(nextBtn);

        const lastBtn = createNavBtn('last', '<i class="fas fa-angle-double-right"></i>', currentPage !== totalPages, () => {
            if (currentPage !== totalPages) {
                currentPage = totalPages;
                updatePageDisplay();
                renderPaginationControls();
            }
        });
        paginationDiv.appendChild(lastBtn);
    }

    // 初始渲染
    updatePageDisplay();
    renderPaginationControls();
});