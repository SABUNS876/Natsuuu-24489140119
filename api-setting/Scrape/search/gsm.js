const axios = require('axios');
const cheerio = require('cheerio');

class GSMArenaScraper {
  constructor() {
    this.baseUrl = 'https://m.gsmarena.com';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };
  }

  /**
   * Search for devices
   * @param {string} query - Search term
   * @returns {Promise<Array>} - Array of search results
   */
  async searchDevices(query) {
    try {
      const response = await axios.get(`${this.baseUrl}/results.php3`, {
        params: { sQuick: 1, sName: query },
        headers: this.headers
      });

      const $ = cheerio.load(response.data);
      const results = [];

      $('.makers li').each((i, el) => {
        results.push({
          name: $(el).find('span').text().trim(),
          url: $(el).find('a').attr('href'),
          image: $(el).find('img').attr('src')
        });
      });

      return results;
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Get device details
   * @param {string} deviceUrl - Device URL or ID
   * @returns {Promise<Object>} - Detailed device specifications
   */
  async getDeviceDetails(deviceUrl) {
    try {
      const url = deviceUrl.startsWith('http') ? deviceUrl : `${this.baseUrl}/${deviceUrl}`;
      const response = await axios.get(url, { headers: this.headers });
      const $ = cheerio.load(response.data);

      // Extract basic info
      const device = {
        name: $('.specs-phone-name-title').text().trim(),
        image: $('.specs-photo-main img').attr('src'),
        quickSpecs: {}
      };

      // Extract quick specifications
      $('.quick-specs li').each((i, el) => {
        const key = $(el).find('strong').text().trim().replace(':', '');
        const value = $(el).clone().children().remove().end().text().trim();
        device.quickSpecs[key] = value;
      });

      // Extract full specifications
      device.specs = {};
      $('.specs-table').each((i, table) => {
        const category = $(table).find('th').text().trim();
        device.specs[category] = {};

        $(table).find('tr').each((j, row) => {
          const feature = $(row).find('.ttl').text().trim();
          const value = $(row).find('.nfo').text().trim();
          if (feature && value) {
            device.specs[category][feature] = value;
          }
        });
      });

      // Extract reviews and news
      device.reviews = [];
      $('.review-item').each((i, el) => {
        device.reviews.push({
          title: $(el).find('h3').text().trim(),
          url: $(el).find('a').attr('href'),
          summary: $(el).find('p').text().trim(),
          date: $(el).find('.date').text().trim()
        });
      });

      return device;
    } catch (error) {
      throw new Error(`Failed to get device details: ${error.message}`);
    }
  }

  /**
   * Get latest device news
   * @returns {Promise<Array>} - Array of news articles
   */
  async getLatestNews() {
    try {
      const response = await axios.get(this.baseUrl, { headers: this.headers });
      const $ = cheerio.load(response.data);
      const news = [];

      $('.news-item').each((i, el) => {
        news.push({
          title: $(el).find('h3').text().trim(),
          url: $(el).find('a').attr('href'),
          summary: $(el).find('p').text().trim(),
          image: $(el).find('img').attr('src'),
          date: $(el).find('.meta-line time').text().trim()
        });
      });

      return news;
    } catch (error) {
      throw new Error(`Failed to get news: ${error.message}`);
    }
  }
}

// Export single instance
module.exports = new GSMArenaScraper();
