const axios = require('axios');
const cheerio = require('cheerio');

async function searchAnime(query) {
  try {
    // 1. Lakukan pencarian
    const { data } = await axios.get(`https://ikoapp.com/?s=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // 2. Parse HTML
    const $ = cheerio.load(data);
    const results = [];

    // 3. Ekstrak data anime
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

    // 4. Ambil detail jika hanya ada 1 hasil
    if (results.length === 1) {
      return await getAnimeDetails(results[0].url);
    }

    return {
      status: true,
      total: results.length,
      query,
      results
    };

  } catch (error) {
    console.error('Error:', error.message);
    return {
      status: false,
      error: error.message
    };
  }
}

async function getAnimeDetails(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const title = $('.entry-title').text().trim();
    const thumbnail = $('.thumb img').attr('src');
    const info = {};
    
    $('.infozingle p').each((i, el) => {
      const text = $(el).text().trim();
      const [key, ...value] = text.split(':');
      if (key && value) {
        info[key.trim().toLowerCase()] = value.join(':').trim();
      }
    });

    const episodes = [];
    $('.eplister li').each((i, el) => {
      episodes.push({
        title: $(el).find('.epl-title').text().trim(),
        url: $(el).find('a').attr('href'),
        date: $(el).find('.epl-date').text().trim()
      });
    });

    return {
      status: true,
      data: {
        title,
        thumbnail,
        info,
        episodes,
        totalEpisodes: episodes.length
      }
    };

  } catch (error) {
    console.error('Detail error:', error);
    return {
      status: false,
      error: error.message
    };
  }
}

module.exports = searchAnime;
