// pagination.js - 支持从外部 .md 文件加载并分页，使用淡入淡出切换，瞬间滚动到顶部，支持 KaTeX 数学公式
document.addEventListener('DOMContentLoaded', async () => {
    const paginationDiv = document.getElementById('pagination');
    const mainContent = document.querySelector('.main-content');
    const articleBody = document.getElementById('articleBody');

    if (!articleBody || !paginationDiv || !mainContent) {
        console.error('缺少必要的 DOM 元素');
        return;
    }

    // ---------- 注册 marked 扩展支持数学公式 ----------
    function escapeHtml(str) {
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    const mathExtension = {
        name: 'math',
        level: 'inline',
        start(src) { return src.match(/\$/)?.index; },
        tokenizer(src, tokens) {
            // 块级数学 $$...$$
            const blockMatch = src.match(/^\$\$([\s\S]+?)\$\$/);
            if (blockMatch) {
                return {
                    type: 'math',
                    raw: blockMatch[0],
                    text: blockMatch[1],
                    display: true
                };
            }
            // 行内数学 $...$
            const inlineMatch = src.match(/^\$([^$\n]+?)\$/);
            if (inlineMatch) {
                return {
                    type: 'math',
                    raw: inlineMatch[0],
                    text: inlineMatch[1],
                    display: false
                };
            }
            return undefined;
        },
        renderer(token) {
            if (token.display) {
                return `<div class="math-block">${escapeHtml(token.text)}</div>`;
            } else {
                return `<span class="math-inline">${escapeHtml(token.text)}</span>`;
            }
        }
    };

    // 使用扩展（确保 marked 版本支持）
    if (marked && marked.use) {
        marked.use({ extensions: [mathExtension] });
    } else {
        console.warn('marked 版本过低，无法使用扩展，数学公式将不会被渲染');
    }

    // ---------- KaTeX 渲染函数 ----------
    function renderMath() {
        if (typeof katex === 'undefined') {
            console.warn('KaTeX 未加载，数学公式将显示为源码');
            return;
        }
        // 渲染所有行内数学元素
        document.querySelectorAll('.math-inline').forEach(el => {
            const tex = el.textContent;
            try {
                katex.render(tex, el, { displayMode: false, throwOnError: false });
            } catch (e) {
                console.warn('KaTeX 渲染行内公式失败:', e);
                el.textContent = tex; // 回退显示源码
            }
        });
        // 渲染所有块级数学元素
        document.querySelectorAll('.math-block').forEach(el => {
            const tex = el.textContent;
            try {
                katex.render(tex, el, { displayMode: true, throwOnError: false });
            } catch (e) {
                console.warn('KaTeX 渲染块级公式失败:', e);
                el.textContent = tex;
            }
        });
    }

    // ---------- 获取 .md 文件路径 ----------
    const urlParams = new URLSearchParams(window.location.search);
    let mdFilePath = urlParams.get('md');
    if (!mdFilePath) {
        const pageName = window.location.pathname.split('/').pop().replace('.html', '');
        mdFilePath = `${pageName}.md`;
    }

    let markdownContent = null;
    try {
        const response = await fetch(mdFilePath);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        markdownContent = await response.text();

        // 更新最后修改时间
        const lastModified = response.headers.get('Last-Modified');
        if (lastModified) {
            const date = new Date(lastModified);
            const formattedDate = `${date.getFullYear()}.${date.getMonth()+1}.${date.getDate()}`;
            const timeSpan = document.getElementById('article-update-time');
            if (timeSpan) timeSpan.innerHTML = `<i class="far fa-clock"></i> ${formattedDate}`;
        }
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

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }

    function updatePageDisplay() {
        if (!articleBody || !pages[currentPage - 1]) return;
        if (isAnimating) return;

        isAnimating = true;

        // 先瞬间滚动到顶部
        scrollToTop();

        // 淡出当前内容
        articleBody.classList.add('fade-out');

        setTimeout(() => {
            // 更新内容
            articleBody.innerHTML = pages[currentPage - 1];
            // 渲染数学公式
            renderMath();
            // 淡入
            articleBody.classList.remove('fade-out');

            setTimeout(() => {
                isAnimating = false;
            }, 200);
        }, 200);
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
            btn.addEventListener('click', () => {
                if (isAnimating) return;
                clickHandler();
            });
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
                if (isAnimating) return;
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