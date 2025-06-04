const fetch = require("node-fetch");

/**
 * POLLINATIONS AI TEXT SCRAPER
 * Handles all text requests to Pollinations AI API
 * @param {string} message - The text message to send
 * @param {object} [options] - Optional configuration
 * @param {boolean} [options.stream=false] - Whether to use streaming
 * @returns {Promise<string>} - The AI response
 */
async function pollinationsAI(message, options = {}) {
  const {
    stream = false,
    timeout = 10000 // 10 seconds timeout
  } = options;

  // Validate input
  if (!message || typeof message !== 'string') {
    throw new Error('Message must be a non-empty string');
  }

  const url = 'https://text.pollinations.ai/openai';
  const data = {
    messages: [{
      role: "user",
      content: message
    }],
    stream: stream
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14; NX769J Build/UKQ1.230917.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.107 Mobile Safari/537.36'
      },
      body: JSON.stringify(data),
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

module.exports = pollinationsAI;
