import React, { useState, useEffect } from 'react';

const UNSPLASH_KEY = 'SBdD4w_PEFtSTrlu2hDOJpbuW4PjJDIN9ezeR5HwbPs';
const CACHE_KEY = 'unsplash_image_cache_v1';

function getCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
}
function setCache(key, url) {
  try {
    const c = getCache();
    c[key] = url;
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {}
}

export default function UnsplashImage({ query, fallbackEmoji, fallbackColor = '#e8e8e8', height = 160 }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!query) return;
    const cacheKey = `img_${query}`;
    const cache = getCache();
    if (cache[cacheKey]) { setUrl(cache[cacheKey]); return; }

    fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&client_id=${UNSPLASH_KEY}`)
      .then(r => r.json())
      .then(data => {
        const imgUrl = data?.results?.[0]?.urls?.regular;
        if (imgUrl) { setCache(cacheKey, imgUrl); setUrl(imgUrl); }
        else setFailed(true);
      })
      .catch(() => setFailed(true));
  }, [query]);

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={query}
        style={{ width: '100%', height, objectFit: 'cover', display: 'block' }}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div style={{ width: '100%', height, background: fallbackColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
      {fallbackEmoji}
    </div>
  );
}