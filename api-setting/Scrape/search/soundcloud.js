const axios = require('axios');

// Cache untuk client_id SoundCloud
const cache = { version: '', id: '' };

// Helper functions
function formatDuration(ms) {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const sisa = sec % 60;
  return `${min}:${sisa.toString().padStart(2, '0')}`;
}

function formatNumber(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toString();
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
}

async function getClientID() {
  try {
    // Jika client_id sudah ada di cache
    if (cache.id && cache.version) return cache.id;

    const { data: html } = await axios.get('https://soundcloud.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Exonity/1.0'
      }
    });

    // Ekstrak versi SoundCloud
    const version = html.match(/<script>window\.__sc_version="(\d{10})"<\/script>/)?.[1];
    if (!version) throw new Error('Failed to get SoundCloud version');

    // Jika versi sama dengan cache, gunakan client_id yang ada
    if (cache.version === version) return cache.id;

    // Cari client_id di berbagai script
    const scriptMatches = [...html.matchAll(/<script.*?src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+)"/g)];
    for (const [, scriptUrl] of scriptMatches) {
      try {
        const { data: js } = await axios.get(scriptUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Exonity/1.0'
          }
        });
        const idMatch = js.match(/client_id:"([a-zA-Z0-9]{32})"/);
        if (idMatch) {
          cache.version = version;
          cache.id = idMatch[1];
          return idMatch[1];
        }
      } catch (e) {
        console.error(`Error checking script ${scriptUrl}:`, e.message);
      }
    }
    throw new Error('Client ID not found in any scripts');
  } catch (err) {
    console.error('Failed to get client_id:', err.message);
    throw err;
  }
}

async function searchTracks(query, client_id, limit = 30) {
  try {
    const response = await axios.get('https://api-v2.soundcloud.com/search/tracks', {
      params: { q: query, client_id, limit },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Exonity/1.0'
      },
      timeout: 10000
    });

    return response.data.collection.map(track => ({
      id: track.id,
      title: track.title,
      url: track.permalink_url,
      duration: formatDuration(track.full_duration),
      thumbnail: track.artwork_url || 'https://soundcloud.com/images/default_artwork.png',
      author: {
        name: track.user.username,
        url: track.user.permalink_url
      },
      stats: {
        likes: formatNumber(track.likes_count || 0),
        downloads: formatNumber(track.download_count || 0),
        plays: formatNumber(track.playback_count || 0)
      },
      release_date: formatDate(track.release_date || track.created_at)
    }));
  } catch (err) {
    console.error('Search tracks error:', err.message);
    throw new Error('Failed to search tracks');
  }
}

async function getTrackInfo(url, client_id) {
  try {
    const response = await axios.get('https://api-v2.soundcloud.com/resolve', {
      params: { url, client_id },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Exonity/1.0'
      },
      timeout: 10000
    });

    const track = response.data;
    return {
      id: track.id,
      title: track.title,
      url: track.permalink_url,
      duration: formatDuration(track.full_duration),
      thumbnail: track.artwork_url || 'https://soundcloud.com/images/default_artwork.png',
      author: {
        name: track.user.username,
        url: track.user.permalink_url
      },
      stats: {
        likes: formatNumber(track.likes_count || 0),
        downloads: formatNumber(track.download_count || 0),
        plays: formatNumber(track.playback_count || 0)
      },
      release_date: formatDate(track.release_date || track.created_at),
      description: track.description || '',
      genre: track.genre || '',
      downloadable: track.downloadable || false
    };
  } catch (err) {
    console.error('Get track info error:', err.message);
    throw new Error('Failed to get track info');
  }
}

// Fungsi handler utama
async function soundcloudHandler(params, method = 'search') {
  try {
    const client_id = await getClientID();
    if (!client_id) throw new Error('Failed to get SoundCloud client_id');

    switch(method.toLowerCase()) {
      case 'search':
        if (!params.query) throw new Error('Query parameter is required');
        return await searchTracks(params.query, client_id, params.limit || 30);
      
      case 'track':
        if (!params.url) throw new Error('Track URL is required');
        return await getTrackInfo(params.url, client_id);
        
      default:
        throw new Error(`Invalid method: ${method}. Supported methods: 'search', 'track'`);
    }
  } catch (error) {
    console.error(`SoundCloud handler error (${method}):`, error.message);
    throw error;
  }
}

module.exports = soundcloudHandler;
