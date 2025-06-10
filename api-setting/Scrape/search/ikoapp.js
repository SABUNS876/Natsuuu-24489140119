const axios = require('axios');
const cheerio = require('cheerio');

async function ikoAppScraper(query, options = {}) {
  try {
    // 1. Setup request dengan headers lengkap
    const { data } = await axios.get(`https://ikoapp.com/?s=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://ikoapp.com/',
        'DNT': '1',
        'Connection': 'keep-alive'
      },
      timeout: 10000
    });

    // 2. Parse HTML dengan selector terbaru
    const $ = cheerio.load(data);
    const results = [];

    // 3. Cari di berbagai bagian halaman
    $('.animposx, .bsx, .listupd .bs').each((i, el) => {
      const title = $(el).find('a').attr('title') || $(el).find('.tt').text().trim();
      const url = $(el).find('a').attr('href');
      const thumbnail = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
      const episode = $(el).find('.epx, .episode').text().trim();

      if (title && url) {
        results.push({
          title: title.replace(/nonton|sub indo|streaming/gi, '').trim(),
          url,
          thumbnail: thumbnail?.startsWith('http') ? thumbnail : `https://ikoapp.com${thumbnail}`,
          episode: episode || 'Unknown',
          type: 'anime'
        });
      }
    });

    // 4. Jika tidak ada hasil, coba metode alternatif
    if (results.length === 0) {
      const altResults = await alternativeSearch(query);
      if (altResults.length > 0) {
        return formatResponse(query, altResults);
      }
      return noResultsResponse(query);
    }

    return formatResponse(query, results);

  } catch (error) {
    console.error('Scraper error:', error);
    return {
      status: false,
      creator: "Natsu - Api",
      error: "Gagal mengakses IkoApp",
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined,
      tips: [
        "Coba gunakan VPN",
        "Ubah kata kunci pencarian",
        "Website mungkin sedang down"
      ]
    };
  }
}

// Fungsi bantuan
async function alternativeSearch(query) {
  try {
    const { data } = await axios.get(`https://ikoapp.com/anime/?search=${encodeURIComponent(query)}`);
    const $ = cheerio.load(data);
    const results = [];

    $('.listupd .bs').each((i, el) => {
      results.push({
        title: $(el).find('.tt').text().trim(),
        url: $(el).find('a').attr('href'),
        thumbnail: $(el).find('img').attr('src'),
        episode: $(el).find('.episode').text().trim(),
        type: 'anime'
      });
    });

    return results;
  } catch {
    return [];
  }
}

function formatResponse(query, results) {
  return {
    status: true,
    creator: "Natsu - Api",
    result: {
      status: true,
      total: results.length,
      query,
      results,
      lastUpdated: new Date().toISOString()
    }
  };
}

function noResultsResponse(query) {
  return {
    status: true,
    creator: "Natsu - Api",
    result: {
      status: false,
      message: `Tidak ditemukan hasil untuk "${query}"`,
      suggestions: [
        "Gunakan judul yang lebih umum (contoh: 'One Piece' bukan 'One Piece episode 1027')",
        "Coba ejaan alternatif ('Kimetsu no Yaiba' vs 'Demon Slayer')",
        "Kunjungi langsung ikoapp.com untuk memverifikasi"
      ],
      popularAnime: [
        "One Piece",
        "Jujutsu Kaisen",
        "Demon Slayer",
        "Attack on Titan",
        "Solo Leveling"
      ]
    }
  };
}

module.exports = ikoAppScraper;
