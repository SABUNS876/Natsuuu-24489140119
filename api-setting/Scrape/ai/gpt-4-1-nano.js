const fetch = require("node-fetch");
const axios = require("axios");
const cheerio = require("cheerio"); // Untuk web scraping
const { google } = require('google-it'); // Untuk pencarian Google

/**
 * POLLINATIONS AI TEXT SCRAPER WITH WEB SEARCH CAPABILITIES
 * Handles all text requests to Pollinations AI API plus web search functions
 */
class EnhancedPollinationsAI {
  /**
   * Initialize with optional config
   * @param {object} [config] - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      pollinationsUrl: 'https://text.pollinations.ai/openai',
      searchTimeout: 10000,
      maxSearchResults: 5,
      ...config
    };
  }

  /**
   * Main AI text generation method
   * @param {string} message - The text message to send
   * @param {object} [options] - Optional configuration
   * @returns {Promise<string>} - The AI response
   */
  async generateText(message, options = {}) {
    // Validate input
    if (!message || typeof message !== 'string') {
      throw new Error('Message must be a non-empty string');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.config.searchTimeout);

    try {
      const response = await fetch(this.config.pollinationsUrl, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 14; NX769J Build/UKQ1.230917.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.107 Mobile Safari/537.36'
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: message }],
          stream: options.stream || false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();
      return result.choices[0].message.content;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }

  /**
   * Search Google and return top results
   * @param {string} query - Search query
   * @param {object} [options] - Optional parameters
   * @returns {Promise<Array>} - Array of search results
   */
  async searchGoogle(query, options = {}) {
    try {
      const results = await google({
        query,
        limit: options.limit || this.config.maxSearchResults,
        disableConsole: true
      });
      return results;
    } catch (error) {
      console.error('Google search error:', error);
      throw new Error('Failed to perform Google search');
    }
  }

  /**
   * Search and scrape a website
   * @param {string} url - URL to scrape
   * @param {string} [selector] - CSS selector to target specific content
   * @returns {Promise<string>} - Scraped content
   */
  async scrapeWebsite(url, selector = 'body') {
    try {
      const response = await axios.get(url, {
        timeout: this.config.searchTimeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const content = $(selector).text().trim();
      return content || 'No content found with the specified selector';
    } catch (error) {
      console.error('Scraping error:', error);
      throw new Error(`Failed to scrape website: ${error.message}`);
    }
  }

  /**
   * Enhanced AI generation with web search capabilities
   * @param {string} message - The query/message
   * @param {object} [options] - Options including search flags
   * @returns {Promise<string>} - AI response augmented with web data
   */
  async generateWithWebSearch(message, options = {}) {
    // First check if this is a search request
    const isSearchQuery = message.toLowerCase().startsWith('search:') || 
                          options.search;

    if (isSearchQuery) {
      const query = message.replace(/^search:/i, '').trim();
      try {
        // Get search results
        const results = await this.searchGoogle(query, options);
        
        // Optionally scrape the top result
        if (options.scrapeTopResult && results.length > 0) {
          const topResult = results[0];
          const scrapedContent = await this.scrapeWebsite(topResult.link, options.selector);
          return `Top result for "${query}": ${topResult.title}\n\nScraped content:\n${scrapedContent.substring(0, 1000)}...`;
        }
        
        // Format search results
        const formattedResults = results.map((r, i) => `${i + 1}. ${r.title}\n${r.link}`).join('\n\n');
        return `Search results for "${query}":\n\n${formattedResults}`;
      } catch (error) {
        return `I couldn't complete the web search. Error: ${error.message}`;
      }
    }

    // Default to regular AI generation
    return this.generateText(message, options);
  }
}

module.exports = EnhancedPollinationsAI;
