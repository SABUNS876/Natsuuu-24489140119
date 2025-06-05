const axios = require('axios');
const cheerio = require('cheerio');

const gsmArenaScraper = {
  baseUrl: 'https://m.gsmarena.com',

  /**
   * Search for mobile devices
   * @param {string} query - Search term (e.g., "iPhone 15")
   * @returns {Promise<Array>} - Array of device results
   */
  async search(query) {
    try {
      const response = await axios.get(`${this.baseUrl}/results.php3`, {
        params: { sQuick: 1, sName: encodeURIComponent(query) },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
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
      console.error('Search error:', error.message);
      throw new Error('Failed to search devices');
    }
  },

  /**
   * Get device details
   * @param {string} deviceUrl - Device URL or ID (e.g., "apple_iphone_15-12553.php")
   * @returns {Promise<Object>} - Detailed device specifications
   */
  async getDetails(deviceUrl) {
    try {
      const url = deviceUrl.startsWith('http') ? deviceUrl : `${this.baseUrl}/${deviceUrl}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const specs = {};

      // Extract specifications
      $('.specs-table').each((i, table) => {
        const category = $(table).find('th').text().trim();
        specs[category] = {};

        $(table).find('tr').each((j, row) => {
          const feature = $(row).find('.ttl').text().trim();
          const value = $(row).find('.nfo').text().trim();
          if (feature && value) {
            specs[category][feature] = value;
          }
        });
      });

      return {
        name: $('.specs-phone-name-title').text().trim(),
        image: $('.specs-photo-main img').attr('src'),
        specs
      };
    } catch (error) {
      console.error('Details error:', error.message);
      throw new Error('Failed to get device details');
    }
  },

  /**
   * Express.js compatible handler
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async handler(req, res) {
    try {
      const { query, device } = req.query;

      if (device) {
        const details = await this.getDetails(device);
        return res.json(details);
      }

      if (query) {
        const results = await this.search(query);
        return res.json(results);
      }

      res.status(400).json({ 
        error: 'Missing parameters',
        usage: {
          search: '/gsmarena?query=iPhone',
          details: '/gsmarena?device=apple_iphone_15-12553.php'
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = gsmArenaScraper;
