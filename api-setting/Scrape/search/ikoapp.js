const axios = require('axios');
const cheerio = require('cheerio');

async function ikoAppScraper(query, options = {}) {
  try {
    // Default options
    const { 
      getDetails = false,  // Jika true, ambil detail anime pertama
      showEpisodes = false // Jika true, tampilkan episode di detail
    } = options;

    // 1. Lakukan pencarian
    const { data } = await axios.get(`https://ikoapp.com/?s=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    const $ = cheerio.load(data);
    const results = [];

    // 2. Ekstrak hasil pencarian
    $('.bsx').each((i, el) => {
      const title = $(el).find('a').attr('title');
      const url = $(el).find('a').attr('href');
      const thumbnail = $(el).find('img').attr('src');
      const episode = $(el).find('.epx').text().trim();

      if (title && url) {
        results.push({
          title,
          url,
          thumbnail,
          episode,
          type: 'anime'
        });
      }
    });

    // 3. Handle jika tidak ada hasil
    if (results.length === 0) {
      return {
        status: true,
        creator: "Natsu - Api",
        result: {
          status: false,
          message: `Tidak ditemukan anime dengan judul "${query}"`,
          suggestions: [
            "Cek penulisan judul",
            "Gunakan kata kunci lebih spesifik",
            "Anime mungkin belum tersedia di IkoApp"
          ]
        }
      };
    }

    // 4. Jika diminta detail anime pertama
    if (getDetails && results.length > 0) {
      const detail = await getAnimeDetails(results[0].url, showEpisodes);
      return {
        status: true,
        creator: "Natsu - Api",
        result: detail
      };
    }

    // 5. Return hasil pencarian normal
    return {
      status: true,
      creator: "Natsu - Api",
      result: {
        status: true,
        total: results.length,
        query,
        results
      }
    };

  } catch (error) {
    console.error('Scraper error:', error);
    return {
      status: false,
      creator: "Natsu - Api",
      error: error.message,
      tips: "Coba lagi beberapa saat atau gunakan VPN"
    };
  }
}

// Fungsi bantuan untuk detail anime
async function getAnimeDetails(url, showEpisodes = false) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const info = {};
    $('.infozingle p').each((i, el) => {
      const text = $(el).text().trim();
      const [key, ...value] = text.split(':');
      if (key && value) {
        info[key.trim().toLowerCase()] = value.join(':').trim();
      }
    });

    const result = {
      title: $('.entry-title').text().trim(),
      thumbnail: $('.thumb img').attr('src'),
      info,
      url
    };

    if (showEpisodes) {
      result.episodes = [];
      $('.eplister li').each((i, el) => {
        result.episodes.push({
          title: $(el).find('.epl-title').text().trim(),
          url: $(el).find('a').attr('href'),
          date: $(el).find('.epl-date').text().trim()
        });
      });
      result.totalEpisodes = result.episodes.length;
    }

    return result;

  } catch (error) {
    console.error('Detail error:', error);
    return {
      status: false,
      error: "Gagal mengambil detail anime"
    };
  }
}

module.exports = ikoAppScraper;
