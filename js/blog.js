const BLOG_CONFIG = {
  GITHUB_USER: 'sumitbits10',
  GITHUB_REPO: 'RightToSpeak',
  POSTS_FOLDER: 'posts',
};

const CATEGORIES = [
  'All',
  'Criminal Law',
  'Consumer Rights',
  'Family Law',
  'Property Law',
  'Constitutional Rights',
  'General Legal Tips',
];

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: text };
  const meta = {};
  match[1].split('\n').forEach(line => {
    const [key, ...rest] = line.split(':');
    if (key) meta[key.trim()] = rest.join(':').trim().replace(/^["']|["']$/g, '');
  });
  return { meta, body: match[2] };
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function slugFromFilename(name) {
  return name.replace(/\.md$/, '');
}

async function fetchPostList() {
  const { GITHUB_USER, GITHUB_REPO, POSTS_FOLDER } = BLOG_CONFIG;
  if (GITHUB_USER.startsWith('PASTE_')) return null;
  const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${POSTS_FOLDER}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const files = await res.json();
  return files.filter(f => f.name.endsWith('.md'));
}

async function fetchPostContent(downloadUrl) {
  const res = await fetch(downloadUrl);
  return await res.text();
}

function renderBlogCard(slug, meta) {
  const img = meta.image
    ? `<img src="${meta.image}" alt="${meta.title}" class="blog-card-img" loading="lazy">`
    : `<div class="blog-card-img-placeholder"><span>RTS</span></div>`;

  return `
    <article class="blog-card" onclick="window.location='blog-post.html?post=${encodeURIComponent(slug)}'">
      ${img}
      <div class="blog-card-body">
        <div class="blog-meta">
          <span class="blog-cat">${meta.category || 'Legal'}</span>
          <span class="blog-date">${formatDate(meta.date)}</span>
        </div>
        <h3>${meta.title}</h3>
        <p>${meta.summary || ''}</p>
        <span class="blog-read-more">Read Article →</span>
      </div>
    </article>`;
}

async function initBlogListing() {
  const grid = document.getElementById('blog-grid');
  const filterBar = document.getElementById('filter-bar');
  if (!grid) return;

  const { GITHUB_USER } = BLOG_CONFIG;

  if (GITHUB_USER.startsWith('PASTE_')) {
    grid.innerHTML = `
      <div class="blog-empty">
        <h3>GitHub not configured yet</h3>
        <p>Edit <code>js/blog.js</code> and set your GitHub username and repo name.<br>
        Once deployed on Netlify + GitHub, posts Akant writes in the admin panel will appear here automatically.</p>
      </div>`;
    return;
  }

  try {
    const files = await fetchPostList();
    if (!files || files.length === 0) {
      grid.innerHTML = '<div class="blog-empty"><h3>No posts yet</h3><p>Posts published via the admin panel will appear here.</p></div>';
      return;
    }

    const posts = await Promise.all(
      files.map(async f => {
        const text = await fetchPostContent(f.download_url);
        const { meta } = parseFrontmatter(text);
        return { slug: slugFromFilename(f.name), meta };
      })
    );

    posts.sort((a, b) => new Date(b.meta.date) - new Date(a.meta.date));

    let activeFilter = 'All';

    function render() {
      const filtered = activeFilter === 'All'
        ? posts
        : posts.filter(p => p.meta.category === activeFilter);

      grid.innerHTML = filtered.length
        ? filtered.map(p => renderBlogCard(p.slug, p.meta)).join('')
        : '<div class="blog-empty"><h3>No posts in this category yet.</h3></div>';
    }

    if (filterBar) {
      filterBar.innerHTML = CATEGORIES.map(cat =>
        `<button class="cat-btn${cat === 'All' ? ' active' : ''}" data-cat="${cat}">${cat}</button>`
      ).join('');

      filterBar.addEventListener('click', e => {
        const btn = e.target.closest('.cat-btn');
        if (!btn) return;
        filterBar.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.cat;
        render();
      });
    }

    render();

  } catch (e) {
    grid.innerHTML = `
      <div class="blog-empty">
        <h3>Could not load posts</h3>
        <p>Check your GitHub config in <code>js/blog.js</code>.</p>
      </div>`;
  }
}

async function initBlogPost() {
  const article = document.getElementById('post-article');
  if (!article) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('post');
  if (!slug) { window.location = 'blog.html'; return; }

  const { GITHUB_USER, GITHUB_REPO, POSTS_FOLDER } = BLOG_CONFIG;

  if (GITHUB_USER.startsWith('PASTE_')) {
    article.innerHTML = `<a href="blog.html" class="back-link">← Back to Blog</a>
      <p style="color:var(--text-muted)">GitHub not configured. Edit js/blog.js first.</p>`;
    return;
  }

  try {
    const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${POSTS_FOLDER}/${slug}.md`;
    const res = await fetch(url);
    const file = await res.json();
    const text = atob(file.content.replace(/\n/g, ''));
    const { meta, body } = parseFrontmatter(text);

    document.title = `${meta.title} — Right To Speak`;

    const coverHtml = meta.image
      ? `<img src="${meta.image}" alt="${meta.title}" class="post-cover">`
      : '';

    article.innerHTML = `
      <a href="blog.html" class="back-link">← Back to Blog</a>
      <div class="post-header">
        <span class="post-cat">${meta.category || 'Legal'}</span>
        <h1>${meta.title}</h1>
        <div class="post-byline">
          <div class="byline-avatar">AG</div>
          <div class="byline-text">
            <div class="name">Adv. Akant Goswami</div>
            <div class="meta">Published on ${formatDate(meta.date)} · Dhanbad, Jharkhand</div>
          </div>
        </div>
      </div>
      ${coverHtml}
      <div class="post-body" id="post-body"></div>`;

    renderMarkdown(body, document.getElementById('post-body'));

  } catch (e) {
    article.innerHTML = `<a href="blog.html" class="back-link">← Back to Blog</a>
      <p style="color:var(--text-muted)">Post not found.</p>`;
  }
}

function renderMarkdown(md, el) {
  let html = md
    .replace(/^#{3}\s(.+)$/gm, '<h3>$1</h3>')
    .replace(/^#{2}\s(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#{1}\s(.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:var(--off-white);padding:2px 6px;border-radius:4px;font-size:0.9em">$1</code>')
    .replace(/^>\s(.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/^[-*]\s(.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\.\s(.+)$/gm, '<oli>$1</oli>');

  html = html
    .replace(/(<li>[\s\S]*?<\/li>)+/g, m => `<ul>${m}</ul>`)
    .replace(/(<oli>[\s\S]*?<\/oli>)+/g, m => `<ol>${m.replace(/<\/?oli>/g, match => match.replace('oli', 'li'))}</ol>`);

  html = html.split(/\n{2,}/).map(block => {
    block = block.trim();
    if (!block) return '';
    if (/^<(h[1-6]|ul|ol|blockquote)/.test(block)) return block;
    return `<p>${block.replace(/\n/g, ' ')}</p>`;
  }).join('');

  el.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('blog-grid')) initBlogListing();
  if (document.getElementById('post-article')) initBlogPost();
});
