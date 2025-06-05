const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

class WebScraper {
  constructor() {
    this.requestDelay = 1000; // 1 second delay between requests
    this.maxRetries = 3;
    this.timeout = 5000; // 5 seconds timeout
  }

  /**
   * Validate and normalize URL
   * @param {string} url - Target URL
   * @returns {string} - Normalized URL
   */
  validateUrl(url) {
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Only HTTP/HTTPS protocols are allowed');
      }
      return urlObj.href;
    } catch (error) {
      throw new Error(`Invalid URL: ${error.message}`);
    }
  }

  /**
   * Fetch webpage content
   * @param {string} url - Target URL
   * @returns {Promise<string>} - HTML content
   */
  async fetchPage(url) {
    const validatedUrl = this.validateUrl(url);
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.get(validatedUrl, {
          timeout: this.timeout,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        return response.data;
      } catch (error) {
        if (attempt === this.maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, this.requestDelay * attempt));
      }
    }
  }

  /**
   * Scrape webpage for common elements
   * @param {string} url - Target URL
   * @returns {Promise<Object>} - Scraped data
   */
  async scrape(url) {
    try {
      const html = await this.fetchPage(url);
      const $ = cheerio.load(html);

      const result = {
        url: url,
        title: $('title').text().trim(),
        metaDescription: $('meta[name="description"]').attr('content') || '',
        headings: {
          h1: $('h1').map((i, el) => $(el).text().trim()).get(),
          h2: $('h2').map((i, el) => $(el).text().trim()).get()
        },
        links: $('a[href]').map((i, el) => ({
          text: $(el).text().trim(),
          href: $(el).attr('href')
        })).get(),
        images: $('img').map((i, el) => ({
          src: $(el).attr('src'),
          alt: $(el).attr('alt') || ''
        })).get(),
        timestamp: new Date().toISOString()
      };

      return result;
    } catch (error) {
      throw new Error(`Scraping failed: ${error.message}`);
    }
  }
}

// Command-line interface
if (require.main === module) {
  if (process.argv.length < 3) {
    console.log('Usage: node scraper.js <URL>');
    process.exit(1);
  }

  const url = process.argv[2];
  const scraper = new WebScraper();

  scraper.scrape(url)
    .then(data => console.log(JSON.stringify(data, null, 2)))
    .catch(error => {
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = WebScraper;
