const axios = require('axios');

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
    const { data: html } = await axios.get('https://soundcloud.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Exonity/1.0'
      }
    });

    const version = html.match(/<script>window\.__sc_version="(\d{10})"<\/script>/)?.[1];
    if (!version) throw new Error('Failed to get SoundCloud version');

    if (cache.version === version) return cache.id;

    const scriptMatches = [...html.matchAll(/<script.*?src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+)"/g)];
    for (const [, scriptUrl] of scriptMatches) {
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
    }
    throw new Error('Client ID not found in scripts');
  } catch (err) {
    console.error('Failed to get client_id:', err.message);
    throw err;
  }
}

const SoundCloudAPI = {
  search: async (query, limit = 30) => {
    try {
      if (!query) throw new Error('Search query is required');
      
      const client_id = await getClientID();
      const url = 'https://api-v2.soundcloud.com/search/tracks';
      
      const response = await axios.get(url, {
        params: { q: query, client_id, limit },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Exonity/1.0'
        }
      });

      return response.data.collection.map(track => ({
        id: track.id,
        title: track.title,
        url: track.permalink_url,
        duration: formatDuration(track.full_duration),
        thumbnail: track.artwork_url,
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
      console.error('Search error:', err.message);
      throw err;
    }
  },

  getTrackInfo: async (trackUrl) => {
    try {
      if (!trackUrl) throw new Error('Track URL is required');
      
      const client_id = await getClientID();
      const resolveUrl = 'https://api-v2.soundcloud.com/resolve';
      
      const response = await axios.get(resolveUrl, {
        params: { url: trackUrl, client_id },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Exonity/1.0'
        }
      });

      const track = response.data;
      return {
        id: track.id,
        title: track.title,
        url: track.permalink_url,
        duration: formatDuration(track.full_duration),
        thumbnail: track.artwork_url,
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
        description: track.description,
        genre: track.genre
      };
    } catch (err) {
      console.error('Track info error:', err.message);
      throw err;
    }
  }
};

module.exports = SoundCloudAPI;
