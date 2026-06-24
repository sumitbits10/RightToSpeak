const CONFIG = {
  CHANNEL_ID: 'UCr8WLAYrP78cqvCtmGXOKTA',
  CATEGORIES: [
    { id: 'all', label: 'All Videos' },
    { id: 'criminal', label: 'Criminal Law', keywords: ['criminal', 'ipc', 'fir', 'arrest', 'bail', 'murder', 'theft'] },
    { id: 'consumer', label: 'Consumer Rights', keywords: ['consumer', 'complaint', 'refund', 'fraud', 'cheating'] },
    { id: 'family', label: 'Family Law', keywords: ['divorce', 'marriage', 'custody', 'maintenance', 'family'] },
    { id: 'property', label: 'Property Law', keywords: ['property', 'land', 'rent', 'eviction', 'registry', 'plot'] },
    { id: 'constitutional', label: 'Constitutional Rights', keywords: ['constitution', 'rights', 'fundamental', 'article', 'freedom'] },
    { id: 'live', label: 'Live Sessions', keywords: ['live', 'session', 'q&a', 'question', 'answer'] },
  ]
};

let allVideos = [];
let currentCategory = 'all';
let displayCount = 6;

function categorizeVideo(title, desc) {
  const text = (title + ' ' + desc).toLowerCase();
  for (const cat of CONFIG.CATEGORIES) {
    if (cat.id === 'all') continue;
    if (cat.keywords && cat.keywords.some(k => text.includes(k))) return cat.id;
  }
  return 'general';
}

function getCategoryLabel(id) {
  const cat = CONFIG.CATEGORIES.find(c => c.id === id);
  return cat ? cat.label : 'Legal';
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderVideoCard(video) {
  const videoId = video.videoId;
  const thumb = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  const catId = categorizeVideo(video.title, video.description || '');
  const catLabel = getCategoryLabel(catId);

  return `
    <div class="video-card" data-category="${catId}">
      <div class="video-thumb" id="thumb-${videoId}" onclick="embedVideo('${videoId}', this)">
        <img src="${thumb}" alt="${video.title}" loading="lazy">
        <div class="play-btn">
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <span class="video-cat-badge">${catLabel}</span>
      </div>
      <div class="video-info">
        <div class="video-title">${video.title}</div>
        <div class="video-date">${formatDate(video.pubDate)}</div>
      </div>
    </div>`;
}

function embedVideo(videoId, thumbEl) {
  const wrapper = thumbEl.closest('.video-thumb');
  wrapper.innerHTML = `<iframe
    src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
    style="position:absolute;top:0;left:0;width:100%;height:100%;border-radius:0;">
  </iframe>`;
  wrapper.style.cursor = 'default';
}

function filterAndRender() {
  const grid = document.getElementById('video-grid');
  if (!grid) return;

  const filtered = currentCategory === 'all'
    ? allVideos
    : allVideos.filter(v => categorizeVideo(v.title, v.description || '') === currentCategory);

  const visible = filtered.slice(0, displayCount);

  grid.innerHTML = visible.length
    ? visible.map(renderVideoCard).join('')
    : '<div class="video-loading"><p>No videos found in this category.</p></div>';

  const loadMoreBtn = document.getElementById('load-more');
  if (loadMoreBtn) {
    loadMoreBtn.style.display = filtered.length > displayCount ? 'inline-block' : 'none';
  }
}

async function fetchVideos() {
  const grid = document.getElementById('video-grid');
  if (!grid) return;

  grid.innerHTML = '<div class="video-loading"><div class="spinner"></div><p>Loading videos...</p></div>';

  try {
    const res = await fetch('/.netlify/functions/videos');
    if (!res.ok) throw new Error('Function error');
    const entries = await res.json();

    allVideos = entries.map(v => ({
      videoId: v.videoId,
      title: v.title,
      pubDate: v.published,
      description: v.description,
    }));

    if (allVideos.length === 0) throw new Error('No videos');
    filterAndRender();

  } catch (e) {
    grid.innerHTML = `
      <div class="video-loading">
        <p>Could not load videos. <a href="https://youtube.com/@righttospeak-m8m" target="_blank" style="color:var(--navy);font-weight:600;">Watch on YouTube →</a></p>
      </div>`;
  }
}

function initCategoryTabs() {
  const container = document.getElementById('category-tabs');
  if (!container) return;

  container.innerHTML = CONFIG.CATEGORIES.map(cat =>
    `<button class="cat-btn${cat.id === 'all' ? ' active' : ''}" data-cat="${cat.id}">${cat.label}</button>`
  ).join('');

  container.addEventListener('click', e => {
    const btn = e.target.closest('.cat-btn');
    if (!btn) return;
    container.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.dataset.cat;
    displayCount = 6;
    filterAndRender();
  });
}

function initLoadMore() {
  const btn = document.getElementById('load-more');
  if (!btn) return;
  btn.addEventListener('click', () => {
    displayCount += 6;
    filterAndRender();
  });
}

function initHamburger() {
  const ham = document.querySelector('.hamburger');
  const links = document.querySelector('.nav-links');
  if (!ham || !links) return;
  ham.addEventListener('click', () => links.classList.toggle('open'));
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.btn-submit');
    btn.textContent = 'Message Sent!';
    btn.style.background = '#2a9d5c';
    setTimeout(() => {
      btn.textContent = 'Send Message';
      btn.style.background = '';
      form.reset();
    }, 3000);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initHamburger();
  initCategoryTabs();
  initLoadMore();
  fetchVideos();
  initContactForm();
});
