const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');

async function searchIkoAppAnime(query) {
  try {
    if (!query || typeof query !== 'string') {
      return {
        status: false,
        message: 'Query harus berupa teks'
      };
    }

    const form = new FormData();
    form.append('q', query);
    form.append('type', '');
    form.append('genre', '');
    form.append('status', '');
    form.append('sort', '');

    const { data } = await axios.post(
      'https://ikatsu.web.id/anime/filter',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      }
    );

    const $ = cheerio.load(data);
    const results = [];

    $('.grid > div').each((_, el) => {
      const $el = $(el);
      const title = $el.find('h3').text().trim();
      const link = 'https://ikatsu.web.id/' + $el.find('a').attr('href');
      const image = $el.find('img').attr('src');
      const episode = $el.find('span').eq(0).text().trim();
      const type = $el.find('span').eq(1).text().trim();

      if (title && link) {
        results.push({
          title,
          link,
          image: image.startsWith('http') ? image : 'https://ikatsu.web.id' + image,
          episode,
          type
        });
      }
    });

    return {
      status: true,
      query,
      count: results.length,
      results
    };

  } catch (error) {
    console.error('Search error:', error.message);
    return {
      status: false,
      error: 'Gagal melakukan pencarian',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
}

module.exports = searchIkoAppAnime;
