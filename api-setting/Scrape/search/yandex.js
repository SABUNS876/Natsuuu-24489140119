const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeYandex(query, options = {}) {
  try {
    // Default options
    const {
      lang = 'en', // 'en' or 'ru'
      page = 0,     // Pagination
      timeout = 10000
    } = options;

    // 1. Make request to Yandex
    const url = `https://yandex.com/search/?text=${encodeURIComponent(query)}&lr=10363&p=${page}`;
    
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': `${lang},en-US;q=0.9`,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      timeout
    });

    // 2. Parse HTML
    const $ = cheerio.load(data);
    const results = [];

    // 3. Extract organic results
    $('.serp-item').each((i, el) => {
      const title = $(el).find('.organic__title-text').text().trim();
      const url = $(el).find('.path a.link').attr('href');
      const description = $(el).find('.organic__text').text().trim();
      
      if (title && url) {
        results.push({
          position: i + 1,
          title,
          url: url.startsWith('http') ? url : `https://yandex.com${url}`,
          description,
          type: 'organic'
        });
      }
    });

    // 4. Extract featured snippets
    $('.fact-answer').each((i, el) => {
      results.push({
        position: 0,
        title: 'Featured Snippet',
        content: $(el).text().trim(),
        type: 'featured'
      });
    });

    // 5. Extract related questions
    $('.misspell__message').each((i, el) => {
      results.push({
        type: 'related',
        question: $(el).text().trim()
      });
    });

    return {
      status: true,
      query,
      page,
      totalResults: results.length,
      results
    };

  } catch (error) {
    console.error('Scraping error:', error.message);
    return {
      status: false,
      error: error.message,
      tips: [
        'Try again later',
        'Check your network connection',
        'Yandex might have blocked your IP'
      ]
    };
  }
}

module.exports = scrapeYandex;
