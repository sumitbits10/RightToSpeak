const CONFIG = {
  CHANNEL_ID: 'UCr8WLAYrP78cqvCtmGXOKTA',
  RSS2JSON_KEY: '',
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

function getVideoId(url) {
  const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
  return match ? match[1] : null;
}

function renderVideoCard(video) {
  const videoId = getVideoId(video.link);
  const thumb = videoId
    ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    : 'assets/placeholder.jpg';
  const catId = categorizeVideo(video.title, video.description || '');
  const catLabel = getCategoryLabel(catId);

  return `
    <div class="video-card" data-category="${catId}" data-videoid="${videoId}">
      <div class="video-thumb" onclick="openVideo('${videoId}')">
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

function openVideo(videoId) {
  if (!videoId) return;
  window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
}

function filterAndRender() {
  const grid = document.getElementById('video-grid');
  if (!grid) return;

  const filtered = currentCategory === 'all'
    ? allVideos
    : allVideos.filter(v => categorizeVideo(v.title, v.description || '') === currentCategory);

  const visible = filtered.slice(0, displayCount);

  if (visible.length === 0) {
    grid.innerHTML = '<div class="video-loading"><p>No videos found in this category.</p></div>';
  } else {
    grid.innerHTML = visible.map(renderVideoCard).join('');
  }

  const loadMoreBtn = document.getElementById('load-more');
  if (loadMoreBtn) {
    loadMoreBtn.style.display = filtered.length > displayCount ? 'inline-block' : 'none';
  }
}

async function fetchVideos() {
  const grid = document.getElementById('video-grid');
  if (!grid) return;

  if (!CONFIG.CHANNEL_ID || CONFIG.CHANNEL_ID === 'PASTE_CHANNEL_ID_HERE') {
    grid.innerHTML = `
      <div class="video-loading">
        <p style="color:#C9A227;font-weight:600;">YouTube Channel ID not configured yet.</p>
        <p style="margin-top:8px;font-size:13px;">Edit <code>js/main.js</code> and set your Channel ID.</p>
      </div>`;
    return;
  }

  grid.innerHTML = '<div class="video-loading"><div class="spinner"></div><p>Loading videos...</p></div>';

  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${CONFIG.CHANNEL_ID}`;
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=50`;

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (data.status !== 'ok') throw new Error('Feed error');

    allVideos = data.items || [];
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
